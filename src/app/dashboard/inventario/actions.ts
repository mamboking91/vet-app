// app/dashboard/inventario/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { 
    unidadesDeMedidaInventarioOpciones, 
    tiposDeMovimientoInventarioOpciones,
    impuestoItemOpciones,
    type TipoMovimientoInventarioValue
} from "./types"; 

const unidadesDeMedidaValues = unidadesDeMedidaInventarioOpciones.map(u => u.value) as [string, ...string[]];
const tiposDeMovimientoValues = tiposDeMovimientoInventarioOpciones.map(t => t.value) as [string, ...string[]];
const impuestoItemValues = impuestoItemOpciones.map(opt => opt.value) as [string, ...string[]];

const NOMBRE_LOTE_GENERICO_BASE = "STOCK_UNICO";

const ProductoCatalogoSchemaBase = z.object({
  nombre: z.string().min(1, "El nombre del producto es requerido."),
  descripcion: z.string().transform(val => val === '' ? undefined : val).optional(),
  codigo_producto: z.string().transform(val => val === '' ? undefined : val).optional(),
  unidad: z.enum(unidadesDeMedidaValues).default('Unidad'),
  stock_minimo: z.coerce.number().int("El stock mínimo debe ser un número entero.").min(0, "El stock mínimo no puede ser negativo.").optional().or(z.literal('').transform(() => undefined)),
  precio_compra: z.coerce.number().min(0, "El precio de compra no puede ser negativo.").optional().or(z.literal('').transform(() => undefined)),
  precio_venta: z.coerce.number().min(0, "El precio de venta base no puede ser negativo.").optional().or(z.literal('').transform(() => undefined)),
  porcentaje_impuesto: z.enum(impuestoItemValues)
    .default('0') // Default string "0"
    .transform(val => parseFloat(val)), // Luego transforma a número
  requiere_lote: z.preprocess((val) => val === 'on' || val === true, z.boolean().default(true)),
  notas_internas: z.string().transform(val => val === '' ? undefined : val).optional(),
  stock_no_lote_valor: z.coerce.number().int("El stock debe ser un número entero.").min(0, "El stock no puede ser negativo.").optional().or(z.literal('').transform(() => undefined)),
});

const EntradaLoteSchema = z.object({
  numero_lote: z.string().min(1, "El número de lote es requerido."),
  stock_lote: z.coerce.number().int().positive("El stock de entrada debe ser un número positivo mayor que cero."),
  fecha_entrada: z.string().nullable() // Aceptar string o null de formData.get()
    .transform(val => (val === '' || val === null) ? undefined : val) // Convertir '' o null a undefined
    .refine(val => val === undefined || (typeof val === 'string' && !isNaN(Date.parse(val))), { 
        message: "Fecha de entrada inválida." 
    })
    .transform(val => val ? new Date(val).toISOString().split('T')[0] : undefined) // Formatear a YYYY-MM-DD si es válido
    .default(new Date().toISOString().split('T')[0]), // Aplicar default si es undefined
  fecha_caducidad: z.string().nullable() // Aceptar string o null
    .transform(val => (val === '' || val === null) ? undefined : val) // Convertir '' o null a undefined
    .refine(val => val === undefined || (typeof val === 'string' && !isNaN(Date.parse(val))), { 
        message: "Fecha de caducidad inválida." 
    })
    .transform(val => val ? new Date(val).toISOString().split('T')[0] : undefined) // Formatear si válido
    .optional(), // Si es undefined después de las transformaciones, es opcional y válido
});

const MovimientoStockSchema = z.object({
  tipo_movimiento: z.enum(tiposDeMovimientoValues),
  cantidad: z.coerce.number().int().refine(val => val !== 0, "La cantidad no puede ser cero."),
  notas: z.string().optional().transform(val => val === '' ? undefined : val),
});

const UpdateLoteSchema = z.object({
  numero_lote: z.string().min(1, "El número de lote es requerido.").optional(),
  fecha_entrada: z.string().nullable().transform(val => (val === '' || val === null) ? undefined : val).refine(val => val === undefined || (typeof val === 'string' && !isNaN(Date.parse(val))), { message: "Fecha de entrada inválida."}).transform(val => val ? new Date(val).toISOString().split('T')[0] : undefined).optional(),
  fecha_caducidad: z.string().nullable().transform(val => (val === '' || val === null) ? undefined : val).refine(val => val === undefined || (typeof val === 'string' && !isNaN(Date.parse(val))), { message: "Fecha de caducidad inválida."}).transform(val => val ? new Date(val).toISOString().split('T')[0] : undefined).optional(),
  stock_lote: z.coerce.number().int("El stock debe ser un número entero.").min(0, "El stock no puede ser negativo.").optional(),
});


// --- ACCIONES DEL CATÁLOGO DE PRODUCTOS ---
export async function agregarProductoCatalogo(formData: FormData) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

    const rawFormData = {
        nombre: formData.get("nombre"), descripcion: formData.get("descripcion"),
        codigo_producto: formData.get("codigo_producto"), unidad: formData.get("unidad"),
        stock_minimo: formData.get("stock_minimo"), precio_compra: formData.get("precio_compra"),
        precio_venta: formData.get("precio_venta"), porcentaje_impuesto: formData.get("porcentaje_impuesto"),
        requiere_lote: formData.get("requiere_lote"), notas_internas: formData.get("notas_internas"),
        stock_no_lote_valor: formData.get("stock_no_lote_valor"),
    };
    const validatedFields = ProductoCatalogoSchemaBase.safeParse(rawFormData);
    if (!validatedFields.success) {
        return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };
    }
    
    const { stock_no_lote_valor, ...productCatalogData } = validatedFields.data;
    const dataToInsert = {
        ...productCatalogData,
        descripcion: productCatalogData.descripcion ?? null, codigo_producto: productCatalogData.codigo_producto ?? null,
        stock_minimo: productCatalogData.stock_minimo ?? 0, precio_compra: productCatalogData.precio_compra ?? null,
        precio_venta: productCatalogData.precio_venta ?? null, notas_internas: productCatalogData.notas_internas ?? null,
    };

    const { data: nuevoProducto, error: dbError } = await supabase.from("productos_inventario").insert([dataToInsert]).select("id, nombre, requiere_lote").single();
    if (dbError || !nuevoProducto) {
        console.error("Error al insertar producto en catálogo:", dbError);
        if (dbError?.code === '23505') { 
            let field = dbError.message.includes('nombre') ? 'nombre' : dbError.message.includes('codigo_producto') ? 'código de producto' : 'campo único';
            return { success: false, error: { message: `Ya existe un producto con este ${field}.`} };
        }
        return { success: false, error: { message: `Error de base de datos: ${dbError?.message || 'No se pudo crear el producto.'}` } };
    }

    if (nuevoProducto.requiere_lote === false && stock_no_lote_valor !== undefined && stock_no_lote_valor > 0) {
        const numeroLoteGenerico = `${NOMBRE_LOTE_GENERICO_BASE}_${nuevoProducto.id.substring(0, 8)}`;
        const { data: loteCreado, error: loteError } = await supabase.from('lotes_producto').insert({
            producto_id: nuevoProducto.id, numero_lote: numeroLoteGenerico, stock_lote: stock_no_lote_valor,
            fecha_entrada: new Date().toISOString().split('T')[0], esta_activo: true, updated_at: new Date().toISOString(),
        }).select('id').single();
        if (loteError || !loteCreado) { console.error("Error creando lote genérico:", loteError); }
        else {
            await supabase.from('movimientos_inventario').insert({
                lote_id: loteCreado.id, producto_id: nuevoProducto.id, tipo_movimiento: 'Entrada Compra',
                cantidad: stock_no_lote_valor, notas: "Stock inicial para producto sin lotes.",
            });
        }
    }
    revalidatePath("/dashboard/inventario");
    return { success: true, data: nuevoProducto };
  } catch (e: any) {
    console.error("Error inesperado en agregarProductoCatalogo:", e);
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

export async function actualizarProductoCatalogo(id: string, formData: FormData) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: { message: "Usuario no autenticado." } };
    if (!z.string().uuid().safeParse(id).success) return { success: false, error: { message: "ID de producto inválido." }};
    
    const rawFormData = {
        nombre: formData.get("nombre"), descripcion: formData.get("descripcion"),
        codigo_producto: formData.get("codigo_producto"), unidad: formData.get("unidad"),
        stock_minimo: formData.get("stock_minimo"), precio_compra: formData.get("precio_compra"),
        precio_venta: formData.get("precio_venta"), porcentaje_impuesto: formData.get("porcentaje_impuesto"),
        requiere_lote: formData.get("requiere_lote"), notas_internas: formData.get("notas_internas"),
        stock_no_lote_valor: formData.get("stock_no_lote_valor"),
    };
    const validatedFields = ProductoCatalogoSchemaBase.partial().safeParse(rawFormData);
    if (!validatedFields.success) return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };

    const { stock_no_lote_valor: nuevoStockDeseadoNoLote, ...productCatalogDataToUpdate } = validatedFields.data;
    const dataToUpdateDb: { [key: string]: any } = {};
    let hasProductDataChanges = false;

    (Object.keys(productCatalogDataToUpdate) as Array<keyof typeof productCatalogDataToUpdate>).forEach(key => {
        if (productCatalogDataToUpdate[key] !== undefined) {
            if (key === 'stock_minimo') { dataToUpdateDb[key] = productCatalogDataToUpdate[key] ?? 0; }
            else if (key === 'requiere_lote' || key === 'porcentaje_impuesto') { dataToUpdateDb[key] = productCatalogDataToUpdate[key]; }
            else { dataToUpdateDb[key] = productCatalogDataToUpdate[key] ?? null; }
            hasProductDataChanges = true;
        }
    });

    let stockGestionadoEsteUpdate = false; let mensajeStock = "";
    if (dataToUpdateDb.requiere_lote === false && nuevoStockDeseadoNoLote !== undefined) {
        const numeroLoteGenerico = `${NOMBRE_LOTE_GENERICO_BASE}_${id.substring(0, 8)}`;
        const { data: loteGenerico, error: errLote } = await supabase.from('lotes_producto').select('id, stock_lote').eq('producto_id', id).eq('numero_lote', numeroLoteGenerico).maybeSingle();
        if (errLote) return { success: false, error: { message: "Error al buscar lote genérico." } };
        if (loteGenerico) {
            if (nuevoStockDeseadoNoLote !== loteGenerico.stock_lote) {
                const cantidadAjuste = nuevoStockDeseadoNoLote - loteGenerico.stock_lote;
                const tipoMovimientoAjuste: TipoMovimientoInventarioValue = cantidadAjuste > 0 ? 'Ajuste Positivo' : 'Ajuste Negativo';
                const { error: updateLoteError } = await supabase.from('lotes_producto').update({ stock_lote: nuevoStockDeseadoNoLote, updated_at: new Date().toISOString() }).eq('id', loteGenerico.id);
                if (updateLoteError) return { success: false, error: { message: "Error al actualizar stock del lote genérico." } };
                if (cantidadAjuste !== 0) await supabase.from('movimientos_inventario').insert({ lote_id: loteGenerico.id, producto_id: id, tipo_movimiento: tipoMovimientoAjuste, cantidad: Math.abs(cantidadAjuste), notas: `Ajuste de stock al editar catálogo (no lote). Anterior: ${loteGenerico.stock_lote}.`, });
                stockGestionadoEsteUpdate = true; mensajeStock = " Stock ajustado.";
            }
        } else if (nuevoStockDeseadoNoLote > 0) {
            const { data: loteCreado, error: loteError } = await supabase.from('lotes_producto').insert({ producto_id: id, numero_lote: numeroLoteGenerico, stock_lote: nuevoStockDeseadoNoLote, fecha_entrada: new Date().toISOString().split('T')[0], esta_activo: true, updated_at: new Date().toISOString(), }).select('id').single();
            if (loteError || !loteCreado) return { success: false, error: { message: "Error al crear lote genérico para stock." } };
            await supabase.from('movimientos_inventario').insert({ lote_id: loteCreado.id, producto_id: id, tipo_movimiento: 'Ajuste Positivo', cantidad: nuevoStockDeseadoNoLote, notas: "Stock establecido al editar catálogo (no lote).", });
            stockGestionadoEsteUpdate = true; mensajeStock = " Stock establecido.";
        }
    }
    if (!hasProductDataChanges && !stockGestionadoEsteUpdate) return { success: true, message: "No se proporcionaron datos diferentes para actualizar.", data: null };
    if (hasProductDataChanges) {
        dataToUpdateDb.updated_at = new Date().toISOString();
        const { data, error: dbError } = await supabase.from("productos_inventario").update(dataToUpdateDb).eq("id", id).select().single();
        if (dbError) {
             console.error("Error al actualizar producto del catálogo:", dbError);
            if (dbError.code === '23505') { 
                let field = dbError.message.includes('nombre') ? 'nombre' : dbError.message.includes('codigo_producto') ? 'código' : 'campo único';
                return { success: false, error: { message: `Ya existe un producto con este ${field}.`} };
            }
            return { success: false, error: { message: `Error de base de datos al actualizar: ${dbError.message}` } };
        }
    }
    revalidatePath("/dashboard/inventario"); revalidatePath(`/dashboard/inventario/${id}`); revalidatePath(`/dashboard/inventario/${id}/editar`);
    return { success: true, message: "Producto actualizado correctamente." + mensajeStock };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

export async function eliminarProductoCatalogo(id: string) {
  try {
    if (!z.string().uuid().safeParse(id).success) return { success: false, error: { message: "ID de producto inválido." }};
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: { message: "Usuario no autenticado." }};
    const { error: dbError, count } = await supabase.from("productos_inventario").delete({ count: 'exact' }).eq("id", id);
    if (dbError) {
      if (dbError.code === '23503') return { success: false, error: { message: "No se puede eliminar: el producto tiene lotes o movimientos asociados."}};
      return { success: false, error: { message: `Error de base de datos: ${dbError.message}` }};
    }
    if (count === 0) return { success: false, error: { message: "El producto no se encontró." }};
    revalidatePath("/dashboard/inventario");
    return { success: true, message: "Producto eliminado." };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

export async function registrarEntradaLote(productoId: string, formData: FormData) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: { message: "Usuario no autenticado." } };
    if (!z.string().uuid().safeParse(productoId).success) return { success: false, error: { message: "ID de producto inválido." }};

    const rawFormData = {
        numero_lote: formData.get("numero_lote"), 
        stock_lote: formData.get("stock_lote"),
        fecha_entrada: formData.get("fecha_entrada"), 
        fecha_caducidad: formData.get("fecha_caducidad"),
    };
    console.log("[registrarEntradaLote] Raw FormData:", rawFormData);
    const validatedFields = EntradaLoteSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
        console.error("[registrarEntradaLote] Error de Zod:", validatedFields.error.flatten());
        return { success: false, error: { message: "Error de validación. Revisa los campos.", errors: validatedFields.error.flatten().fieldErrors } };
    }

    let { numero_lote, stock_lote: stockEntrada, fecha_entrada, fecha_caducidad } = validatedFields.data;
    // fecha_entrada y fecha_caducidad ya están formateados como YYYY-MM-DD o son undefined por Zod

    if (numero_lote === NOMBRE_LOTE_GENERICO_BASE) {
        numero_lote = `${NOMBRE_LOTE_GENERICO_BASE}_${productoId.substring(0, 8)}`;
    }

    let loteParaMovimientoId: string;
    const { data: lotePrevio, error: errorLotePrevio } = await supabase
        .from('lotes_producto').select('id, stock_lote').eq('producto_id', productoId).eq('numero_lote', numero_lote).maybeSingle();
    if (errorLotePrevio) return { success: false, error: { message: `Error de BD al buscar lote: ${errorLotePrevio.message}` } };

    if (lotePrevio) {
        loteParaMovimientoId = lotePrevio.id;
        const nuevoStock = lotePrevio.stock_lote + stockEntrada;
        const updatePayload: any = { 
            stock_lote: nuevoStock, 
            fecha_entrada: fecha_entrada, // Usar el valor validado/transformado
            updated_at: new Date().toISOString(), 
            esta_activo: true 
        };
        if (fecha_caducidad !== undefined) { // Zod lo hace undefined si era "" o null
            updatePayload.fecha_caducidad = fecha_caducidad; // Usar el valor validado/transformado (puede ser undefined -> null)
        }
        
        const { error: updateError } = await supabase.from('lotes_producto').update(updatePayload).eq('id', loteParaMovimientoId);
        if (updateError) return { success: false, error: { message: `Error de BD al actualizar lote: ${updateError.message}` } };
    } else {
        const { data: nuevoLote, error: insertLoteError } = await supabase.from('lotes_producto').insert({
            producto_id: productoId, numero_lote, stock_lote: stockEntrada, 
            fecha_entrada: fecha_entrada, // Usar el valor validado/transformado
            fecha_caducidad: fecha_caducidad, // Usar el valor validado/transformado (puede ser undefined -> null)
            esta_activo: true, updated_at: new Date().toISOString(),
        }).select('id').single();
        if (insertLoteError || !nuevoLote) return { success: false, error: { message: `Error de BD al crear lote: ${insertLoteError?.message || 'No se pudo crear.'}` } };
        loteParaMovimientoId = nuevoLote.id;
    }
    
    const notasMovimiento = formData.get("notas_movimiento_entrada") as string || `Entrada de stock para lote ${numero_lote}`;
    const { error: movimientoError } = await supabase.from('movimientos_inventario').insert({
        lote_id: loteParaMovimientoId, producto_id: productoId, tipo_movimiento: 'Entrada Compra', 
        cantidad: stockEntrada, notas: notasMovimiento
    });
    if (movimientoError) return { success: false, error: { message: `Lote ${lotePrevio ? 'actualizado' : 'creado'}, pero falló el movimiento: ${movimientoError.message}. Revisar.` } };

    revalidatePath(`/dashboard/inventario/${productoId}`); revalidatePath("/dashboard/inventario");
    return { success: true, message: `Entrada de lote "${numero_lote}" registrada.` };
  } catch (e: any) {
    console.error("Error inesperado en registrarEntradaLote:", e);
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

export async function actualizarDatosLote(loteId: string, productoId: string, formData: FormData) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: { message: "Usuario no autenticado." } };
    if (!z.string().uuid().safeParse(loteId).success || !z.string().uuid().safeParse(productoId).success) {
        return { success: false, error: { message: "ID de lote o producto inválido." }};
    }
    const rawFormData = {
        numero_lote: formData.get("numero_lote"), fecha_entrada: formData.get("fecha_entrada"),
        fecha_caducidad: formData.get("fecha_caducidad"), stock_lote: formData.get("stock_lote"),
    };
    const validatedFields = UpdateLoteSchema.safeParse(rawFormData);
    if (!validatedFields.success) return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors }, };

    const { data: loteAnterior, error: errLoteAnterior } = await supabase.from('lotes_producto').select('stock_lote, numero_lote').eq('id', loteId).single();
    if (errLoteAnterior || !loteAnterior) return { success: false, error: { message: "Lote original no encontrado." } };

    const dataToUpdate: { [key: string]: any } = { updated_at: new Date().toISOString() };
    let stockFueModificado = false; let nuevoStockValor: number | undefined = undefined; let hasOtherChanges = false;

    if (validatedFields.data.numero_lote !== undefined) { dataToUpdate.numero_lote = validatedFields.data.numero_lote; hasOtherChanges = true;}
    if (validatedFields.data.fecha_entrada !== undefined) { dataToUpdate.fecha_entrada = validatedFields.data.fecha_entrada; hasOtherChanges = true;} // Ya está formateado o es undefined
    if (validatedFields.data.fecha_caducidad !== undefined) { dataToUpdate.fecha_caducidad = validatedFields.data.fecha_caducidad; hasOtherChanges = true;} // Ya está formateado o es undefined
    if (validatedFields.data.stock_lote !== undefined) {
        nuevoStockValor = validatedFields.data.stock_lote; dataToUpdate.stock_lote = nuevoStockValor;
        if (nuevoStockValor !== loteAnterior.stock_lote) stockFueModificado = true;
    }
    if (!hasOtherChanges && !stockFueModificado) return { success: true, message: "No hay cambios para actualizar.", data: loteAnterior };
    if (dataToUpdate.numero_lote && dataToUpdate.numero_lote !== loteAnterior.numero_lote) {
        const { data: loteExistente } = await supabase.from('lotes_producto').select('id').eq('producto_id', productoId).eq('numero_lote', dataToUpdate.numero_lote).neq('id', loteId).maybeSingle();
        if (loteExistente) return { success: false, error: { message: `El número de lote "${dataToUpdate.numero_lote}" ya existe.`, errors: {numero_lote: ["Este N. de lote ya está en uso."]} } };
    }

    const { data, error: dbError } = await supabase.from("lotes_producto").update(dataToUpdate).eq("id", loteId).select('id, producto_id').single();
    if (dbError) return { success: false, error: { message: `Error de BD al actualizar lote: ${dbError.message}` } };

    if (stockFueModificado && nuevoStockValor !== undefined) {
        const cantidadAjuste = nuevoStockValor - loteAnterior.stock_lote;
        if (cantidadAjuste !== 0) {
            const tipoMovimientoAjuste: TipoMovimientoInventarioValue = cantidadAjuste > 0 ? 'Ajuste Positivo' : 'Ajuste Negativo';
            await supabase.from('movimientos_inventario').insert({ lote_id: loteId, producto_id: productoId, tipo_movimiento: tipoMovimientoAjuste, cantidad: Math.abs(cantidadAjuste), notas: `Ajuste manual al editar lote. Anterior: ${loteAnterior.stock_lote}.` });
        }
    }
    revalidatePath(`/dashboard/inventario/${productoId}`); 
    return { success: true, data, message: "Lote actualizado." };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

export async function inactivarLoteProducto(loteId: string, productoId: string) {
  try {
    if (!z.string().uuid().safeParse(loteId).success || !z.string().uuid().safeParse(productoId).success) return { success: false, error: { message: "IDs inválidos." }};
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: { message: "No autenticado." } };
    const { data, error } = await supabase.from("lotes_producto").update({ esta_activo: false, updated_at: new Date().toISOString() }).eq("id", loteId).eq("producto_id", productoId).select("id").single();
    if (error || !data) return { success: false, error: { message: `Error al inactivar lote: ${error?.message || 'No encontrado.'}` } };
    revalidatePath(`/dashboard/inventario/${productoId}`); revalidatePath("/dashboard/inventario"); 
    return { success: true, message: "Lote inactivado." };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

export async function reactivarLoteProducto(loteId: string, productoId: string) {
  try {
    if (!z.string().uuid().safeParse(loteId).success || !z.string().uuid().safeParse(productoId).success) return { success: false, error: { message: "IDs inválidos." }};
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: { message: "No autenticado." } };
    const { data, error } = await supabase.from("lotes_producto").update({ esta_activo: true, updated_at: new Date().toISOString() }).eq("id", loteId).eq("producto_id", productoId).select("id").single();
    if (error || !data) return { success: false, error: { message: `Error al reactivar lote: ${error?.message || 'No encontrado.'}` } };
    revalidatePath(`/dashboard/inventario/${productoId}`); revalidatePath("/dashboard/inventario"); 
    return { success: true, message: "Lote reactivado." };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

export async function registrarMovimientoStock(productoId: string, loteId: string, formData: FormData) {
  try {
    if (!z.string().uuid().safeParse(productoId).success || !z.string().uuid().safeParse(loteId).success) {
        return { success: false, error: { message: "IDs de producto o lote inválidos." }};
    }
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

    const rawFormData = { tipo_movimiento: formData.get("tipo_movimiento"), cantidad: formData.get("cantidad"), notas: formData.get("notas") };
    const validatedFields = MovimientoStockSchema.safeParse(rawFormData);
    if (!validatedFields.success) return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };

    const { tipo_movimiento, cantidad: cantidadMovimiento, notas } = validatedFields.data;
    let cantidadAjusteStock = 0;
    switch (tipo_movimiento) {
        case 'Entrada Compra': case 'Ajuste Positivo': case 'Devolución Cliente': cantidadAjusteStock = Math.abs(cantidadMovimiento); break;
        case 'Salida Venta': case 'Salida Uso Interno': case 'Ajuste Negativo': case 'Devolución Proveedor': case 'Transferencia': cantidadAjusteStock = -Math.abs(cantidadMovimiento); break;
        default: return { success: false, error: { message: "Tipo de movimiento no reconocido." } };
    }

    const { data: loteActual, error: loteError } = await supabase.from('lotes_producto').select('stock_lote').eq('id', loteId).single();
    if (loteError || !loteActual) return { success: false, error: { message: `Lote no encontrado: ${loteError?.message || 'No encontrado.'}` } };

    const nuevoStockLote = loteActual.stock_lote + cantidadAjusteStock;
    if (nuevoStockLote < 0) return { success: false, error: { message: `Stock insuficiente. Actual: ${loteActual.stock_lote}, se intentó mover: ${cantidadAjusteStock}.` } };

    const { error: updateLoteError } = await supabase.from('lotes_producto').update({ stock_lote: nuevoStockLote, updated_at: new Date().toISOString() }).eq('id', loteId);
    if (updateLoteError) return { success: false, error: { message: `Error de BD al actualizar stock del lote: ${updateLoteError.message}` } };

    const { error: movimientoError } = await supabase.from('movimientos_inventario').insert({
        lote_id: loteId, producto_id: productoId, tipo_movimiento, cantidad: cantidadMovimiento, notas: notas ?? null,
    });
    if (movimientoError) return { success: false, error: { message: `Stock del lote actualizado, PERO falló el registro del movimiento: ${movimientoError.message}. Revisar manualmente.` } };

    revalidatePath(`/dashboard/inventario/${productoId}`); revalidatePath("/dashboard/inventario");
    return { success: true, message: `Movimiento de stock (${tipo_movimiento}) registrado.` };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}