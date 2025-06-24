"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { 
  tiposDeCitaOpciones,
  estadosDeCitaOpciones,
  type TipoCitaValue,
  type EstadoCitaValue
} from "./types";

const tiposDeCitaValues = tiposDeCitaOpciones.map(t => t.value) as [TipoCitaValue, ...TipoCitaValue[]];
const estadosDeCitaValues = estadosDeCitaOpciones as readonly [EstadoCitaValue, ...EstadoCitaValue[]];

const CitaSchemaBase = z.object({
  paciente_id: z.string().uuid("Debe seleccionar un paciente válido.").optional(),
  fecha_hora_inicio: z.string().refine((datetime) => datetime === '' || !isNaN(Date.parse(datetime)), {
    message: "La fecha y hora de inicio no son válidas o están vacías.",
  }),
  duracion_estimada_minutos: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  motivo: z.string().transform(val => val === '' ? undefined : val).optional(),
  tipo: z.enum(tiposDeCitaValues).optional().or(z.literal('').transform(() => undefined)),
  estado: z.enum(estadosDeCitaValues).optional().or(z.literal('').transform(() => undefined)),
  notas_cita: z.string().transform(val => val === '' ? undefined : val).optional(),
  solicitud_id: z.string().uuid().optional().or(z.literal('')), 
});

const CreateCitaSchema = CitaSchemaBase.extend({
    paciente_id: z.string().uuid("Debe seleccionar un paciente válido."),
    fecha_hora_inicio: z.string().min(1, "La fecha y hora de inicio son requeridas.").refine((datetime) => !isNaN(Date.parse(datetime)), {
        message: "La fecha y hora de inicio no son válidas.",
    }),
});

export async function agregarCita(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const rawFormData = Object.fromEntries(formData);
  const validatedFields = CreateCitaSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const { solicitud_id, ...citaData } = validatedFields.data;

  const fechaHoraInicioISO = new Date(citaData.fecha_hora_inicio).toISOString();
  let fechaHoraFinISO: string | null = null;
  if (citaData.duracion_estimada_minutos) {
    const inicio = new Date(fechaHoraInicioISO);
    inicio.setMinutes(inicio.getMinutes() + citaData.duracion_estimada_minutos);
    fechaHoraFinISO = inicio.toISOString();
  }

  const dataToInsert = {
    paciente_id: citaData.paciente_id,
    fecha_hora_inicio: fechaHoraInicioISO,
    fecha_hora_fin: fechaHoraFinISO,
    duracion_estimada_minutos: citaData.duracion_estimada_minutos ?? null,
    motivo: citaData.motivo ?? null,
    tipo: citaData.tipo ?? null,
    notas_cita: citaData.notas_cita ?? null,
    estado: 'Programada' as EstadoCitaValue,
    veterinario_asignado_id: user.id, 
  };

  const { data, error: dbError } = await supabase
    .from("citas")
    .insert([dataToInsert])
    .select().single();

  if (dbError) {
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
  }

  if (solicitud_id) {
    await supabase
        .from('solicitudes_cita_publica')
        // --- CORRECCIÓN AQUÍ: Usamos el estado 'completada' ---
        .update({ estado: 'completada' })
        .eq('id', solicitud_id);
    
    revalidatePath('/dashboard/solicitudes-citas');
  }

  revalidatePath("/dashboard/citas");
  revalidatePath("/dashboard");
  return { success: true, data };
}

// La función actualizarCita se mantiene igual...
export async function actualizarCita(citaId: string, formData: FormData) {
  // ... (código existente sin cambios)
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

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = CitaSchemaBase.partial().safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const { solicitud_id, ...dataToUpdate } = validatedFields.data;

  if (Object.keys(dataToUpdate).length === 0) { 
    return { success: true, message: "No se proporcionaron datos diferentes para actualizar.", data: null };
  }

  const { data, error: dbError } = await supabase
    .from("citas")
    .update(dataToUpdate)
    .eq("id", citaId)
    .select("id, paciente_id").single();

  if (dbError) {
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