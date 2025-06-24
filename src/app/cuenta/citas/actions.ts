"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { add } from 'date-fns';

const SolicitarCitaSchema = z.object({
  paciente_id: z.string().uuid("Debes seleccionar una mascota."),
  fecha_preferida: z.string().min(1, "Debes seleccionar una fecha."),
  // --- CORRECCIÓN AQUÍ: Se envuelve el mensaje de error en un objeto ---
  franja_horaria: z.enum(['mañana', 'tarde'], { 
    errorMap: () => ({ message: "Debes seleccionar una franja horaria." }) 
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
    return { success: false, error: { message: "Datos inválidos.", errors: validatedFields.error.flatten().fieldErrors } };
  }
  
  const { data: pacienteData, error: pacienteError } = await supabase
    .from('pacientes')
    .select('id, nombre, propietarios (nombre_completo, email, telefono)')
    .eq('id', validatedFields.data.paciente_id)
    .eq('propietario_id', user.id)
    .single();
    
  if (pacienteError || !pacienteData) {
    return { success: false, error: { message: "La mascota seleccionada no es válida." } };
  }

  const propietarioInfo = Array.isArray(pacienteData.propietarios) ? pacienteData.propietarios[0] : pacienteData.propietarios;

  const { error: insertError } = await supabase
    .from('solicitudes_cita_publica')
    .insert({
      propietario_id: user.id,
      paciente_id: pacienteData.id,
      nombre_cliente: propietarioInfo?.nombre_completo,
      email: propietarioInfo?.email,
      telefono: propietarioInfo?.telefono,
      nombre_mascota: pacienteData.nombre,
      motivo_cita: validatedFields.data.motivo,
      fecha_preferida: validatedFields.data.fecha_preferida,
      franja_horaria: validatedFields.data.franja_horaria,
      estado: 'pendiente',
    });

  if (insertError) {
    return { success: false, error: { message: `Error al registrar la solicitud: ${insertError.message}` } };
  }

  revalidatePath('/cuenta/citas');
  return { success: true, message: "Tu solicitud de cita ha sido enviada. Nos pondremos en contacto para confirmar." };
}