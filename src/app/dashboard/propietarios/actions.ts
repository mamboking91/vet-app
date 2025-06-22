"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Esquema de Zod basado en tu versión, que será la "fuente de la verdad".
const PropietarioSchemaBase = z.object({
  nombre_completo: z.string().min(3, "El nombre completo es requerido y debe tener al menos 3 caracteres."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  telefono: z.string().optional().transform(val => val === '' ? undefined : val),
  direccion: z.string().optional().transform(val => val === '' ? undefined : val),
  notas: z.string().optional().transform(val => val === '' ? undefined : val),
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
      notas: formData.get('notas'),
    };

    const validatedFields = PropietarioSchemaBase.safeParse(rawFormData);

    if (!validatedFields.success) {
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
      notas: validatedFields.data.notas ?? null,
    };

    const { data, error: dbError } = await supabase
      .from('propietarios')
      .insert([dataToInsert])
      .select()
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
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
      notas: formData.get('notas'),
    };
    
    const validatedFields = PropietarioSchemaBase.partial().safeParse(rawFormData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors },
      };
    }

    const { error: dbError } = await supabase
      .from('propietarios')
      .update(validatedFields.data)
      .eq('id', id)

    if (dbError) {
      if (dbError.code === '23505') {
          let fieldMessage = "Un campo único ya existe.";
          if (dbError.message.includes('nombre_completo')) fieldMessage = "Ya existe un propietario con este nombre.";
          if (dbError.message.includes('email')) fieldMessage = "Este email ya está registrado.";
          return { success: false, error: { message: fieldMessage } };
      }
      return { success: false, error: { message: `Error de base de datos al actualizar: ${dbError.message}` } };
    }

    revalidatePath('/dashboard/propietarios');
    revalidatePath(`/dashboard/propietarios/${id}/editar`);
    revalidatePath(`/dashboard/propietarios/${id}`);
    return { success: true, message: "Propietario actualizado correctamente." };

  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

// --- FUNCIÓN ELIMINAR PROPIETARIO (Versión final y robusta) ---
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
  
    // 1. Buscamos proactivamente si hay pacientes asociados
    const { data: pacientes, error: pacientesError } = await supabase
        .from('pacientes')
        .select('nombre')
        .eq('propietario_id', id);

    if (pacientesError) {
        return { success: false, error: { message: `Error al verificar pacientes: ${pacientesError.message}` } };
    }

    if (pacientes && pacientes.length > 0) {
        const nombresPacientes = pacientes.map(p => p.nombre).join(', ');
        return { 
            success: false, 
            error: { 
                message: `No se puede eliminar. Pacientes asociados: ${nombresPacientes}. Primero debe eliminar o reasignar estos pacientes. Nota: Un paciente no puede ser eliminado si tiene historial médico.` 
            } 
        };
    }

    // 2. Buscamos proactivamente si hay facturas asociadas
    const { data: facturas, error: facturasError } = await supabase
        .from('facturas')
        .select('numero_factura', { count: 'exact', head: true }) // Solo necesitamos saber si existe alguna
        .eq('propietario_id', id);
        
    if (facturasError) {
        return { success: false, error: { message: `Error al verificar facturas: ${facturasError.message}` }};
    }

    if (facturas) {
        return {
            success: false,
            error: {
                message: "No se puede eliminar el propietario porque tiene facturas asociadas. Considere desactivar al propietario en lugar de eliminarlo para mantener la integridad de los registros contables."
            }
        };
    }
  
    // 3. Si no hay pacientes ni facturas, procedemos con la eliminación.
    const { error: dbError } = await supabase
      .from('propietarios')
      .delete()
      .eq('id', id); 
  
    if (dbError) {
      return { success: false, error: { message: `Error de base de datos al eliminar: ${dbError.message}` } };
    }
  
    revalidatePath('/dashboard/propietarios');
    return { success: true, message: "Propietario eliminado correctamente." };

  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado en eliminarPropietario: ${e.message}` } };
  }
}
