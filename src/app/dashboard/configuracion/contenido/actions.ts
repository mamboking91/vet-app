// src/app/dashboard/configuracion/contenido/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ContenidoCaracteristicaItem } from './types';

// Función auxiliar de seguridad
async function checkAdmin() {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado.");
    const { data: profile } = await supabase.from('propietarios').select('rol').eq('id', user.id).single();
    if (profile?.rol !== 'administrador') throw new Error("Permisos insuficientes.");
    return { supabase, user };
}

// ... (crearNuevoBloque, actualizarOrdenBloques, eliminarBloque no cambian)
export async function crearNuevoBloque(pagina: string, tipo_bloque: string, orden: number) {
  try {
    const { supabase } = await checkAdmin();
    let contenidoPorDefecto = {};
    if (tipo_bloque === 'heroe') {
        contenidoPorDefecto = { titulo: "Nuevo Título", subtitulo: "Nueva descripción.", boton_principal: { texto: "Botón 1", enlace: "/" }, boton_secundario: { texto: "Botón 2", enlace: "/" } };
    } else if (tipo_bloque === 'caracteristicas') {
        contenidoPorDefecto = { items: [{ id: "feat1", icono: "Sparkles", titulo: "Nueva Característica", descripcion: "<p>Descripción de ejemplo.</p>" }] };
    } else if (tipo_bloque === 'productos_destacados') {
        contenidoPorDefecto = { titulo: "Nuevos Productos" };
    } else if (tipo_bloque === 'texto_con_imagen') {
        contenidoPorDefecto = { titulo: "Título de la Sección", texto: "<p>Texto de ejemplo...</p>", imagenUrl: "https://placehold.co/800x600/a3e635/4d7c0f.png?text=Sube+una+imagen", posicionImagen: "derecha", boton: { texto: "Saber Más", enlace: "/" } };
    } else if (tipo_bloque === 'cta') {
        contenidoPorDefecto = { titulo: "<h2>Llamada a la acción</h2>", boton: { texto: "Empezar Ahora", enlace: "/" } };
    }

    const { data, error } = await supabase.from('bloques_pagina').insert({ pagina, tipo_bloque, orden, contenido: contenidoPorDefecto }).select().single();
    if (error) throw error;
    revalidatePath('/dashboard/configuracion/contenido');
    return { success: true, data };
  } catch (e: any) { return { success: false, error: { message: e.message } }; }
}
export async function actualizarOrdenBloques(idsOrdenados: string[]) {
    try {
        const { supabase } = await checkAdmin();
        const updates = idsOrdenados.map((id, index) => supabase.from('bloques_pagina').update({ orden: index }).eq('id', id));
        const results = await Promise.all(updates);
        const firstError = results.find(res => res.error);
        if (firstError) throw firstError.error;
        revalidatePath('/dashboard/configuracion/contenido');
        return { success: true };
    } catch(e: any) { return { success: false, error: { message: e.message } }; }
}
export async function eliminarBloque(bloqueId: string) {
    try {
        const { supabase } = await checkAdmin();
        const { error } = await supabase.from('bloques_pagina').delete().eq('id', bloqueId);
        if (error) throw error;
        revalidatePath('/dashboard/configuracion/contenido');
        return { success: true };
    } catch (e: any) { return { success: false, error: { message: e.message } }; }
}
export async function actualizarContenidoHeroe(bloqueId: string, formData: FormData) {
  try {
    const { supabase } = await checkAdmin();
    const rawData = Object.fromEntries(formData);
    const validatedFields = z.object({
        titulo: z.string().min(1, "El título es requerido."),
        subtitulo: z.string().min(1, "El subtítulo es requerido."),
        boton_principal_texto: z.string().min(1, "El texto del botón es requerido."),
        boton_principal_enlace: z.string().min(1, "El enlace del botón es requerido."),
        boton_secundario_texto: z.string().min(1, "El texto del botón es requerido."),
        boton_secundario_enlace: z.string().min(1, "El enlace del botón es requerido."),
    }).safeParse(rawData);
    if (!validatedFields.success) return { success: false, error: { message: "Datos inválidos.", errors: validatedFields.error.flatten().fieldErrors }};
    const contenido = {
        titulo: validatedFields.data.titulo,
        subtitulo: validatedFields.data.subtitulo,
        boton_principal: { texto: validatedFields.data.boton_principal_texto, enlace: validatedFields.data.boton_principal_enlace },
        boton_secundario: { texto: validatedFields.data.boton_secundario_texto, enlace: validatedFields.data.boton_secundario_enlace },
    };
    const { error } = await supabase.from('bloques_pagina').update({ contenido }).eq('id', bloqueId);
    if (error) throw error;
    revalidatePath('/');
    revalidatePath('/dashboard/configuracion/contenido');
    return { success: true, message: "Bloque Héroe actualizado." };
  } catch (e: any) { return { success: false, error: { message: e.message } }; }
}
export async function actualizarContenidoCaracteristicas(bloqueId: string, items: ContenidoCaracteristicaItem[]) {
    try {
        const { supabase } = await checkAdmin();
        const validatedFields = z.object({
            items: z.array(z.object({
                id: z.string(),
                icono: z.string().min(1, "El icono es requerido."),
                titulo: z.string().min(1, "El título es requerido."),
                descripcion: z.string().min(1, "La descripción es requerida."),
            })).min(1, "Debe haber al menos una característica."),
        }).safeParse({ items });
         if (!validatedFields.success) return { success: false, error: { message: "Datos de características inválidos.", errors: validatedFields.error.flatten().fieldErrors }};
        const { error } = await supabase.from('bloques_pagina').update({ contenido: validatedFields.data }).eq('id', bloqueId);
        if (error) throw error;
        revalidatePath('/');
        revalidatePath('/dashboard/configuracion/contenido');
        return { success: true, message: "Bloque de Características actualizado." };
    } catch(e: any) { return { success: false, error: { message: e.message } }; }
}
export async function actualizarContenidoProductosDestacados(bloqueId: string, formData: FormData) {
    try {
        const { supabase } = await checkAdmin();
        const validatedFields = z.object({ titulo: z.string().min(1, "El título es requerido.") }).safeParse(Object.fromEntries(formData));
         if (!validatedFields.success) return { success: false, error: { message: "Datos inválidos.", errors: validatedFields.error.flatten().fieldErrors }};
        const { error } = await supabase.from('bloques_pagina').update({ contenido: validatedFields.data }).eq('id', bloqueId);
        if (error) throw error;
        revalidatePath('/');
        revalidatePath('/dashboard/configuracion/contenido');
        return { success: true, message: "Bloque de Productos Destacados actualizado." };
    } catch(e: any) { return { success: false, error: { message: e.message } }; }
}

// --- ACCIÓN ACTUALIZADA para 'texto_con_imagen' con subida de archivos ---
export async function actualizarContenidoTextoConImagen(formData: FormData) {
    try {
        const { supabase, user } = await checkAdmin();
        const bloqueId = formData.get('bloqueId') as string;
        if (!bloqueId) throw new Error("No se proporcionó el ID del bloque.");

        let newImageUrl: string | null = null;
        const imagenFile = formData.get('imagen') as File | null;
        const imagenUrlActual = formData.get('imagenUrlActual') as string;
        
        // Subir nueva imagen si existe
        if (imagenFile && imagenFile.size > 0) {
            const BUCKET_NAME = 'pagina-assets';
            const fileName = `bloque-${bloqueId}-${Date.now()}.${imagenFile.name.split('.').pop()}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, imagenFile, { upsert: true });

            if (uploadError) throw new Error(`Error al subir la imagen: ${uploadError.message}`);
            newImageUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path).data.publicUrl;

            // Borrar imagen antigua si no es una URL de placeholder
            if (imagenUrlActual && !imagenUrlActual.includes('placehold.co')) {
                const oldFileName = imagenUrlActual.split('/').pop();
                if (oldFileName) await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
            }
        }

        const contenido = {
            titulo: formData.get('titulo') as string,
            texto: formData.get('texto') as string,
            posicionImagen: formData.get('posicionImagen') as 'izquierda' | 'derecha',
            imagenUrl: newImageUrl ?? imagenUrlActual, // Usa la nueva URL o mantiene la antigua
        };
        
        const { error: dbError } = await supabase.from('bloques_pagina').update({ contenido }).eq('id', bloqueId);
        if (dbError) throw dbError;

        revalidatePath('/');
        revalidatePath('/dashboard/configuracion/contenido');
        return { success: true, message: "Bloque 'Texto con Imagen' actualizado.", newImageUrl };
    } catch (e: any) { return { success: false, error: { message: e.message } }; }
}

export async function actualizarContenidoCta(bloqueId: string, formData: FormData) {
    try {
        const { supabase } = await checkAdmin();
        const rawData = Object.fromEntries(formData);
        const validatedFields = z.object({
            titulo: z.string().min(1, "El título es requerido."),
            boton_texto: z.string().min(1, "El texto del botón es requerido."),
            boton_enlace: z.string().min(1, "El enlace del botón es requerido."),
        }).safeParse(rawData);
        if (!validatedFields.success) return { success: false, error: { message: "Datos inválidos.", errors: validatedFields.error.flatten().fieldErrors }};
        const contenido = {
            titulo: validatedFields.data.titulo,
            boton: { texto: validatedFields.data.boton_texto, enlace: validatedFields.data.boton_enlace }
        };
        const { error } = await supabase.from('bloques_pagina').update({ contenido }).eq('id', bloqueId);
        if (error) throw error;
        revalidatePath('/');
        revalidatePath('/dashboard/configuracion/contenido');
        return { success: true, message: "Bloque 'Llamada a la Acción' actualizado." };
    } catch (e: any) { return { success: false, error: { message: e.message } }; }
}
