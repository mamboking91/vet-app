// app/dashboard/procedimientos/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
// Asume que estas opciones se importan desde ./types o están definidas aquí
// Por coherencia con la última vez, las defino aquí, pero impórtalas si las tienes en types.ts
const impuestoItemOpciones = [
  { value: "0", label: "0% (Exento)" },
  { value: "3", label: "3% (IGIC Reducido)" },
  { value: "7", label: "7% (IGIC General)" },
] as const;
const impuestoItemValues = impuestoItemOpciones.map(opt => opt.value) as [string, ...string[]];

const categoriasProcedimiento = [
  "Consulta", "Cirugía", "Vacunación", "Desparasitación", 
  "Diagnóstico por Imagen", "Laboratorio", "Peluquería", "Dental", "Otro"
] as const;

const ProcedimientoSchemaBase = z.object({
  nombre: z.string().min(1, "El nombre del procedimiento es requerido."),
  descripcion: z.string().transform(val => val === '' ? undefined : val).optional(),
  duracion_estimada_minutos: z.coerce.number().int("Debe ser un número entero.").positive("Debe ser un número positivo.").optional().or(z.literal('').transform(() => undefined)),
  precio: z.coerce.number().min(0, "El precio base no puede ser negativo."),
  categoria: z.enum(categoriasProcedimiento).optional().or(z.literal('').transform(() => undefined)),
  porcentaje_impuesto: z.enum(impuestoItemValues)
  .default('0')
  .transform(val => parseFloat(val)),
  notas_internas: z.string().transform(val => val === '' ? undefined : val).optional(),
});

export async function agregarProcedimiento(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user }, error: userErrorAuth } = await supabase.auth.getUser(); // Renombrado userError a userErrorAuth
  if (userErrorAuth || !user) {
    return { success: false, error: { message: userErrorAuth?.message || "Usuario no autenticado." } };
  }

  const rawFormData = {
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
    duracion_estimada_minutos: formData.get("duracion_estimada_minutos"),
    precio: formData.get("precio"),
    categoria: formData.get("categoria"),
    porcentaje_impuesto: formData.get("porcentaje_impuesto"),
    notas_internas: formData.get("notas_internas"),
  };

  const validatedFields = ProcedimientoSchemaBase.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (agregarProcedimiento):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }
  
  const dataToInsert = {
    nombre: validatedFields.data.nombre,
    descripcion: validatedFields.data.descripcion ?? null,
    duracion_estimada_minutos: validatedFields.data.duracion_estimada_minutos ?? null, 
    precio: validatedFields.data.precio,
    categoria: validatedFields.data.categoria ?? null,
    porcentaje_impuesto: validatedFields.data.porcentaje_impuesto,
    notas_internas: validatedFields.data.notas_internas ?? null,
    // created_at y updated_at se manejarán por la BD
  };

  const { data, error: dbError } = await supabase
    .from("procedimientos")
    .insert([dataToInsert])
    .select().single();

  if (dbError) {
    console.error("Error al insertar procedimiento:", dbError);
    if (dbError.code === '23505') { 
        return { success: false, error: { message: "Ya existe un procedimiento con este nombre."} };
    }
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
  }

  revalidatePath("/dashboard/procedimientos");
  return { success: true, data };
}

export async function actualizarProcedimiento(id: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user }, error: userErrorAuth } = await supabase.auth.getUser(); // Renombrado userError a userErrorAuth
  if (userErrorAuth || !user) {
    return { success: false, error: { message: userErrorAuth?.message || "Usuario no autenticado." } };
  }

  const IdSchema = z.string().uuid("El ID proporcionado no es un UUID válido.");
  if (!IdSchema.safeParse(id).success) {
    return { success: false, error: { message: "ID de procedimiento inválido para actualizar." }};
  }

  const rawFormData = {
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
    duracion_estimada_minutos: formData.get("duracion_estimada_minutos"),
    precio: formData.get("precio"),
    categoria: formData.get("categoria"),
    porcentaje_impuesto: formData.get("porcentaje_impuesto"),
    notas_internas: formData.get("notas_internas"),
  };
  
  const validatedFields = ProcedimientoSchemaBase.partial().safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (actualizarProcedimiento):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  // No incluimos updated_at explícitamente, el trigger se encargará.
  const dataToUpdate: { [key: string]: any } = {}; 
  let hasChanges = false;

  if (validatedFields.data.nombre !== undefined) { dataToUpdate.nombre = validatedFields.data.nombre; hasChanges = true; }
  if (validatedFields.data.descripcion !== undefined) { dataToUpdate.descripcion = validatedFields.data.descripcion ?? null; hasChanges = true; }
  if (validatedFields.data.duracion_estimada_minutos !== undefined) { dataToUpdate.duracion_estimada_minutos = validatedFields.data.duracion_estimada_minutos ?? null; hasChanges = true; }
  if (validatedFields.data.precio !== undefined) { dataToUpdate.precio = validatedFields.data.precio; hasChanges = true; }
  if (validatedFields.data.categoria !== undefined) { dataToUpdate.categoria = validatedFields.data.categoria ?? null; hasChanges = true; }
  if (validatedFields.data.porcentaje_impuesto !== undefined) { dataToUpdate.porcentaje_impuesto = validatedFields.data.porcentaje_impuesto; hasChanges = true; }
  if (validatedFields.data.notas_internas !== undefined) { dataToUpdate.notas_internas = validatedFields.data.notas_internas ?? null; hasChanges = true; }
  
  if (!hasChanges) {
    return { success: true, message: "No se proporcionaron datos diferentes para actualizar.", data: null };
  }
  // Si hay cambios, el trigger actualizará updated_at. Si solo quieres forzar el update de updated_at
  // incluso sin otros cambios, tendrías que añadirlo aquí y asegurar que el trigger no cause conflicto
  // o que se ejecute DESPUÉS de tu update explícito. Generalmente, dejar que el trigger lo haga es más limpio.
  // Si la tabla no tuviera trigger, AÑADIRÍAS: dataToUpdate.updated_at = new Date().toISOString();

  const { data, error: dbError } = await supabase
    .from("procedimientos")
    .update(dataToUpdate)
    .eq("id", id)
    .select().single();

  if (dbError) {
    console.error('Error al actualizar procedimiento:', dbError);
     if (dbError.code === '23505') { 
        return { success: false, error: { message: "Ya existe otro procedimiento con este nombre."} };
    }
    return { success: false, error: { message: `Error de base de datos al actualizar: ${dbError.message}` } };
  }

  revalidatePath("/dashboard/procedimientos");
  revalidatePath(`/dashboard/procedimientos/${id}/editar`);
  return { success: true, data };
}

export async function eliminarProcedimiento(id: string) {
  const IdSchema = z.string().uuid("El ID proporcionado no es un UUID válido.");
  if (!IdSchema.safeParse(id).success) {
    return { success: false, error: { message: "ID de procedimiento inválido." } };
  }

  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const { data: { user }, error: userErrorAuth } = await supabase.auth.getUser(); // Renombrado userError
  if (userErrorAuth || !user) {
    return { success: false, error: { message: userErrorAuth?.message || "Usuario no autenticado." } };
  }
  
  const { error: dbError, count } = await supabase
    .from("procedimientos")
    .delete({ count: 'exact' })
    .eq("id", id);

  if (dbError) {
    console.error("Error de Supabase al eliminar procedimiento:", dbError);
    return { success: false, error: { message: `Error de base de datos al eliminar: ${dbError.message}` } };
  }

  if (count === 0) {
    return { 
        success: false, 
        error: { message: "El procedimiento no se encontró o no se pudo eliminar (0 filas afectadas)." }
    };
  }
  
  revalidatePath("/dashboard/procedimientos");
  return { success: true, message: "Procedimiento eliminado correctamente." };
}