// app/dashboard/pacientes/[pacienteId]/historial/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Estos son los valores de tu ENUM tipo_registro_medico
const tiposRegistroMedico = [
  "Consulta", "Vacunación", "Desparasitación", "Procedimiento", 
  "Observación", "Análisis Laboratorio", "Imagenología", "Cirugía", "Otro"
] as const; // 'as const' para que Zod pueda inferir los literales

// Esquema para AGREGAR una entrada
const CreateHistorialMedicoSchema = z.object({
  paciente_id: z.string().uuid("ID de paciente inválido."),
  fecha_evento: z.string().refine((date) => date === '' || !isNaN(Date.parse(date)), { // Permite string vacío o fecha válida
    message: "Fecha del evento inválida.",
  }),
  tipo: z.enum(tiposRegistroMedico, {
    errorMap: () => ({ message: "Por favor, selecciona un tipo de registro válido." }),
  }),
  descripcion: z.string().min(1, "La descripción es requerida."),
  diagnostico: z.string().transform(val => val === '' ? undefined : val).optional(),
  tratamiento_indicado: z.string().transform(val => val === '' ? undefined : val).optional(),
  notas_seguimiento: z.string().transform(val => val === '' ? undefined : val).optional(),
});

// Esquema para ACTUALIZAR una entrada (todos los campos son opcionales, pero si se proveen deben ser válidos)
const UpdateHistorialMedicoSchema = z.object({
  fecha_evento: z.string().refine((date) => date === '' || !isNaN(Date.parse(date)), {
    message: "Fecha del evento inválida.",
  }).optional(),
  tipo: z.enum(tiposRegistroMedico).optional(),
  descripcion: z.string().min(1, "La descripción es requerida si se provee.").optional(), // Si se envía, no puede ser vacía
  diagnostico: z.string().transform(val => val === '' ? undefined : val).optional(),
  tratamiento_indicado: z.string().transform(val => val === '' ? undefined : val).optional(),
  notas_seguimiento: z.string().transform(val => val === '' ? undefined : val).optional(),
}).partial(); // .partial() asegura que todos los campos del objeto base sean opcionales


// --- ACCIÓN PARA AGREGAR UNA NUEVA ENTRADA AL HISTORIAL ---
export async function agregarEntradaHistorial(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const rawFormData = {
    paciente_id: formData.get("paciente_id"),
    fecha_evento: formData.get("fecha_evento"),
    tipo: formData.get("tipo"),
    descripcion: formData.get("descripcion"),
    diagnostico: formData.get("diagnostico"),
    tratamiento_indicado: formData.get("tratamiento_indicado"),
    notas_seguimiento: formData.get("notas_seguimiento"),
  };

  const validatedFields = CreateHistorialMedicoSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (agregarEntradaHistorial):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación. Por favor, revisa los campos.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }
  
  const dataToInsert = {
    paciente_id: validatedFields.data.paciente_id,
    fecha_evento: new Date(validatedFields.data.fecha_evento).toISOString().split('T')[0],
    tipo: validatedFields.data.tipo,
    descripcion: validatedFields.data.descripcion,
    diagnostico: validatedFields.data.diagnostico ?? null,
    tratamiento_indicado: validatedFields.data.tratamiento_indicado ?? null,
    notas_seguimiento: validatedFields.data.notas_seguimiento ?? null,
    veterinario_responsable_id: user.id, // Asigna el usuario actual como responsable
  };

  const { data, error: dbError } = await supabase
    .from("historiales_medicos")
    .insert([dataToInsert])
    .select().single();

  if (dbError) {
    console.error("Error al insertar entrada en historial:", dbError);
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
  }
  revalidatePath(`/dashboard/pacientes/${validatedFields.data.paciente_id}`);
  return { success: true, data };
}

// --- ACCIÓN PARA ACTUALIZAR UNA ENTRADA DE HISTORIAL EXISTENTE ---
export async function actualizarEntradaHistorial(historialId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const dataFromForm = {
    fecha_evento: formData.get("fecha_evento"),
    tipo: formData.get("tipo"),
    descripcion: formData.get("descripcion"),
    diagnostico: formData.get("diagnostico"),
    tratamiento_indicado: formData.get("tratamiento_indicado"),
    notas_seguimiento: formData.get("notas_seguimiento"),
  };

  const validatedFields = UpdateHistorialMedicoSchema.safeParse(dataFromForm);

  if (!validatedFields.success) {
    console.error("Error de validación (actualizarEntradaHistorial):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const dataToUpdate: { [key: string]: any } = {};
  if (validatedFields.data.fecha_evento !== undefined) {
    dataToUpdate.fecha_evento = new Date(validatedFields.data.fecha_evento).toISOString().split('T')[0];
  }
  if (validatedFields.data.tipo !== undefined) dataToUpdate.tipo = validatedFields.data.tipo;
  if (validatedFields.data.descripcion !== undefined) dataToUpdate.descripcion = validatedFields.data.descripcion;
  
  if (validatedFields.data.diagnostico !== undefined) dataToUpdate.diagnostico = validatedFields.data.diagnostico ?? null;
  if (validatedFields.data.tratamiento_indicado !== undefined) dataToUpdate.tratamiento_indicado = validatedFields.data.tratamiento_indicado ?? null;
  if (validatedFields.data.notas_seguimiento !== undefined) dataToUpdate.notas_seguimiento = validatedFields.data.notas_seguimiento ?? null;
  // Opcional: Podrías querer actualizar el veterinario_responsable_id si la edición la hace otro usuario
  // dataToUpdate.veterinario_responsable_id = user.id; 

  if (Object.keys(dataToUpdate).length === 0) {
    return { success: true, message: "No se proporcionaron datos para actualizar.", data: null };
  }

  const { data, error: dbError } = await supabase
    .from("historiales_medicos")
    .update(dataToUpdate)
    .eq("id", historialId)
    .select().single();

  if (dbError) {
    console.error('Error al actualizar entrada de historial:', dbError);
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
  }

  // Necesitamos el paciente_id para revalidar la página de detalles correcta.
  // La respuesta 'data' de la actualización contendrá la entrada actualizada, incluyendo paciente_id.
  if (data?.paciente_id) {
    revalidatePath(`/dashboard/pacientes/${data.paciente_id}`);
    revalidatePath(`/dashboard/pacientes/${data.paciente_id}/historial/${historialId}/editar`);
  }

  return { success: true, data };
}

// --- ACCIÓN PARA ELIMINAR UNA ENTRADA DE HISTORIAL ---
export async function eliminarEntradaHistorial(
    historialId: string,
    pacienteId: string // Se necesita para revalidar la ruta del paciente
) {
  const IdSchema = z.string().uuid("ID inválido.");
  const historialIdValidation = IdSchema.safeParse(historialId);
  const pacienteIdValidation = IdSchema.safeParse(pacienteId);

  if (!historialIdValidation.success || !pacienteIdValidation.success) {
    return { 
        success: false, 
        error: { message: "IDs proporcionados inválidos." } 
    };
  }

  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { 
        success: false,
        error: { message: "Usuario no autenticado." } 
    };
  }

  const { error: dbError } = await supabase
    .from("historiales_medicos")
    .delete()
    .eq("id", historialId)
    .eq("paciente_id", pacienteId); // Seguridad extra: solo borrar si también coincide el pacienteId

  if (dbError) {
    console.error('Error al eliminar entrada de historial:', dbError);
    return { 
        success: false,
        error: { message: `Error de base de datos al eliminar: ${dbError.message}` } 
    };
  }

  revalidatePath(`/dashboard/pacientes/${pacienteId}`);
  return { success: true, message: "Entrada de historial eliminada correctamente." };
}