// src/app/dashboard/propietarios/actions.ts
"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Esquema de Zod actualizado para incluir los campos desglosados
const PropietarioSchemaBase = z.object({
  nombre_completo: z.string().min(3, "El nombre completo es requerido y debe tener al menos 3 caracteres."),
  email: z.string().email("Email inválido.").optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  telefono: z.string().optional().transform(val => val === '' ? undefined : val),
  direccion: z.string().optional().transform(val => val === '' ? undefined : val),
  localidad: z.string().optional().transform(val => val === '' ? undefined : val),
  provincia: z.string().optional().transform(val => val === '' ? undefined : val),
  codigo_postal: z.string().optional().transform(val => val === '' ? undefined : val),
  notas: z.string().optional().transform(val => val === '' ? undefined : val),
});


// --- FUNCIÓN AGREGAR PROPIETARIO (ACTUALIZADA) ---
export async function agregarPropietario(formData: FormData) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    const rawFormData = Object.fromEntries(formData);
    const validatedFields = PropietarioSchemaBase.safeParse(rawFormData);

    if (!validatedFields.success) {
      return {
        success: false,
        error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors },
      };
    }
    
    // El dataToInsert ahora incluye los nuevos campos
    const { data, error: dbError } = await supabase
      .from('propietarios')
      .insert([validatedFields.data])
      .select()
      .single();

    if (dbError) {
        // ... (manejo de errores existente)
    }

    revalidatePath('/dashboard/propietarios');
    return { success: true, data, message: "Propietario añadido correctamente." };

  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

// --- FUNCIÓN ACTUALIZAR PROPIETARIO (ACTUALIZADA) ---
export async function actualizarPropietario(id: string, formData: FormData) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    
    const rawFormData = Object.fromEntries(formData);
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
      // ... (manejo de errores existente)
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
