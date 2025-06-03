// app/dashboard/propietarios/actions.ts
"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Esquema de Zod para la validación de datos del propietario
// (usado tanto para creación como para actualización con .partial())
const PropietarioSchemaBase = z.object({
  nombre_completo: z.string().min(3, "El nombre completo es requerido y debe tener al menos 3 caracteres."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  telefono: z.string().optional().transform(val => val === '' ? undefined : val),
  direccion: z.string().optional().transform(val => val === '' ? undefined : val),
  notas: z.string().optional().transform(val => val === '' ? undefined : val), // Campo de notas
});


// --- FUNCIÓN AGREGAR PROPIETARIO ---
export async function agregarPropietario(formData: FormData) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: { message: "Usuario no autenticado." } };
    }

    const rawFormData = {
      nombre_completo: formData.get('nombre_completo'),
      email: formData.get('email'),
      telefono: formData.get('telefono'),
      direccion: formData.get('direccion'),
      notas: formData.get('notas'), // Usamos 'notas'
    };

    // Usamos el esquema base directamente para la creación (todos los campos opcionales excepto nombre_completo)
    const validatedFields = PropietarioSchemaBase.safeParse(rawFormData);

    if (!validatedFields.success) {
      console.error("Error de validación (agregarPropietario):", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        error: { message: "Error de validación. Por favor, revisa los campos.", errors: validatedFields.error.flatten().fieldErrors },
      };
    }
    
    const dataToInsert = {
      nombre_completo: validatedFields.data.nombre_completo,
      email: validatedFields.data.email ?? null,
      telefono: validatedFields.data.telefono ?? null,
      direccion: validatedFields.data.direccion ?? null,
      notas: validatedFields.data.notas ?? null, // Usamos 'notas'
      // created_at y updated_at serán manejados por la BD si tienen DEFAULT NOW() y triggers
    };

    const { data, error: dbError } = await supabase
      .from('propietarios')
      .insert([dataToInsert])
      .select()
      .single();

    if (dbError) {
      console.error('Error al insertar propietario:', dbError);
      // Manejar error de unicidad si 'nombre_completo' o 'email' deben ser únicos
      if (dbError.code === '23505') { // Error de violación de unicidad
          let fieldMessage = "Un campo único ya existe.";
          if (dbError.message.includes('nombre_completo')) fieldMessage = "Ya existe un propietario con este nombre.";
          if (dbError.message.includes('email')) fieldMessage = "Este email ya está registrado.";
          return { success: false, error: { message: fieldMessage } };
      }
      return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
    }

    revalidatePath('/dashboard/propietarios');
    return { success: true, data, message: "Propietario añadido correctamente." };

  } catch (e: any) {
    console.error("Error inesperado en agregarPropietario:", e);
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

// --- FUNCIÓN ACTUALIZAR PROPIETARIO ---
export async function actualizarPropietario(id: string, formData: FormData) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: { message: "Usuario no autenticado." } };
    }

    if (!z.string().uuid().safeParse(id).success) {
        return { success: false, error: { message: "ID de propietario inválido." }};
    }

    const rawFormData = {
      nombre_completo: formData.get('nombre_completo'),
      email: formData.get('email'),
      telefono: formData.get('telefono'),
      direccion: formData.get('direccion'),
      notas: formData.get('notas'), // Usamos 'notas'
    };
    
    // Usamos .partial() para que solo se validen y actualicen los campos enviados
    const validatedFields = PropietarioSchemaBase.partial().safeParse(rawFormData);

    if (!validatedFields.success) {
      console.error("Error de validación (actualizarPropietario):", validatedFields.error.flatten().fieldErrors);
      return {
        success: false,
        error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors },
      };
    }

    const dataToUpdate: { [key: string]: any } = {};
    let hasChanges = false;

    // Construir el objeto de actualización solo con los campos que tienen valor y fueron validados
    (Object.keys(validatedFields.data) as Array<keyof typeof validatedFields.data>).forEach(key => {
        if (validatedFields.data[key] !== undefined) { // Solo incluir si el campo fue validado (no undefined)
            dataToUpdate[key] = validatedFields.data[key] ?? null; // Convertir undefined (de Zod optional) a null para la BD
            hasChanges = true;
        }
    });
    
    if (!hasChanges) {
      return { success: true, message: "No se proporcionaron datos diferentes para actualizar.", data: null };
    }

    // El trigger de la BD debería manejar updated_at
    // Si no, añade: dataToUpdate.updated_at = new Date().toISOString();

    const { data, error: dbError } = await supabase
      .from('propietarios')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      console.error('Error al actualizar propietario:', dbError);
      if (dbError.code === '23505') { // Error de violación de unicidad
          let fieldMessage = "Un campo único ya existe.";
          if (dbError.message.includes('nombre_completo')) fieldMessage = "Ya existe un propietario con este nombre.";
          if (dbError.message.includes('email')) fieldMessage = "Este email ya está registrado.";
          return { success: false, error: { message: fieldMessage } };
      }
      return { success: false, error: { message: `Error de base de datos al actualizar: ${dbError.message}` } };
    }

    revalidatePath('/dashboard/propietarios');
    revalidatePath(`/dashboard/propietarios/${id}/editar`); // Revalida la página de edición
    revalidatePath(`/dashboard/propietarios/${id}`); // Revalida la página de detalle si existe
    return { success: true, data, message: "Propietario actualizado correctamente." };

  } catch (e: any) {
    console.error("Error inesperado en actualizarPropietario:", e);
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

// --- FUNCIÓN ELIMINAR PROPIETARIO ---
export async function eliminarPropietario(id: string) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
  
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: { message: "Usuario no autenticado." } };
    }

    if (!z.string().uuid().safeParse(id).success) {
        return { success: false, error: { message: "ID de propietario inválido." }};
    }
  
    // Considerar restricciones de clave foránea (pacientes asociados)
    const { error: dbError, count } = await supabase
      .from('propietarios')
      .delete({ count: 'exact' }) // Para saber si se eliminó algo
      .eq('id', id); 
  
    if (dbError) {
      console.error('Error al eliminar propietario:', dbError);
      if (dbError.code === '23503') { // Foreign key violation
        return { success: false, error: { message: "No se puede eliminar el propietario porque tiene pacientes asociados. Elimine o reasigne los pacientes primero." } };
      }
      return { success: false, error: { message: `Error de base de datos al eliminar: ${dbError.message}` } };
    }

    if (count === 0) {
        return { success: false, error: { message: "El propietario no se encontró o no se pudo eliminar." } };
    }
  
    revalidatePath('/dashboard/propietarios');
    return { success: true, message: "Propietario eliminado correctamente." };

  } catch (e: any) {
    console.error("Error inesperado en eliminarPropietario:", e);
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}
