// src/app/dashboard/inventario/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    tiposDeMovimientoInventarioOpciones,
    impuestoItemOpciones,
    type TipoMovimientoInventarioValue,
    type ImagenProducto
} from "./types";

// --- Constantes y Esquemas de Zod ---

const tiposDeMovimientoValues = tiposDeMovimientoInventarioOpciones.map(t => t.value) as [string, ...string[]];
const impuestoItemValues = impuestoItemOpciones.map(opt => opt.value) as [string, ...string[]];

const VariantFormSchema = z.array(z.object({
  id: z.union([z.string(), z.number()]),
  db_id: z.string().uuid().optional().nullable(),
  sku: z.string().optional(),
  precio_venta: z.string().transform(val => parseFloat(val) || 0),
  stock_inicial: z.string().transform(val => parseInt(val, 10) || 0),
  atributos: z.record(z.string())
}));

const ProductoSchema = z.object({
  nombre: z.string().min(1, "El nombre del producto es requerido."),
  tipo: z.enum(['simple', 'variable']).default('simple'),
  descripcion_publica: z.string().optional(),
  requiere_lote: z.preprocess((val) => val === 'on' || val === true, z.boolean().default(true)),
  en_tienda: z.preprocess((val) => val === 'on' || val === true, z.boolean().default(false)),
  destacado: z.preprocess((val) => val === 'on' || val === true, z.boolean().default(false)),
  categorias_tienda: z.string().transform(val => {
      if (!val) return [];
      return val.split(',').map(c => ({ nombre: c.trim() })).filter(c => c.nombre);
  }).optional(),
  porcentaje_impuesto: z.enum(impuestoItemValues).default('0').transform(val => parseFloat(val)),
  sku: z.string().optional(),
  precio_venta: z.coerce.number().min(0).optional(),
  stock_no_lote_valor: z.coerce.number().int().min(0).optional(),
  existing_images: z.string().transform((str) => JSON.parse(str || '[]')).optional(),
});

const UpdateProductoSchema = ProductoSchema.omit({ tipo: true });

const UpdateVariantSchema = z.object({
  precio_venta: z.coerce.number({invalid_type_error: "El precio debe ser un número."}).min(0, "El precio no puede ser negativo."),
  sku: z.string().optional(),
});

const AddStockSchema = z.object({
  cantidad: z.coerce.number().int().positive("La cantidad debe ser un número positivo."),
  numero_lote: z.string().optional(),
  fecha_entrada: z.string().optional(),
  fecha_caducidad: z.string().optional(),
});

const EntradaLoteSchema = z.object({
  numero_lote: z.string().min(1, "El número de lote es requerido."),
  stock_lote: z.coerce.number().int().positive("El stock de entrada debe ser un número positivo mayor que cero."),
  fecha_entrada: z.string().nullable().transform(val => (val === '' || val === null) ? undefined : val).refine(val => val === undefined || (typeof val === 'string' && !isNaN(Date.parse(val))), { message: "Fecha de entrada inválida." }).transform(val => val ? new Date(val).toISOString().split('T')[0] : undefined).default(new Date().toISOString().split('T')[0]),
  fecha_caducidad: z.string().nullable().transform(val => (val === '' || val === null) ? undefined : val).refine(val => val === undefined || (typeof val === 'string' && !isNaN(Date.parse(val))), { message: "Fecha de caducidad inválida."}).transform(val => val ? new Date(val).toISOString().split('T')[0] : undefined).optional(),
});


const MovimientoStockSchema = z.object({
  tipo_movimiento: z.enum(tiposDeMovimientoValues),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser un número positivo."),
  notas: z.string().optional().transform(val => val === '' ? undefined : val),
});

const UpdateLoteSchema = z.object({
  numero_lote: z.string().min(1, "El número de lote es requerido.").optional(),
  fecha_entrada: z.string().nullable().transform(val => (val === '' || val === null) ? undefined : val).refine(val => val === undefined || (typeof val === 'string' && !isNaN(Date.parse(val))), { message: "Fecha de entrada inválida."}).transform(val => val ? new Date(val).toISOString().split('T')[0] : undefined).optional(),
  fecha_caducidad: z.string().nullable().transform(val => (val === '' || val === null) ? undefined : val).refine(val => val === undefined || (typeof val === 'string' && !isNaN(Date.parse(val))), { message: "Fecha de caducidad inválida."}).transform(val => val ? new Date(val).toISOString().split('T')[0] : undefined).optional(),
  stock_lote: z.coerce.number().int("El stock debe ser un número entero.").min(0, "El stock no puede ser negativo.").optional(),
});


export async function agregarProductoYVariantes(formData: FormData) {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = ProductoSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
        return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };
    }

    const {
        nombre, tipo, descripcion_publica, requiere_lote, en_tienda, destacado, categorias_tienda,
        sku, precio_venta, porcentaje_impuesto, stock_no_lote_valor
    } = validatedFields.data;

    const { data: productoCatalogo, error: catalogoError } = await supabase
        .from('productos_catalogo')
        .insert({
            nombre, tipo, descripcion_publica, requiere_lote, en_tienda, destacado,
            categorias_tienda: categorias_tienda && categorias_tienda.length > 0 ? categorias_tienda : null,
            porcentaje_impuesto, imagenes: [],
        }).select('id').single();

    if (catalogoError || !productoCatalogo) {
        return { success: false, error: { message: `Error de base de datos: ${catalogoError?.message || 'No se pudo crear el producto.'}` } };
    }
    const productoId = productoCatalogo.id;

    try {
        if (tipo === 'simple') {
            const { data: variante, error: varianteError } = await supabase.from('producto_variantes').insert({
                producto_id: productoId, sku: sku || null, precio_venta: precio_venta,
                stock_actual: requiere_lote ? 0 : (stock_no_lote_valor || 0),
                atributos: { "default": "default" }
            }).select('id').single();
            if (varianteError) throw varianteError;
            if (!requiere_lote && stock_no_lote_valor && stock_no_lote_valor > 0 && variante) {
                await supabase.from('movimientos_inventario').insert({
                    variante_id: variante.id, producto_id: productoId, tipo_movimiento: 'Ajuste Positivo',
                    cantidad: stock_no_lote_valor, notas: 'Stock inicial para producto simple sin lotes.'
                });
            }
        } else {
            const variantsDataStr = formData.get('variants_data') as string;
            if (!variantsDataStr) throw new Error("No se proporcionaron datos de variantes.");
            const parsedVariants = VariantFormSchema.parse(JSON.parse(variantsDataStr));
            if (parsedVariants.length === 0) throw new Error("Un producto variable debe tener al menos una variante.");

            const variantsToInsert = parsedVariants.map(v => ({
                producto_id: productoId, sku: v.sku || null, precio_venta: v.precio_venta,
                atributos: v.atributos,
                stock_actual: requiere_lote ? 0 : v.stock_inicial
            }));

            const { data: createdVariants, error: variantesError } = await supabase.from('producto_variantes').insert(variantsToInsert).select();
            if (variantesError) throw variantesError;

            if (createdVariants) {
                for (const [index, dbVariant] of createdVariants.entries()) {
                    const formVariant = parsedVariants[index];
                    const imageFile = formData.get(`variant_image_${formVariant.id}`) as File | null;

                    if (imageFile && imageFile.size > 0) {
                        const BUCKET_NAME = 'product-images';
                        const filePath = `${user.id}/${productoId}/${dbVariant.id}-${imageFile.name}`;

                        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, imageFile, { upsert: true });
                        if (uploadError) continue;

                        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

                        await supabase
                            .from('producto_variantes')
                            .update({ imagen_url: publicUrlData.publicUrl })
                            .eq('id', dbVariant.id);
                    }
                }
            }
        }
    } catch (error: any) {
        await supabase.from('productos_catalogo').delete().eq('id', productoId);
        return { success: false, error: { message: `Error al crear las variantes: ${error.message}` } };
    }

    const imageFiles = formData.getAll("imagenes[]").filter((entry): entry is File => typeof entry === 'object' && typeof entry.name === 'string' && entry.size > 0);
    if (imageFiles.length > 0) {
        const BUCKET_NAME = 'product-images';
        const uploadedImages: ImagenProducto[] = [];
        for (const [index, file] of imageFiles.entries()) {
            const filePath = `${user.id}/${productoId}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
            if (uploadError) continue;
            const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
            uploadedImages.push({ url: publicUrlData.publicUrl, order: index, isPrimary: index === 0 });
        }
        if (uploadedImages.length > 0) {
          await supabase.from("productos_catalogo").update({ imagenes: uploadedImages }).eq('id', productoId);
        }
    }

    revalidatePath("/dashboard/inventario");
    return { success: true, data: { id: productoId } };
}

export async function actualizarProductoCatalogo(id: string, formData: FormData) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: { message: "Usuario no autenticado." } };
    }
    if (!z.string().uuid().safeParse(id).success) {
        return { success: false, error: { message: "ID de producto inválido." } };
    }

    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = UpdateProductoSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
      return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };
    }

    const BUCKET_NAME = 'product-images';
    const newImageFiles = formData.getAll("imagenes[]").filter((entry): entry is File => typeof entry === 'object' && typeof entry.name === 'string' && entry.size > 0);
    let existingImages: ImagenProducto[] = validatedFields.data.existing_images || [];

    for (const file of newImageFiles) {
        const filePath = `${user.id}/${id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
        if (uploadError) {
            console.error(`Error al subir nueva imagen principal ${file.name}:`, uploadError);
            continue;
        }
        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        existingImages.push({ url: publicUrlData.publicUrl, order: existingImages.length, isPrimary: false });
    }

    let primaryFound = false;
    existingImages.sort((a, b) => a.order - b.order);
    const finalImages = existingImages.map((img, index) => {
        img.order = index;
        if (img.isPrimary) {
            if (primaryFound) img.isPrimary = false;
            else primaryFound = true;
        }
        return img;
    });
    if (!primaryFound && finalImages.length > 0) {
        finalImages[0].isPrimary = true;
    }

    const { stock_no_lote_valor, existing_images: _, ...productCatalogDataToUpdate } = validatedFields.data;
    const dataToUpdateDb = {
        ...productCatalogDataToUpdate,
        imagenes: finalImages.length > 0 ? finalImages : null,
        updated_at: new Date().toISOString()
    };

    const { error: dbError } = await supabase.from("productos_catalogo").update(dataToUpdateDb).eq("id", id);
    if (dbError) {
        return { success: false, error: { message: `Error de base de datos al actualizar producto: ${dbError.message}` } };
    }

    // --- INICIO DE LA CORRECCIÓN ---
    // Después de actualizar el producto principal, buscamos la imagen primaria
    // y la establecemos en TODAS las variantes.
    const primaryImage = finalImages.find(img => img.isPrimary);
    const primaryImageUrl = primaryImage ? primaryImage.url : (finalImages[0]?.url || null);

    if (primaryImageUrl) {
      // Obtenemos TODAS las variantes para este producto.
      const { data: allVariants, error: variantsError } = await supabase
        .from('producto_variantes')
        .select('id')
        .eq('producto_id', id);

      if (variantsError) {
        console.error(`Error al obtener variantes para actualizar imagen principal: ${variantsError.message}`);
      }
      
      // Si se encontraron variantes, actualizamos la imagen principal en todas ellas.
      if (allVariants && allVariants.length > 0) {
        const variantIds = allVariants.map(v => v.id);
        await supabase
          .from('producto_variantes')
          .update({ imagen_principal: primaryImageUrl })
          .in('id', variantIds);
      }
    }
    // --- FIN DE LA CORRECCIÓN ---

    const variantsDataStr = formData.get('variants_data') as string;
    if (variantsDataStr) {
      const parsedVariants = VariantFormSchema.parse(JSON.parse(variantsDataStr));

      for (const formVariant of parsedVariants) {
          const imageFile = formData.get(`variant_image_${formVariant.id}`) as File | null;
          let imageUrlToUpdate: string | undefined = undefined;

          if (imageFile && imageFile.size > 0) {
              const variantIdForPath = formVariant.db_id || `new-${Date.now()}`;
              const filePath = `${user.id}/${id}/${variantIdForPath}-${imageFile.name}`;

              const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, imageFile, { upsert: true });

              if (uploadError) {
                  console.error(`Error subiendo imagen para variante ${formVariant.id}:`, uploadError);
              } else {
                  imageUrlToUpdate = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath).data.publicUrl;
              }
          }

          const variantDbData = {
              sku: formVariant.sku || null,
              precio_venta: formVariant.precio_venta,
              atributos: formVariant.atributos,
              updated_at: new Date().toISOString(),
              ...(imageUrlToUpdate !== undefined && { imagen_url: imageUrlToUpdate }),
          };

          if (formVariant.db_id) {
            const { error: variantUpdateError } = await supabase.from('producto_variantes').update(variantDbData).eq('id', formVariant.db_id);
            if (variantUpdateError) console.error(`Error actualizando variante ${formVariant.db_id}:`, variantUpdateError);
          } else {
            const { error: variantInsertError } = await supabase.from('producto_variantes').insert({ ...variantDbData, producto_id: id });
            if (variantInsertError) console.error(`Error insertando nueva variante:`, variantInsertError);
          }
      }
    }

    revalidatePath("/dashboard/inventario");
    revalidatePath(`/dashboard/inventario/${id}`);
    revalidatePath(`/dashboard/inventario/${id}/editar`);
    return { success: true, message: "Producto actualizado correctamente." };

  } catch (e: any) {
    console.error("Error completo en actualizarProductoCatalogo:", e);
    return { success: false, error: { message: `Error inesperado en el servidor: ${e.message}` } };
  }
}

export async function actualizarVariante(varianteId: string, productoId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }
  if (!z.string().uuid().safeParse(varianteId).success || !z.string().uuid().safeParse(productoId).success) {
    return { success: false, error: { message: "ID de producto o variante inválido." } };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = UpdateVariantSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: { message: "Datos de formulario inválidos.", errors: validatedFields.error.flatten().fieldErrors } };
  }

  const { sku, precio_venta } = validatedFields.data;

  const dataToUpdate: { sku?: string | null; precio_venta?: number; imagen_url?: string; imagen_principal?: string; updated_at: string; } = {
    updated_at: new Date().toISOString(),
  };

  if (sku !== undefined) dataToUpdate.sku = sku || null;
  if (precio_venta !== undefined) dataToUpdate.precio_venta = precio_venta;

  const imageFile = formData.get('imagen') as File | null;
  if (imageFile && imageFile.size > 0) {
    const BUCKET_NAME = 'product-images';
    const filePath = `${user.id}/${productoId}/${varianteId}-${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageFile, { upsert: true });

    if (uploadError) {
      console.error(`Error subiendo imagen para variante ${varianteId}:`, uploadError);
      return { success: false, error: { message: `Error al subir la imagen: ${uploadError.message}` } };
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    dataToUpdate.imagen_url = publicUrlData.publicUrl;
    // Asignamos también como imagen principal de la variante
    dataToUpdate.imagen_principal = publicUrlData.publicUrl;
  }

  const { error: updateError } = await supabase
    .from('producto_variantes')
    .update(dataToUpdate)
    .eq('id', varianteId);

  if (updateError) {
    return { success: false, error: { message: `Error al actualizar la variante: ${updateError.message}` } };
  }

  revalidatePath(`/dashboard/inventario/${productoId}`);
  revalidatePath(`/dashboard/inventario/${productoId}/variantes/${varianteId}/editar`);
  return { success: true, message: "Variante actualizada correctamente." };
}

export async function registrarMovimientoStock(varianteId: string, loteId: string | null, formData: FormData) {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    if (!z.string().uuid().safeParse(varianteId).success) {
        return { success: false, error: { message: "ID de variante inválido." } };
    }
    if (loteId && !z.string().uuid().safeParse(loteId).success) {
        return { success: false, error: { message: "ID de lote inválido." } };
    }

    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = MovimientoStockSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
        return { success: false, error: { message: "Datos de formulario inválidos.", errors: validatedFields.error.flatten().fieldErrors } };
    }
    const { tipo_movimiento, cantidad, notas } = validatedFields.data;

    const { data: variante, error: varianteError } = await supabase
        .from('producto_variantes')
        .select('id, producto_id, stock_actual')
        .eq('id', varianteId)
        .single();

    if (varianteError || !variante) {
        return { success: false, error: { message: "No se encontró la variante." } };
    }

    const isPositiveMovement = ['Entrada Compra', 'Ajuste Positivo', 'Devolución Cliente'].includes(tipo_movimiento);
    const cantidadAjuste = isPositiveMovement ? cantidad : -cantidad;

    try {
        if (loteId) {
            const { data: lote, error: loteError } = await supabase
                .from('lotes_producto')
                .select('stock_lote')
                .eq('id', loteId)
                .single();

            if (loteError || !lote) {
                return { success: false, error: { message: "No se encontró el lote especificado." } };
            }

            const nuevoStockLote = lote.stock_lote + cantidadAjuste;
            if (nuevoStockLote < 0) {
                return { success: false, error: { message: `No hay suficiente stock en el lote. Stock actual: ${lote.stock_lote}.` } };
            }

            const { error: updateLoteError } = await supabase
                .from('lotes_producto')
                .update({ stock_lote: nuevoStockLote })
                .eq('id', loteId);

            if (updateLoteError) throw updateLoteError;

        } else {
             const nuevoStockVariante = (variante.stock_actual || 0) + cantidadAjuste;
             if (nuevoStockVariante < 0) {
                 return { success: false, error: { message: `No hay suficiente stock para el producto. Stock actual: ${variante.stock_actual}.` } };
             }
             const { error: updateVarianteError } = await supabase
                .from('producto_variantes')
                .update({ stock_actual: nuevoStockVariante })
                .eq('id', varianteId);

             if (updateVarianteError) throw updateVarianteError;
        }

        const { error: movimientoError } = await supabase.from('movimientos_inventario').insert({
            variante_id: varianteId,
            producto_id: variante.producto_id,
            lote_id: loteId,
            tipo_movimiento: tipo_movimiento,
            cantidad: cantidad,
            notas: notas,
        });

        if (movimientoError) {
            return { success: false, error: { message: `El stock se actualizó, pero falló el registro del movimiento: ${movimientoError.message}` } };
        }

        revalidatePath(`/dashboard/inventario/${variante.producto_id}`);
        revalidatePath('/dashboard/inventario');
        return { success: true, message: "Movimiento de stock registrado correctamente." };

    } catch (error: any) {
        return { success: false, error: { message: `Error al procesar el movimiento de stock: ${error.message}` } };
    }
}

export async function registrarEntradaLote(productoId: string, formData: FormData) {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    if (!z.string().uuid().safeParse(productoId).success) {
        return { success: false, error: { message: "ID de producto inválido." } };
    }
    
    // Encontrar la variante asociada al producto. Asumimos que si se usa este formulario,
    // el producto es simple y solo tiene una variante.
    const { data: variante, error: varianteError } = await supabase
        .from('producto_variantes')
        .select('id')
        .eq('producto_id', productoId)
        .limit(1)
        .single();
        
    if (varianteError || !variante) {
        return { success: false, error: { message: "No se encontró una variante para este producto. Asegúrese de que el producto esté configurado correctamente." } };
    }

    const varianteId = variante.id;
    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = EntradaLoteSchema.safeParse(rawFormData);
    
    if (!validatedFields.success) {
        return { success: false, error: { message: "Datos de formulario inválidos.", errors: validatedFields.error.flatten().fieldErrors } };
    }

    const { numero_lote, stock_lote, fecha_entrada, fecha_caducidad } = validatedFields.data;

    try {
        const { error: insertError } = await supabase.from('lotes_producto').insert({
            variante_id: varianteId,
            numero_lote,
            stock_lote,
            fecha_entrada,
            fecha_caducidad,
            esta_activo: true,
        });

        if (insertError) {
            if (insertError.code === '23505') { // Error de violación de unicidad
                return { success: false, error: { message: `El número de lote "${numero_lote}" ya existe para este producto.` } };
            }
            throw insertError;
        }

        await supabase.from('movimientos_inventario').insert({
            variante_id: varianteId,
            producto_id: productoId,
            lote_id: (await supabase.from('lotes_producto').select('id').eq('numero_lote', numero_lote).eq('variante_id', varianteId).single()).data?.id,
            tipo_movimiento: 'Entrada Compra',
            cantidad: stock_lote,
            notas: `Entrada inicial del lote ${numero_lote}.`,
        });

        revalidatePath(`/dashboard/inventario/${productoId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: { message: `Error de base de datos: ${error.message}` } };
    }
}


export async function eliminarVariante(varianteId: string, productoId: string) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  try {
    const { count, error: countError } = await supabase
      .from('producto_variantes')
      .select('*', { count: 'exact', head: true })
      .eq('producto_id', productoId);

    if (countError) {
      throw new Error(`No se pudo verificar el número de variantes: ${countError.message}`);
    }

    if (count !== null && count <= 1) {
      return { success: false, error: { message: "No se puede eliminar la última variante de un producto." } };
    }

    const { error: deleteError } = await supabase
      .from('producto_variantes')
      .delete()
      .eq('id', varianteId);

    if (deleteError) {
      if (deleteError.code === '23503') {
         return { success: false, error: { message: "No se puede eliminar: esta variante está en uso." } };
      }
      throw deleteError;
    }

    revalidatePath(`/dashboard/inventario/${productoId}`);
    return { success: true };

  } catch (error: any) {
    return { success: false, error: { message: `Error al eliminar la variante: ${error.message}` } };
  }
}

export async function eliminarProductoCatalogo(id: string) {
  try {
    if (!z.string().uuid().safeParse(id).success) return { success: false, error: { message: "ID de producto inválido." }};
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { count, error } = await supabase.from("productos_catalogo").delete({ count: 'exact' }).eq("id", id);

    if (error) {
      if (error.code === '23503') return { success: false, error: { message: "No se puede eliminar: el producto está en uso."}};
      return { success: false, error: { message: `Error de base de datos: ${error.message}` }};
    }
    if (count === 0) return { success: false, error: { message: "El producto no se encontró." }};

    revalidatePath("/dashboard/inventario");
    return { success: true, message: "Producto eliminado." };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

export async function agregarStock(varianteId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  if (!z.string().uuid().safeParse(varianteId).success) {
    return { success: false, error: { message: "ID de variante inválido." } };
  }

  const { data: variante, error: varianteError } = await supabase
    .from('producto_variantes')
    .select('*, producto_padre:productos_catalogo(*)')
    .eq('id', varianteId)
    .single();

  if (varianteError || !variante || !variante.producto_padre) {
    return { success: false, error: { message: "No se encontró la variante o su producto asociado." } };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = AddStockSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: { message: "Datos inválidos.", errors: validatedFields.error.flatten().fieldErrors } };
  }

  const { cantidad, numero_lote, fecha_entrada, fecha_caducidad } = validatedFields.data;

  try {
      if (!numero_lote) {
        return { success: false, error: { message: "El número de lote es requerido.", errors: { numero_lote: ["Campo requerido"] } } };
      }

      const { data: loteExistente } = await supabase
        .from('lotes_producto')
        .select('id, stock_lote')
        .eq('variante_id', varianteId)
        .eq('numero_lote', numero_lote)
        .maybeSingle();

      let loteId: string;
      if (loteExistente) {
        loteId = loteExistente.id;
        const nuevoStock = loteExistente.stock_lote + cantidad;
        await supabase.from('lotes_producto').update({ stock_lote: nuevoStock }).eq('id', loteId);
      } else {
        const { data: nuevoLote, error: insertError } = await supabase.from('lotes_producto').insert({
          variante_id: varianteId,
          numero_lote: numero_lote,
          stock_lote: cantidad,
          fecha_entrada: fecha_entrada || new Date().toISOString(),
          fecha_caducidad: fecha_caducidad || null,
          esta_activo: true
        }).select('id').single();
        if (insertError || !nuevoLote) throw insertError;
        loteId = nuevoLote.id;
      }

      await supabase.from('movimientos_inventario').insert({
        variante_id: varianteId,
        producto_id: variante.producto_padre.id,
        lote_id: loteId,
        tipo_movimiento: 'Entrada Compra',
        cantidad: cantidad,
        notas: `Entrada de stock para lote ${numero_lote}.`
      });

    revalidatePath(`/dashboard/inventario/${variante.producto_padre.id}`);
    revalidatePath('/dashboard/inventario');
    return { success: true };

  } catch (error: any) {
    return { success: false, error: { message: `Error de base de datos: ${error.message}` } };
  }
}

export async function actualizarDatosLote(loteId: string, varianteId: string, formData: FormData) {
    try {
        const cookieStore = cookies();
        const supabase = createServerActionClient({ cookies: () => cookieStore });
        if (!z.string().uuid().safeParse(loteId).success || !z.string().uuid().safeParse(varianteId).success) {
            return { success: false, error: { message: "ID de lote o variante inválido." }};
        }
        const rawFormData = Object.fromEntries(formData.entries());
        const validatedFields = UpdateLoteSchema.safeParse(rawFormData);
        if (!validatedFields.success) return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors }, };

        const { data: loteAnterior, error: errLoteAnterior } = await supabase.from('lotes_producto').select('stock_lote, numero_lote, variante_id').eq('id', loteId).single();
        if (errLoteAnterior || !loteAnterior) return { success: false, error: { message: "Lote original no encontrado." } };

        const dataToUpdate: { [key: string]: any } = { updated_at: new Date().toISOString() };
        let stockFueModificado = false; let nuevoStockValor: number | undefined = undefined; let hasOtherChanges = false;

        if (validatedFields.data.numero_lote !== undefined) { dataToUpdate.numero_lote = validatedFields.data.numero_lote; hasOtherChanges = true;}
        if (validatedFields.data.fecha_entrada !== undefined) { dataToUpdate.fecha_entrada = validatedFields.data.fecha_entrada; hasOtherChanges = true;}
        if (validatedFields.data.fecha_caducidad !== undefined) { dataToUpdate.fecha_caducidad = validatedFields.data.fecha_caducidad; hasOtherChanges = true;}
        if (validatedFields.data.stock_lote !== undefined) {
            nuevoStockValor = validatedFields.data.stock_lote; dataToUpdate.stock_lote = nuevoStockValor;
            if (nuevoStockValor !== loteAnterior.stock_lote) stockFueModificado = true;
        }
        if (!hasOtherChanges && !stockFueModificado) return { success: true, message: "No hay cambios para actualizar.", data: loteAnterior };
        if (dataToUpdate.numero_lote && dataToUpdate.numero_lote !== loteAnterior.numero_lote) {
            const { data: loteExistente } = await supabase.from('lotes_producto').select('id').eq('variante_id', varianteId).eq('numero_lote', dataToUpdate.numero_lote).neq('id', loteId).maybeSingle();
            if (loteExistente) return { success: false, error: { message: `El número de lote "${dataToUpdate.numero_lote}" ya existe para esta variante.`, errors: {numero_lote: ["Este N. de lote ya está en uso."]} } };
        }

        const { data, error: dbError } = await supabase.from("lotes_producto").update(dataToUpdate).eq("id", loteId).select('id, producto_variantes(producto_id)').single();
        if (dbError) return { success: false, error: { message: `Error de BD al actualizar lote: ${dbError.message}` } };

        if (stockFueModificado && nuevoStockValor !== undefined) {
            const cantidadAjuste = nuevoStockValor - loteAnterior.stock_lote;
            if (cantidadAjuste !== 0) {
                const tipoMovimientoAjuste: TipoMovimientoInventarioValue = cantidadAjuste > 0 ? 'Ajuste Positivo' : 'Ajuste Negativo';
                await supabase.from('movimientos_inventario').insert({ lote_id: loteId, producto_id: (data as any).producto_variantes.producto_id, variante_id: varianteId, tipo_movimiento: tipoMovimientoAjuste, cantidad: Math.abs(cantidadAjuste), notas: `Ajuste manual al editar lote. Anterior: ${loteAnterior.stock_lote}.` });
            }
        }
        revalidatePath(`/dashboard/inventario/${(data as any).producto_variantes.producto_id}`);
        return { success: true, data, message: "Lote actualizado." };
    } catch (e: any) {
        return { success: false, error: { message: `Error inesperado: ${e.message}` } };
    }
}

export async function inactivarLoteProducto(loteId: string, varianteId: string) {
  try {
    if (!z.string().uuid().safeParse(loteId).success || !z.string().uuid().safeParse(varianteId).success) return { success: false, error: { message: "IDs inválidos." }};
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data, error } = await supabase.from("lotes_producto").update({ esta_activo: false, updated_at: new Date().toISOString() }).eq("id", loteId).eq("variante_id", varianteId).select('id, producto_variantes(producto_id)').single();
    if (error || !data) return { success: false, error: { message: `Error al inactivar lote: ${error?.message || 'No encontrado.'}` } };
    revalidatePath(`/dashboard/inventario/${(data as any).producto_variantes.producto_id}`); revalidatePath("/dashboard/inventario");
    return { success: true, message: "Lote inactivado." };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

export async function reactivarLoteProducto(loteId: string, varianteId: string) {
  try {
    if (!z.string().uuid().safeParse(loteId).success || !z.string().uuid().safeParse(varianteId).success) return { success: false, error: { message: "IDs inválidos." }};
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data, error } = await supabase.from("lotes_producto").update({ esta_activo: true, updated_at: new Date().toISOString() }).eq("id", loteId).eq("variante_id", varianteId).select('id, producto_variantes(producto_id)').single();
    if (error || !data) return { success: false, error: { message: `Error al reactivar lote: ${error?.message || 'No encontrado.'}` } };
    revalidatePath(`/dashboard/inventario/${(data as any).producto_variantes.producto_id}`); revalidatePath("/dashboard/inventario");
    return { success: true, message: "Lote reactivado." };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}