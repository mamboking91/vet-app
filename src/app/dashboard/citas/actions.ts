// app/dashboard/citas/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { 
  tiposDeCitaOpciones, // Array de objetos {value, label}
  estadosDeCitaOpciones, // Array de strings
  type TipoCitaValue,    // Tipo string literal union
  type EstadoCitaValue   // Tipo string literal union
} from "./types"; // Importamos las opciones y tipos desde types.ts

// Extraemos los valores para los enums de Zod
const tiposDeCitaValues = tiposDeCitaOpciones.map(t => t.value) as [TipoCitaValue, ...TipoCitaValue[]];
const estadosDeCitaValues = estadosDeCitaOpciones as readonly [EstadoCitaValue, ...EstadoCitaValue[]];


// Esquema base para los campos de una cita
const CitaSchemaBase = z.object({
  paciente_id: z.string().uuid("Debe seleccionar un paciente válido.").optional(), // Opcional aquí, se hace requerido en CreateCitaSchema
  fecha_hora_inicio: z.string().refine((datetime) => datetime === '' || !isNaN(Date.parse(datetime)), {
    message: "La fecha y hora de inicio no son válidas o están vacías.",
  }),
  duracion_estimada_minutos: z.coerce.number().int("Debe ser un número entero.").positive("Debe ser un número positivo.").optional().or(z.literal('').transform(() => undefined)),
  motivo: z.string().transform(val => val === '' ? undefined : val).optional(),
  tipo: z.enum(tiposDeCitaValues).optional().or(z.literal('').transform(() => undefined)),
  estado: z.enum(estadosDeCitaValues).optional().or(z.literal('').transform(() => undefined)),
  notas_cita: z.string().transform(val => val === '' ? undefined : val).optional(),
});

// Esquema para AGREGAR una cita (hace paciente_id y fecha_hora_inicio requeridos explícitamente)
const CreateCitaSchema = CitaSchemaBase.extend({
    paciente_id: z.string().uuid("Debe seleccionar un paciente válido."),
    fecha_hora_inicio: z.string().min(1, "La fecha y hora de inicio son requeridas.").refine((datetime) => !isNaN(Date.parse(datetime)), {
        message: "La fecha y hora de inicio no son válidas.",
    }),
    // 'tipo' podría ser requerido al crear, si es así:
    // tipo: z.enum(tiposDeCitaValues, { errorMap: () => ({ message: "Selecciona un tipo de cita válido."}) }),
});


// --- ACCIÓN PARA AGREGAR UNA NUEVA CITA ---
export async function agregarCita(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const rawFormData = {
    paciente_id: formData.get("paciente_id"),
    fecha_hora_inicio: formData.get("fecha_hora_inicio"),
    duracion_estimada_minutos: formData.get("duracion_estimada_minutos"),
    motivo: formData.get("motivo"),
    tipo: formData.get("tipo"),
    notas_cita: formData.get("notas_cita"),
    // estado no se toma del form al crear, se pone por defecto 'Programada'
  };

  const validatedFields = CreateCitaSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (agregarCita):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación. Por favor, revisa los campos.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const fechaHoraInicioISO = new Date(validatedFields.data.fecha_hora_inicio).toISOString();
  let fechaHoraFinISO: string | null = null;
  if (validatedFields.data.duracion_estimada_minutos) {
    const inicio = new Date(fechaHoraInicioISO);
    inicio.setMinutes(inicio.getMinutes() + validatedFields.data.duracion_estimada_minutos);
    fechaHoraFinISO = inicio.toISOString();
  }

  const dataToInsert = {
    paciente_id: validatedFields.data.paciente_id,
    fecha_hora_inicio: fechaHoraInicioISO,
    fecha_hora_fin: fechaHoraFinISO,
    duracion_estimada_minutos: validatedFields.data.duracion_estimada_minutos ?? null,
    motivo: validatedFields.data.motivo ?? null,
    tipo: validatedFields.data.tipo ?? null, // Usa el tipo validado
    notas_cita: validatedFields.data.notas_cita ?? null,
    estado: 'Programada' as EstadoCitaValue, // Estado inicial por defecto, casteado al tipo
    veterinario_asignado_id: user.id, 
  };

  const { data, error: dbError } = await supabase
    .from("citas")
    .insert([dataToInsert])
    .select().single();

  if (dbError) {
    console.error("Error al programar la cita:", dbError);
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
  }

  revalidatePath("/dashboard/citas");
  revalidatePath("/dashboard");
  return { success: true, data };
}

// --- ACCIÓN PARA ACTUALIZAR UNA CITA EXISTENTE ---
export async function actualizarCita(citaId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const IdSchema = z.string().uuid("ID de cita inválido.");
  if (!IdSchema.safeParse(citaId).success) {
      return { success: false, error: { message: "ID de cita proporcionado no es válido." }};
  }

  const rawFormData = {
    // paciente_id no se actualiza desde el formulario aquí.
    fecha_hora_inicio: formData.get("fecha_hora_inicio"),
    duracion_estimada_minutos: formData.get("duracion_estimada_minutos"),
    motivo: formData.get("motivo"),
    tipo: formData.get("tipo"),
    estado: formData.get("estado"),
    notas_cita: formData.get("notas_cita"),
  };

  // Usamos .partial() para que todos los campos sean opcionales, pero si se envían, deben ser válidos.
  const validatedFields = CitaSchemaBase.partial().safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (actualizarCita):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const dataToUpdate: { [key: string]: any } = {
    updated_at: new Date().toISOString(), // Siempre actualizamos este campo
  };

  // Construimos el objeto de actualización solo con los campos que realmente se enviaron y validaron
  if (validatedFields.data.fecha_hora_inicio !== undefined) {
    dataToUpdate.fecha_hora_inicio = new Date(validatedFields.data.fecha_hora_inicio).toISOString();
  }
  if (validatedFields.data.duracion_estimada_minutos !== undefined) {
    dataToUpdate.duracion_estimada_minutos = validatedFields.data.duracion_estimada_minutos ?? null;
    
    // Recalcular fecha_hora_fin si la duración o la fecha de inicio cambian
    const inicioParaCalculo = dataToUpdate.fecha_hora_inicio || (await supabase.from('citas').select('fecha_hora_inicio').eq('id', citaId).single()).data?.fecha_hora_inicio;
    
    if (inicioParaCalculo && dataToUpdate.duracion_estimada_minutos) { // Si la duración es un número positivo
        const inicio = new Date(inicioParaCalculo);
        inicio.setMinutes(inicio.getMinutes() + dataToUpdate.duracion_estimada_minutos);
        dataToUpdate.fecha_hora_fin = inicio.toISOString();
    } else if (inicioParaCalculo && dataToUpdate.duracion_estimada_minutos === null) { // Si la duración se borra
        dataToUpdate.fecha_hora_fin = null; 
    }
  }
  if (validatedFields.data.motivo !== undefined) dataToUpdate.motivo = validatedFields.data.motivo ?? null;
  if (validatedFields.data.tipo !== undefined) dataToUpdate.tipo = validatedFields.data.tipo ?? null;
  if (validatedFields.data.estado !== undefined) dataToUpdate.estado = validatedFields.data.estado ?? null;
  if (validatedFields.data.notas_cita !== undefined) dataToUpdate.notas_cita = validatedFields.data.notas_cita ?? null;
  // No actualizamos veterinario_asignado_id aquí a menos que sea una lógica específica

  if (Object.keys(dataToUpdate).length <= 1 && dataToUpdate.updated_at) { 
    return { success: true, message: "No se proporcionaron datos diferentes para actualizar.", data: null };
  }

  const { data, error: dbError } = await supabase
    .from("citas")
    .update(dataToUpdate)
    .eq("id", citaId)
    .select("id, paciente_id").single();

  if (dbError) {
    console.error("Error al actualizar la cita:", dbError);
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
  }

  if (data?.paciente_id) {
    revalidatePath(`/dashboard/pacientes/${data.paciente_id}`);
  }
  revalidatePath("/dashboard/citas");
  revalidatePath(`/dashboard/citas/${citaId}/editar`);
  revalidatePath("/dashboard");
  return { success: true, data };
}

// --- ACCIÓN PARA CAMBIAR EL ESTADO DE UNA CITA (EJ. CANCELAR) ---
export async function cambiarEstadoCita(
  citaId: string, 
  nuevoEstado: EstadoCitaValue,
  pacienteId?: string // Opcional, para revalidar la página del paciente si se conoce
) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const IdSchema = z.string().uuid("ID de cita inválido.");
  if (!IdSchema.safeParse(citaId).success) {
      return { success: false, error: { message: "ID de cita proporcionado no es válido." }};
  }

  const EstadoSchema = z.enum(estadosDeCitaValues); // Usa los valores del enum importado
  if (!EstadoSchema.safeParse(nuevoEstado).success) {
    return { success: false, error: { message: "Estado de cita proporcionado no es válido." }};
  }

  const { data, error: dbError } = await supabase
    .from("citas")
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq("id", citaId)
    .select("id, paciente_id").single();

  if (dbError) {
    console.error(`Error al cambiar estado de la cita ${citaId} a ${nuevoEstado}:`, dbError);
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
  }

  if (!data) {
    return { success: false, error: { message: "No se encontró la cita para actualizar el estado."}};
  }

  revalidatePath("/dashboard/citas");
  if (data.paciente_id) { // data aquí es la cita actualizada que incluye paciente_id
    revalidatePath(`/dashboard/pacientes/${data.paciente_id}`);
  }
  revalidatePath(`/dashboard/citas/${citaId}/editar`);
  revalidatePath("/dashboard");

  return { success: true, data, message: `Cita actualizada a estado: ${nuevoEstado}` };
}