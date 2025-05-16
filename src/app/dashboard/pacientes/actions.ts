// app/dashboard/pacientes/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Esquema de Zod para la validación de datos del paciente.
// Se usa para creación y como base para actualización.
const PacienteSchema = z.object({
  nombre: z.string().min(1, "El nombre del paciente es requerido."),
  propietario_id: z.string().uuid("Debe seleccionar un propietario válido."),
  especie: z.string().min(1, "La especie es requerida."),
  // Campos opcionales: transformamos strings vacíos a 'undefined'
  // para que Zod.optional() los trate como ausentes.
  // Luego, al insertar/actualizar, 'undefined' se convierte a 'null' para la BD.
  raza: z.string().transform(val => (val === "" ? undefined : val)).optional(),
  fecha_nacimiento: z.string().transform(val => (val === "" ? undefined : val)).optional(), // El input date puede enviar ""
  sexo: z.string().transform(val => (val === "" ? undefined : val)).optional(),
  microchip_id: z.string().transform(val => (val === "" ? undefined : val)).optional(),
  color: z.string().transform(val => (val === "" ? undefined : val)).optional(),
  notas_adicionales: z.string().transform(val => (val === "" ? undefined : val)).optional(),
});

// --- ACCIÓN PARA AGREGAR UN NUEVO PACIENTE ---
export async function agregarPaciente(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: { message: "Usuario no autenticado." },
    };
  }

  const rawFormData = {
    nombre: formData.get("nombre"),
    propietario_id: formData.get("propietario_id"),
    especie: formData.get("especie"),
    raza: formData.get("raza"),
    fecha_nacimiento: formData.get("fecha_nacimiento"),
    sexo: formData.get("sexo"),
    microchip_id: formData.get("microchip_id"),
    color: formData.get("color"),
    notas_adicionales: formData.get("notas_adicionales"),
  };

  const validatedFields = PacienteSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (agregarPaciente):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: {
        message: "Error de validación. Por favor, revisa los campos.",
        errors: validatedFields.error.flatten().fieldErrors,
      },
    };
  }
  
  const dataToInsert = {
    nombre: validatedFields.data.nombre,
    propietario_id: validatedFields.data.propietario_id,
    especie: validatedFields.data.especie,
    raza: validatedFields.data.raza ?? null,
    fecha_nacimiento: validatedFields.data.fecha_nacimiento
      ? new Date(validatedFields.data.fecha_nacimiento).toISOString().split('T')[0] 
      : null,
    sexo: validatedFields.data.sexo ?? null,
    microchip_id: validatedFields.data.microchip_id ?? null,
    color: validatedFields.data.color ?? null,
    notas_adicionales: validatedFields.data.notas_adicionales ?? null,
  };

  const { data, error: dbError } = await supabase
    .from("pacientes")
    .insert([dataToInsert])
    .select()
    .single();

  if (dbError) {
    console.error("Error al insertar paciente:", dbError);
    return {
      success: false,
      error: { message: `Error de base de datos: ${dbError.message}` },
    };
  }

  revalidatePath("/dashboard/pacientes");
  return { success: true, data };
}

// --- ACCIÓN PARA ACTUALIZAR UN PACIENTE EXISTENTE ---
export async function actualizarPaciente(id: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { 
        success: false,
        error: { message: "Usuario no autenticado." } 
    };
  }

  const dataFromForm = {
    nombre: formData.get("nombre"),
    propietario_id: formData.get("propietario_id"),
    especie: formData.get("especie"),
    raza: formData.get("raza"),
    fecha_nacimiento: formData.get("fecha_nacimiento"),
    sexo: formData.get("sexo"),
    microchip_id: formData.get("microchip_id"),
    color: formData.get("color"),
    notas_adicionales: formData.get("notas_adicionales"),
  };
  
  // Usamos .partial() para que todos los campos sean opcionales en la validación de actualización.
  // Zod validará los campos presentes contra el PacienteSchema base.
  const validatedFields = PacienteSchema.partial().safeParse(dataFromForm);

  if (!validatedFields.success) {
    console.error("Error de validación (actualizarPaciente):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: {
        message: "Error de validación al actualizar. Por favor, revisa los campos.",
        errors: validatedFields.error.flatten().fieldErrors,
      },
    };
  }

  const dataToUpdate: { [key: string]: any } = {};

  // Construir el objeto de actualización solo con los campos que tienen valor (no undefined)
  // después de la validación y transformación.
  if (validatedFields.data.nombre !== undefined) dataToUpdate.nombre = validatedFields.data.nombre;
  if (validatedFields.data.propietario_id !== undefined) dataToUpdate.propietario_id = validatedFields.data.propietario_id;
  if (validatedFields.data.especie !== undefined) dataToUpdate.especie = validatedFields.data.especie;
  
  if (validatedFields.data.raza !== undefined) dataToUpdate.raza = validatedFields.data.raza ?? null;
  if (validatedFields.data.fecha_nacimiento !== undefined) {
    dataToUpdate.fecha_nacimiento = validatedFields.data.fecha_nacimiento 
        ? new Date(validatedFields.data.fecha_nacimiento).toISOString().split('T')[0] 
        : null;
  }
  if (validatedFields.data.sexo !== undefined) dataToUpdate.sexo = validatedFields.data.sexo ?? null;
  if (validatedFields.data.microchip_id !== undefined) dataToUpdate.microchip_id = validatedFields.data.microchip_id ?? null;
  if (validatedFields.data.color !== undefined) dataToUpdate.color = validatedFields.data.color ?? null;
  if (validatedFields.data.notas_adicionales !== undefined) dataToUpdate.notas_adicionales = validatedFields.data.notas_adicionales ?? null;

  if (Object.keys(dataToUpdate).length === 0) {
    return { 
        success: true, // Considerado éxito porque no hubo error, aunque no se hizo nada.
        message: "No se proporcionaron datos válidos para actualizar.",
        data: null 
    };
  }

  const { data, error: dbError } = await supabase
    .from("pacientes")
    .update(dataToUpdate)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    console.error('Error al actualizar paciente:', dbError);
    return { 
        success: false,
        error: { message: `Error de base de datos: ${dbError.message}` } 
    };
  }

  revalidatePath("/dashboard/pacientes");
  revalidatePath(`/dashboard/pacientes/${id}/editar`); // Revalida la página de edición específica

  return { success: true, data };
}

// --- ACCIÓN PARA ELIMINAR UN PACIENTE ---
export async function eliminarPaciente(id: string) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { 
        success: false,
        error: { message: "Usuario no autenticado." } 
    };
  }

  // Opcional: Validar el formato del ID
  // const IdSchema = z.string().uuid();
  // if (!IdSchema.safeParse(id).success) {
  //   return { success: false, error: { message: "ID de paciente inválido." } };
  // }

  const { error: dbError } = await supabase
    .from("pacientes")
    .delete()
    .eq("id", id);

  if (dbError) {
    console.error('Error al eliminar paciente:', dbError);
    return { 
        success: false,
        error: { message: `Error de base de datos al eliminar: ${dbError.message}` } 
    };
  }

  revalidatePath("/dashboard/pacientes");
  return { success: true, message: "Paciente eliminado correctamente." };
}