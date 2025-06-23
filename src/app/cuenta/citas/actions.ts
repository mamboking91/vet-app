"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { add } from 'date-fns';

const SolicitarCitaSchema = z.object({
  paciente_id: z.string().uuid("Debes seleccionar una mascota."),
  fecha_preferida: z.string().min(1, "Debes seleccionar una fecha."),
  // --- CORRECCIÓN AQUÍ ---
  franja_horaria: z.enum(['mañana', 'tarde'], {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return { message: "Debes seleccionar una franja horaria." };
      }
      return { message: ctx.defaultError };
    },
  }),
  motivo: z.string().min(10, "El motivo debe tener al menos 10 caracteres.").max(500, "El motivo no puede exceder los 500 caracteres."),
});

export async function solicitarNuevaCita(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const rawFormData = Object.fromEntries(formData);
  const validatedFields = SolicitarCitaSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: { message: "Datos inválidos.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const { data: pacienteData, error: pacienteError } = await supabase
    .from('pacientes')
    .select('id')
    .eq('id', validatedFields.data.paciente_id)
    .eq('propietario_id', user.id)
    .single();
    
  if (pacienteError || !pacienteData) {
    return { success: false, error: { message: "La mascota seleccionada no es válida." } };
  }
  
  const fecha = new Date(validatedFields.data.fecha_preferida);
  const hora = validatedFields.data.franja_horaria === 'mañana' ? 10 : 16;
  const fechaHoraInicio = add(fecha, { hours: hora });

  const { data: nuevaCita, error: insertError } = await supabase
    .from('citas')
    .insert({
      paciente_id: validatedFields.data.paciente_id,
      fecha_hora_inicio: fechaHoraInicio.toISOString(),
      motivo: validatedFields.data.motivo,
      estado: 'Pendiente de Confirmación', 
      tipo: 'Consulta General',
    })
    .select('id')
    .single();

  if (insertError) {
    return { success: false, error: { message: `Error al registrar la solicitud: ${insertError.message}` } };
  }

  revalidatePath('/cuenta/citas');
  return { success: true, message: "Tu solicitud de cita ha sido enviada. Nos pondremos en contacto para confirmar." };
}