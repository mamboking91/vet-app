"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Esquema de validación para los datos que el usuario puede editar
const UserProfileSchema = z.object({
  nombre_completo: z.string().min(3, "El nombre completo debe tener al menos 3 caracteres."),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  localidad: z.string().optional(),
  provincia: z.string().optional(),
  codigo_postal: z.string().optional(),
});

export async function actualizarMisDatos(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const rawFormData = Object.fromEntries(formData);
  const validatedFields = UserProfileSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const { error: updateError } = await supabase
    .from('propietarios')
    .update({
      nombre_completo: validatedFields.data.nombre_completo,
      telefono: validatedFields.data.telefono || null,
      direccion: validatedFields.data.direccion || null,
      localidad: validatedFields.data.localidad || null,
      provincia: validatedFields.data.provincia || null,
      codigo_postal: validatedFields.data.codigo_postal || null,
    })
    .eq('id', user.id); // ¡Importante! Asegura que solo actualicen su propio perfil

  if (updateError) {
    return { success: false, error: { message: `Error al actualizar los datos: ${updateError.message}` } };
  }

  revalidatePath('/cuenta/datos');
  return { success: true, message: "Tus datos han sido actualizados correctamente." };
}