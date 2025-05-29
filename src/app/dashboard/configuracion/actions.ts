// app/dashboard/configuracion/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
// Para Storage, si las políticas del bucket son restrictivas para el rol 'authenticated',
// podrías necesitar un cliente Supabase con 'service_role' key aquí.
// Por ahora, usaremos el cliente de acción del servidor para Storage también,
// asumiendo que las políticas del bucket 'clinic-assets' lo permiten.
// import { supabase as adminSupabase } from '@/lib/supabaseAdminClient'; // Ejemplo si tuvieras un cliente admin

// Esquema Zod para validar los datos de la clínica
const DatosClinicaSchema = z.object({
  nombre_clinica: z.string().min(1, "El nombre de la clínica es requerido."),
  direccion_completa: z.string().transform(val => val === '' ? undefined : val).optional(),
  codigo_postal: z.string().transform(val => val === '' ? undefined : val).optional(),
  ciudad: z.string().transform(val => val === '' ? undefined : val).optional(),
  provincia: z.string().transform(val => val === '' ? undefined : val).optional(),
  pais: z.string().transform(val => val === '' ? undefined : val).optional(),
  telefono_principal: z.string().transform(val => val === '' ? undefined : val).optional(),
  email_contacto: z.string().email("Email de contacto inválido.").optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  nif_cif: z.string().min(1, "El NIF/CIF es requerido si se proporciona.").optional().transform(val => val === '' ? undefined : val),
  horarios_atencion: z.string().transform(val => val === '' ? undefined : val).optional(),
  sitio_web: z.string().url("URL del sitio web inválida.").optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
});

// Tipo para los datos que se insertarán/actualizarán en la tabla 'datos_clinica'
type ClinicDataForDB = z.infer<typeof DatosClinicaSchema> & {
  id: boolean; // Assuming 'id' is a placeholder for a unique clinic identifier, usually a string or number. Here it's used as a fixed boolean.
  logo_url?: string | null;
  updated_at: string;
};

// Esquema Zod para validar el cambio de contraseña
const CambioContrasenaSchema = z.object({
  // contrasena_actual: z.string().min(1, "La contraseña actual es requerida."), // Opcional
  nueva_contrasena: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
  confirmar_contrasena: z.string(),
}).refine(data => data.nueva_contrasena === data.confirmar_contrasena, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmar_contrasena"],
});


// --- ACCIÓN PARA ACTUALIZAR LOS DATOS DE LA CLÍNICA ---
export async function actualizarDatosClinica(
    currentPublicLogoUrl: string | null | undefined,
    formData: FormData
) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }
  // Aquí podrías añadir una verificación de rol 'admin' en un futuro

  const rawFormData = {
    nombre_clinica: formData.get("nombre_clinica"),
    direccion_completa: formData.get("direccion_completa"),
    codigo_postal: formData.get("codigo_postal"),
    ciudad: formData.get("ciudad"),
    provincia: formData.get("provincia"),
    pais: formData.get("pais"),
    telefono_principal: formData.get("telefono_principal"),
    email_contacto: formData.get("email_contacto"),
    nif_cif: formData.get("nif_cif"),
    horarios_atencion: formData.get("horarios_atencion"),
    sitio_web: formData.get("sitio_web"),
  };

  const validatedFields = DatosClinicaSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (actualizarDatosClinica):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación. Por favor, revisa los campos.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  // const dataFromValidatedSchema: Partial<Omit<ClinicDataForDB, 'id'|'updated_at'|'logo_url'>> = { ...validatedFields.data }; // This line seems unused
  const logoFile = formData.get("logo_file") as File | null;
  const removeLogoFlag = formData.get("remove_logo") === "true";
  const BUCKET_NAME = 'clinic-assets';

  const getStoragePathFromUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
      const urlObject = new URL(url);
      const pathParts = urlObject.pathname.split(`/object/public/${BUCKET_NAME}/`);
      return pathParts.length > 1 ? pathParts[1] : null;
    } catch (e) {
      console.error("Error al parsear la URL del logo para obtener la ruta:", e, "URL:", url);
      return null;
    }
  };

  const currentLogoStoragePath = getStoragePathFromUrl(currentPublicLogoUrl);
  let newLogoUrl: string | null | undefined = undefined; // Para determinar si el logo_url cambió

  try {
    if (removeLogoFlag) {
      if (currentLogoStoragePath) {
        const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([currentLogoStoragePath]);
        if (deleteError) console.warn("Advertencia al eliminar el logo actual (opción remove_logo):", deleteError.message);
      }
      newLogoUrl = null; // Marcar para actualizar a null
    } else if (logoFile && logoFile.size > 0) {
      if (currentLogoStoragePath) {
        const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([currentLogoStoragePath]);
        if (deleteError) console.warn("Advertencia al eliminar el logo antiguo antes de subir nuevo:", deleteError.message);
      }

      const fileExtension = logoFile.name.split('.').pop()?.toLowerCase() || 'png';
      const newFileName = `logo-${user.id}-${Date.now()}.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(newFileName, logoFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        return { success: false, error: { message: `Error al subir el logo: ${uploadError.message}` } };
      }

      const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path);
      newLogoUrl = publicUrlData.publicUrl;
    }

    // Preparamos el objeto final para el upsert
    const finalDataForUpsert: ClinicDataForDB = {
      id: true, // Assuming 'id' is a fixed value for a single-row table or similar logic
      nombre_clinica: validatedFields.data.nombre_clinica!, // nombre_clinica is required, so `!` is acceptable if schema guarantees it
      direccion_completa: validatedFields.data.direccion_completa, // FIX: Removed ?? null
      codigo_postal: validatedFields.data.codigo_postal,         // FIX: Removed ?? null
      ciudad: validatedFields.data.ciudad,                       // FIX: Removed ?? null
      provincia: validatedFields.data.provincia,                 // FIX: Removed ?? null
      pais: validatedFields.data.pais,                           // FIX: Removed ?? null
      telefono_principal: validatedFields.data.telefono_principal, // FIX: Removed ?? null
      email_contacto: validatedFields.data.email_contacto,         // FIX: Removed ?? null
      nif_cif: validatedFields.data.nif_cif,                     // FIX: Removed ?? null
      horarios_atencion: validatedFields.data.horarios_atencion,   // FIX: Removed ?? null
      sitio_web: validatedFields.data.sitio_web,                 // FIX: Removed ?? null
      updated_at: new Date().toISOString(),
      // Añadir logo_url solo si se ha modificado (nuevo o borrado)
      ...(newLogoUrl !== undefined && { logo_url: newLogoUrl }),
    };

    const { data, error: dbError } = await supabase
      .from("datos_clinica")
      .upsert(finalDataForUpsert)
      .select().single();

    if (dbError) {
      console.error("Error en UPSERT de datos_clinica:", dbError);
      if (dbError.code === '23505' && dbError.message.includes('nif_cif')) {
          return { success: false, error: { message: "El NIF/CIF introducido ya está en uso."} };
      }
      return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
    }

    revalidatePath("/dashboard/configuracion/clinica");
    revalidatePath("/dashboard/layout", "layout");

    return { success: true, data, message: "Datos de la clínica actualizados correctamente." };

  } catch (e: any) {
    console.error("Error inesperado en actualizarDatosClinica:", e);
    return { success: false, error: { message: `Error inesperado: ${e.message}`}};
  }
}


// --- ACCIÓN PARA CAMBIAR LA CONTRASEÑA DEL USUARIO ---
export async function cambiarContrasenaUsuario(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const rawFormData = {
    nueva_contrasena: formData.get("nueva_contrasena"),
    confirmar_contrasena: formData.get("confirmar_contrasena"),
  };

  const validatedFields = CambioContrasenaSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (cambiarContrasenaUsuario):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación. Por favor, revisa los campos.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: validatedFields.data.nueva_contrasena,
  });

  if (updateError) {
    console.error("Error al actualizar la contraseña:", updateError);
    return {
      success: false,
      error: {
        message: `Error al cambiar la contraseña: ${updateError.message}.`
      }
    };
  }

  return { success: true, message: "Contraseña actualizada correctamente." };
}