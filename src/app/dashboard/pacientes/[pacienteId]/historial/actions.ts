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

const HistorialMedicoSchema = z.object({
  paciente_id: z.string().uuid("ID de paciente inválido."),
  fecha_evento: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Fecha del evento inválida.",
  }),
  tipo: z.enum(tiposRegistroMedico, {
    errorMap: () => ({ message: "Por favor, selecciona un tipo de registro válido." }),
  }),
  descripcion: z.string().min(1, "La descripción es requerida."),
  diagnostico: z.string().optional().transform(val => val === '' ? undefined : val),
  tratamiento_indicado: z.string().optional().transform(val => val === '' ? undefined : val),
  notas_seguimiento: z.string().optional().transform(val => val === '' ? undefined : val),
});

export async function agregarEntradaHistorial(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: { message: "Usuario no autenticado." },
    };
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

  const validatedFields = HistorialMedicoSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (agregarEntradaHistorial):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: {
        message: "Error de validación. Por favor, revisa los campos.",
        errors: validatedFields.error.flatten().fieldErrors,
      },
    };
  }

  const dataToInsert = {
    paciente_id: validatedFields.data.paciente_id,
    fecha_evento: new Date(validatedFields.data.fecha_evento).toISOString().split('T')[0], // Formato YYYY-MM-DD
    tipo: validatedFields.data.tipo,
    descripcion: validatedFields.data.descripcion,
    diagnostico: validatedFields.data.diagnostico ?? null,
    tratamiento_indicado: validatedFields.data.tratamiento_indicado ?? null,
    notas_seguimiento: validatedFields.data.notas_seguimiento ?? null,
    veterinario_responsable_id: user.id, // Asignar el usuario actual como responsable
  };

  const { data, error: dbError } = await supabase
    .from("historiales_medicos")
    .insert([dataToInsert])
    .select()
    .single();

  if (dbError) {
    console.error("Error al insertar entrada en historial:", dbError);
    return {
      success: false,
      error: { message: `Error de base de datos: ${dbError.message}` },
    };
  }

  // Revalidar la página de detalles del paciente para que muestre la nueva entrada
  revalidatePath(`/dashboard/pacientes/${validatedFields.data.paciente_id}`);
  return { success: true, data };
}