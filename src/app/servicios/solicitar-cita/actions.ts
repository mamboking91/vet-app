"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const SolicitudPublicaSchema = z.object({
  nombre_cliente: z.string().min(3, "El nombre es demasiado corto."),
  email: z.string().email("El email no es válido."),
  telefono: z.string().min(9, "El teléfono no es válido."),
  nombre_mascota: z.string().min(2, "El nombre de la mascota es demasiado corto."),
  descripcion_mascota: z.string().optional(),
  motivo_cita: z.string().min(10, "El motivo debe tener al menos 10 caracteres."),
});

export async function crearSolicitudPublica(formData: FormData) {
  const supabase = createServerActionClient({ cookies });
  const rawFormData = Object.fromEntries(formData);
  const validatedFields = SolicitudPublicaSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: { message: "Datos inválidos.", errors: validatedFields.error.flatten().fieldErrors } };
  }

  const { error } = await supabase.from('solicitudes_cita_publica').insert(validatedFields.data);

  if (error) {
    return { success: false, error: { message: `Error en la base de datos: ${error.message}` } };
  }

  return { success: true, message: "¡Gracias! Hemos recibido tu solicitud y te contactaremos pronto." };
}