// app/dashboard/procedimientos/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categoriasProcedimiento = [
  "Consulta", "Cirugía", "Vacunación", "Desparasitación", 
  "Diagnóstico por Imagen", "Laboratorio", "Peluquería", "Dental", "Otro"
] as const;

const ProcedimientoSchemaBase = z.object({
  nombre: z.string().min(1, "El nombre del procedimiento es requerido."),
  descripcion: z.string().transform(val => val === '' ? undefined : val).optional(),
  duracion_estimada_minutos: z.coerce.number().int("Debe ser un número entero.").positive("Debe ser un número positivo.").optional().or(z.literal('').transform(() => undefined)),
  precio: z.coerce.number().positive("El precio debe ser un número positivo."),
  categoria: z.enum(categoriasProcedimiento).optional().or(z.literal('').transform(() => undefined)),
  notas_internas: z.string().transform(val => val === '' ? undefined : val).optional(),
});

export async function agregarProcedimiento(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: { message: userError?.message || "Usuario no autenticado." } };
  }

  const rawFormData = {
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
    duracion_estimada_minutos: formData.get("duracion_estimada_minutos"),
    precio: formData.get("precio"),
    categoria: formData.get("categoria"),
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
    notas_internas: validatedFields.data.notas_internas ?? null,
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

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: { message: userError?.message || "Usuario no autenticado." } };
  }

  const IdSchema = z.string().uuid("El ID proporcionado no es un UUID válido.");
  const idValidation = IdSchema.safeParse(id);
  if (!idValidation.success) {
    return {
      success: false,
      error: { message: "ID de procedimiento inválido para actualizar.", errors: idValidation.error.flatten().fieldErrors },
    };
  }

  const dataFromForm = {
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
    duracion_estimada_minutos: formData.get("duracion_estimada_minutos"),
    precio: formData.get("precio"),
    categoria: formData.get("categoria"),
    notas_internas: formData.get("notas_internas"),
  };
  
  const validatedFields = ProcedimientoSchemaBase.partial().safeParse(dataFromForm);

  if (!validatedFields.success) {
    console.error("Error de validación (actualizarProcedimiento):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const dataToUpdate: { [key: string]: any } = {};
  if (validatedFields.data.nombre !== undefined) dataToUpdate.nombre = validatedFields.data.nombre;
  if (validatedFields.data.descripcion !== undefined) dataToUpdate.descripcion = validatedFields.data.descripcion ?? null;
  if (validatedFields.data.duracion_estimada_minutos !== undefined) dataToUpdate.duracion_estimada_minutos = validatedFields.data.duracion_estimada_minutos ?? null;
  if (validatedFields.data.precio !== undefined) dataToUpdate.precio = validatedFields.data.precio;
  if (validatedFields.data.categoria !== undefined) dataToUpdate.categoria = validatedFields.data.categoria ?? null;
  if (validatedFields.data.notas_internas !== undefined) dataToUpdate.notas_internas = validatedFields.data.notas_internas ?? null;
  
  if (Object.keys(dataToUpdate).length === 0) {
    return { success: true, message: "No se proporcionaron datos para actualizar.", data: null };
  }

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
  const idValidation = IdSchema.safeParse(id);
  if (!idValidation.success) {
    return {
      success: false,
      error: { message: "ID de procedimiento inválido.", errors: idValidation.error.flatten().fieldErrors },
    };
  }

  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: { message: userError?.message || "Usuario no autenticado." } };
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