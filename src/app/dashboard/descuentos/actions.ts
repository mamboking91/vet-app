// src/app/dashboard/descuentos/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Esquema de validación con Zod para el formulario de códigos de descuento.
const DescuentoSchema = z.object({
  codigo: z.string().min(3, "El código debe tener al menos 3 caracteres.").max(50).transform(val => val.toUpperCase()),
  tipo_descuento: z.enum(['porcentaje', 'fijo'], { required_error: "Debes seleccionar un tipo de descuento." }),
  valor: z.coerce.number().positive("El valor debe ser un número positivo."),
  fecha_expiracion: z.date().optional(),
  usos_maximos: z.coerce.number().int().positive("Los usos máximos deben ser un número entero positivo.").optional(),
  compra_minima: z.coerce.number().min(0, "La compra mínima no puede ser negativa.").optional(),
  activo: z.boolean().default(true),
});

// Función para crear un nuevo código de descuento.
export async function crearCodigoDescuento(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const rawFormData = {
    codigo: formData.get('codigo'),
    tipo_descuento: formData.get('tipo_descuento'),
    valor: formData.get('valor'),
    fecha_expiracion: formData.get('fecha_expiracion') ? new Date(formData.get('fecha_expiracion') as string) : undefined,
    usos_maximos: formData.get('usos_maximos') ? Number(formData.get('usos_maximos')) : undefined,
    compra_minima: formData.get('compra_minima') ? Number(formData.get('compra_minima')) : 0,
    activo: formData.get('activo') === 'on',
  };

  const validatedFields = DescuentoSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: { message: "Datos inválidos", errors: validatedFields.error.flatten().fieldErrors } };
  }

  const { error } = await supabase.from('codigos_descuento').insert(validatedFields.data);

  if (error) {
    if (error.code === '23505') { // Error de violación de unicidad
      return { success: false, error: { message: `El código "${validatedFields.data.codigo}" ya existe.` } };
    }
    return { success: false, error: { message: `Error de base de datos: ${error.message}` } };
  }

  revalidatePath('/dashboard/descuentos');
  return { success: true, message: "Código de descuento creado correctamente." };
}

// Función para actualizar un código de descuento existente.
export async function actualizarCodigoDescuento(id: string, formData: FormData) {
    // Implementación futura
    return { success: false, error: { message: "Funcionalidad de actualizar no implementada aún." } };
}


// Función para eliminar un código de descuento.
export async function eliminarCodigoDescuento(id: string) {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    const { error } = await supabase.from('codigos_descuento').delete().eq('id', id);

    if (error) {
        return { success: false, error: { message: `Error al eliminar: ${error.message}` } };
    }

    revalidatePath('/dashboard/descuentos');
    return { success: true, message: "Código de descuento eliminado." };
}

