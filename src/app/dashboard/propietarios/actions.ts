// app/dashboard/propietarios/actions.ts
"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Esquema de Zod para la creación
const PropietarioSchema = z.object({
  nombre_completo: z.string().min(3, "El nombre completo es requerido y debe tener al menos 3 caracteres."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  notas_adicionales: z.string().optional(),
});

// Esquema de Zod para la actualización
const UpdatePropietarioSchema = z.object({
  nombre_completo: z.string().min(3, "El nombre completo es requerido y debe tener al menos 3 caracteres.").optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  notas_adicionales: z.string().optional(),
});

// --- FUNCIÓN AGREGAR PROPIETARIO ---
export async function agregarPropietario(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: "Usuario no autenticado." } };
  }

  const rawFormData = {
    nombre_completo: formData.get('nombre_completo'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    direccion: formData.get('direccion'),
    notas_adicionales: formData.get('notas_adicionales'),
  };

  const validatedFields = PropietarioSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    console.error("Validation errors (agregar):", validatedFields.error.flatten().fieldErrors);
    return {
      error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }
  
  const dataToInsert = {
    nombre_completo: validatedFields.data.nombre_completo,
    email: validatedFields.data.email || null,
    telefono: validatedFields.data.telefono || null,
    direccion: validatedFields.data.direccion || null,
    notas_adicionales: validatedFields.data.notas_adicionales || null,
  };

  const { data, error: dbError } = await supabase
    .from('propietarios')
    .insert([dataToInsert])
    .select()
    .single();

  if (dbError) {
    console.error('Error al insertar propietario:', dbError);
    return { error: { message: `Error de base de datos: ${dbError.message}` } };
  }

  revalidatePath('/dashboard/propietarios');
  return { data };
}

// --- FUNCIÓN ACTUALIZAR PROPIETARIO ---
export async function actualizarPropietario(
  id: string, 
  dataToUpdate: Partial<{
    nombre_completo?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    notas_adicionales?: string;
  }>
) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: { message: "Usuario no autenticado." } };
  }

  const validatedFields = UpdatePropietarioSchema.safeParse(dataToUpdate);
  if (!validatedFields.success) {
    console.error("Validation errors (update):", validatedFields.error.flatten().fieldErrors);
    return {
      error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }
  
  const updatePayload: { [key: string]: any } = {};
  if (validatedFields.data.nombre_completo !== undefined) updatePayload.nombre_completo = validatedFields.data.nombre_completo;
  if (validatedFields.data.email !== undefined) updatePayload.email = validatedFields.data.email || null;
  // ... (resto de los campos para updatePayload) ...
  if (validatedFields.data.telefono !== undefined) updatePayload.telefono = validatedFields.data.telefono || null;
  if (validatedFields.data.direccion !== undefined) updatePayload.direccion = validatedFields.data.direccion || null;
  if (validatedFields.data.notas_adicionales !== undefined) updatePayload.notas_adicionales = validatedFields.data.notas_adicionales || null;


  if (Object.keys(updatePayload).length === 0) {
    // Considera si esto es un error o simplemente no hacer nada.
    // Si no se actualiza nada, quizás es mejor no devolver un error sino un mensaje informativo o éxito sin cambios.
    // Por ahora, lo mantenemos como estaba, pero es algo a pensar.
    return { error: { message: "No hay datos para actualizar." } };
  }

  const { data, error: dbError } = await supabase
    .from('propietarios')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (dbError) {
    console.error('Error al actualizar propietario:', dbError);
    return { error: { message: `Error de base de datos: ${dbError.message}` } };
  }

  revalidatePath('/dashboard/propietarios');
  revalidatePath(`/dashboard/propietarios/${id}/editar`);
  return { data };
}

//FUNCION ELIMINAR PROPIETARIO
export async function eliminarPropietario(id: string) {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
  
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: { message: "Usuario no autenticado." } };
    }
  
    // Antes de eliminar, podrías querer verificar si este propietario tiene entidades asociadas
    // (por ejemplo, pacientes) y decidir cómo manejarlo (eliminar en cascada, prevenir, etc.).
    // Esto depende de tus reglas de negocio y cómo hayas configurado las claves foráneas (ON DELETE).
    // Por ahora, asumimos que la eliminación directa es lo deseado o que la BD lo maneja.
  
    const { error: dbError } = await supabase
      .from('propietarios')
      .delete()
      .eq('id', id); // Condición WHERE para eliminar solo el propietario correcto
  
    if (dbError) {
      console.error('Error al eliminar propietario:', dbError);
      // Podrías tener un error si, por ejemplo, hay restricciones de clave foránea
      // que impiden la eliminación (si no está configurado ON DELETE CASCADE).
      return { error: { message: `Error de base de datos: ${dbError.message}` } };
    }
  
    revalidatePath('/dashboard/propietarios'); // Revalida la lista de propietarios
    
    // Devolver un objeto de éxito es opcional, pero puede ser útil.
    // Podrías devolver el ID del propietario eliminado o un mensaje de éxito.
    return { success: true, message: "Propietario eliminado correctamente." };
  }