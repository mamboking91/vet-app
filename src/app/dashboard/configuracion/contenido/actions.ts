// src/app/dashboard/configuracion/contenido/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ContenidoCaracteristicaItem, ContenidoInstagramPost } from './types'; // Añadido ContenidoInstagramPost

async function checkAdmin() {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado.");
    const { data: profile } = await supabase.from('propietarios').select('rol').eq('id', user.id).single();
    if (profile?.rol !== 'administrador') throw new Error("Permisos insuficientes.");
    return { supabase, user };
}

export async function crearNuevoBloque(pagina: string, tipo_bloque: string, orden: number) {
  try {
    const { supabase } = await checkAdmin();
    let contenidoPorDefecto = {};
    if (tipo_bloque === 'heroe') {
        contenidoPorDefecto = { 
            titulo: "<h1>El mejor cuidado para tu mejor amigo</h1>", 
            subtitulo: "<p>Descubre nuestra selección de productos de alta calidad.</p>", 
            tituloFontSize: '6xl',
            subtituloFontSize: 'xl',
            boton_principal: { texto: "Ir a la Tienda", enlace: "/tienda", backgroundColor: "#2563eb", textColor: "#ffffff" }, 
            boton_secundario: { texto: "Pedir Cita", enlace: "/servicios/solicitar-cita", backgroundColor: "#ffffff", textColor: "#1f2937" }, 
            backgroundType: 'color', 
            backgroundColor: '#e0f2fe', 
            backgroundImageUrl: null, 
            backgroundPosition: 'center', 
            overlayOpacity: 60 
        };
    } else if (tipo_bloque === 'caracteristicas') {
        contenidoPorDefecto = { items: [{ id: "feat1", icono: "Sparkles", titulo: "Nueva Característica", descripcion: "<p>Descripción de ejemplo.</p>" }] };
    } else if (tipo_bloque === 'productos_destacados') {
        contenidoPorDefecto = { titulo: "Nuestros Productos Estrella" };
    } else if (tipo_bloque === 'texto_con_imagen') {
        contenidoPorDefecto = { titulo: "Título de la Sección", texto: "<p>Texto de ejemplo...</p>", imagenUrl: "https://placehold.co/800x600/a3e635/4d7c0f.png?text=Sube+una+imagen", posicionImagen: "derecha", boton: { texto: "Saber Más", enlace: "/" } };
    } else if (tipo_bloque === 'cta') {
        contenidoPorDefecto = { titulo: "<h2>Llamada a la acción</h2>", boton: { texto: "Empezar Ahora", enlace: "/" } };
    } 
    // --- INICIO DE LA CORRECCIÓN ---
    else if (tipo_bloque === 'instagram') {
        contenidoPorDefecto = { titulo: "Síguenos en @gomera_mascotas", posts: [] };
    }
    // --- FIN DE LA CORRECCIÓN ---

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

export async function actualizarContenidoHeroe(formData: FormData) {
  try {
    const { supabase } = await checkAdmin();
    const bloqueId = formData.get('bloqueId') as string;
    const BUCKET_NAME = 'hero-image';

    const contenido = {
        titulo: formData.get('titulo') as string,
        subtitulo: formData.get('subtitulo') as string,
        tituloFontSize: formData.get('tituloFontSize') as string,
        subtituloFontSize: formData.get('subtituloFontSize') as string,
        boton_principal: JSON.parse(formData.get('boton_principal') as string),
        boton_secundario: JSON.parse(formData.get('boton_secundario') as string),
        backgroundType: formData.get('backgroundType') as 'color' | 'imagen',
        backgroundColor: formData.get('backgroundColor') as string,
        backgroundImageUrl: formData.get('backgroundImageUrl') === 'null' ? null : formData.get('backgroundImageUrl') as string,
        backgroundPosition: formData.get('backgroundPosition') as 'center' | 'top' | 'bottom' | 'left' | 'right',
        overlayOpacity: Number(formData.get('overlayOpacity')) || 60,
    };

    let newImageUrl: string | null = contenido.backgroundImageUrl;
    const imageFile = formData.get('backgroundImageFile') as File | null;

    if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop() || 'png';
        const fileName = `hero-${bloqueId}-${Date.now()}.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage.from(BUCKET_NAME).upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        newImageUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path).data.publicUrl;

        const currentUrl = formData.get('backgroundImageUrl') as string;
        if (currentUrl && !currentUrl.includes('placehold.co') && currentUrl.includes(BUCKET_NAME)) {
            const oldFileName = currentUrl.split('/').pop();
            if(oldFileName) await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
        }
    } else if (contenido.backgroundType === 'color' && contenido.backgroundImageUrl) {
        if (contenido.backgroundImageUrl && !contenido.backgroundImageUrl.includes('placehold.co')) {
             const oldFileName = contenido.backgroundImageUrl.split('/').pop();
            if(oldFileName) await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
        }
        newImageUrl = null;
    }

    const finalContent = { ...contenido, backgroundImageUrl: newImageUrl };
    const { error: dbError } = await supabase.from('bloques_pagina').update({ contenido: finalContent }).eq('id', bloqueId);
    if (dbError) throw dbError;

    revalidatePath('/');
    revalidatePath('/dashboard/configuracion/contenido');
    return { success: true, message: "Bloque Héroe actualizado.", newImageUrl: newImageUrl !== undefined ? newImageUrl : contenido.backgroundImageUrl };
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

export async function actualizarContenidoTextoConImagen(formData: FormData) {
    try {
        const { supabase, user } = await checkAdmin();
        const bloqueId = formData.get('bloqueId') as string;
        if (!bloqueId) throw new Error("No se proporcionó el ID del bloque.");

        let newImageUrl: string | null = null;
        const imagenFile = formData.get('imagen') as File | null;
        const imagenUrlActual = formData.get('imagenUrlActual') as string;
        
        if (imagenFile && imagenFile.size > 0) {
            const BUCKET_NAME = 'pagina-assets';
            const fileName = `bloque-${bloqueId}-${Date.now()}.${imagenFile.name.split('.').pop()}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, imagenFile, { upsert: true });

            if (uploadError) throw new Error(`Error al subir la imagen: ${uploadError.message}`);
            newImageUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path).data.publicUrl;

            if (imagenUrlActual && !imagenUrlActual.includes('placehold.co')) {
                const oldFileName = imagenUrlActual.split('/').pop();
                if (oldFileName) await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
            }
        }

        const contenido = {
            titulo: formData.get('titulo') as string,
            texto: formData.get('texto') as string,
            posicionImagen: formData.get('posicionImagen') as 'izquierda' | 'derecha',
            imagenUrl: newImageUrl ?? imagenUrlActual,
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

// --- INICIO DE LA CORRECCIÓN ---
export async function actualizarContenidoInstagram(formData: FormData) {
    try {
        const { supabase } = await checkAdmin();
        const bloqueId = formData.get('bloqueId') as string;
        const BUCKET_NAME = 'pagina-assets';

        const titulo = formData.get('titulo') as string;
        let posts: ContenidoInstagramPost[] = JSON.parse(formData.get('posts') as string);
        
        const uploadPromises = posts.map(async (post) => {
            const imageFile = formData.get(`post_image_${post.id}`) as File | null;
            if (imageFile && imageFile.size > 0) {
                const fileExt = imageFile.name.split('.').pop() || 'jpg';
                const fileName = `instagram/${bloqueId}-${post.id}-${Date.now()}.${fileExt}`;
                
                // Si ya existe una imagen para este post, la eliminamos primero
                if (post.imagenUrl && !post.imagenUrl.includes('placehold.co')) {
                    const oldFileName = post.imagenUrl.split('/').pop();
                    if (oldFileName) {
                       await supabase.storage.from(BUCKET_NAME).remove([`instagram/${oldFileName}`]);
                    }
                }
                
                const { error: uploadError, data: uploadData } = await supabase.storage.from(BUCKET_NAME).upload(fileName, imageFile);
                if (uploadError) throw new Error(`Error subiendo imagen para post ${post.id}: ${uploadError.message}`);
                
                return { ...post, file: undefined, imagenUrl: supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path).data.publicUrl };
            }
            return { ...post, file: undefined };
        });

        const updatedPosts = await Promise.all(uploadPromises);

        const finalContent = { titulo, posts: updatedPosts };
        
        const { error: dbError } = await supabase.from('bloques_pagina').update({ contenido: finalContent }).eq('id', bloqueId);
        if (dbError) throw dbError;

        revalidatePath('/');
        revalidatePath('/dashboard/configuracion/contenido');
        return { success: true, message: "Galería de Instagram actualizada.", updatedPosts };
    } catch (e: any) {
        return { success: false, error: { message: e.message } };
    }
}
// --- FIN DE LA CORRECCIÓN ---