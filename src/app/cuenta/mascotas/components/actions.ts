// src/app/cuenta/mascotas/[pacienteId]/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updatePetAvatar(pacienteId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Usuario no autenticado." };
  }

  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) {
    return { success: false, message: "No se ha seleccionado ningún archivo." };
  }

  const { data: pacienteData, error: ownerError } = await supabase
    .from("pacientes")
    .select("propietario_id")
    .eq("id", pacienteId)
    .single();

  if (ownerError || !pacienteData || pacienteData.propietario_id !== user.id) {
    return { success: false, message: "No tienes permiso para editar esta mascota." };
  }

  const fileExtension = file.name.split(".").pop();
  const newFileName = `${pacienteId}.${fileExtension}`;
  const filePath = `${user.id}/${newFileName}`;

  // --- INICIO DE LA CORRECCIÓN ---
  // Paso 1: Buscar y eliminar cualquier avatar antiguo para esta mascota.
  // Esto previene conflictos de caché en el CDN de Supabase.
  const { data: existingFiles, error: listError } = await supabase.storage
    .from("avatares-mascotas")
    .list(user.id, {
      search: `${pacienteId}.`, // Busca archivos que empiecen con el ID de la mascota
    });

  if (listError) {
    console.error("Error al listar avatares existentes:", listError);
    // No detenemos el proceso, intentamos subir de todos modos.
  }

  if (existingFiles && existingFiles.length > 0) {
    const filesToRemove = existingFiles.map(x => `${user.id}/${x.name}`);
    await supabase.storage.from("avatares-mascotas").remove(filesToRemove);
  }

  // Paso 2: Subir la nueva imagen.
  const { error: uploadError } = await supabase.storage
    .from("avatares-mascotas")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // Usamos 'false' ya que hemos borrado el archivo antiguo manualmente.
    });
  // --- FIN DE LA CORRECCIÓN ---

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    return { success: false, message: `Error al subir la imagen: ${uploadError.message}` };
  }

  const { data: publicUrlData } = supabase.storage
    .from("avatares-mascotas")
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    return { success: false, message: "No se pudo obtener la URL pública de la imagen." };
  }

  const urlWithCacheBuster = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;

  const { error: dbError } = await supabase
    .from("pacientes")
    .update({ url_avatar: urlWithCacheBuster })
    .eq("id", pacienteId);

  if (dbError) {
    console.error("Error updating database:", dbError);
    return { success: false, message: `Error al guardar la URL: ${dbError.message}` };
  }

  revalidatePath(`/cuenta/mascotas/${pacienteId}`);
  return { success: true, message: "¡Foto de perfil actualizada con éxito!" };
}