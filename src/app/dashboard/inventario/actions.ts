// app/dashboard/inventario/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { 
    unidadesDeMedidaInventarioOpciones, 
    tiposDeMovimientoInventarioOpciones 
} from "./types"; // Asumiendo que types.ts está en la misma carpeta ./inventario

// Extraemos los valores para los enums de Zod a partir de las opciones importadas
const unidadesDeMedidaValues = unidadesDeMedidaInventarioOpciones.map(u => u.value) as [string, ...string[]];
const tiposDeMovimientoValues = tiposDeMovimientoInventarioOpciones.map(t => t.value) as [string, ...string[]];


// Esquema de Zod base para la validación de datos del producto del catálogo
const ProductoCatalogoSchemaBase = z.object({
  nombre: z.string().min(1, "El nombre del producto es requerido."),
  descripcion: z.string().transform(val => val === '' ? undefined : val).optional(),
  codigo_producto: z.string().transform(val => val === '' ? undefined : val).optional(),
  unidad: z.enum(unidadesDeMedidaValues).default('Unidad'),
  stock_minimo: z.coerce.number().int("El stock mínimo debe ser un número entero.")
    .min(0, "El stock mínimo no puede ser negativo.")
    .optional().or(z.literal('').transform(() => undefined)),
  precio_compra: z.coerce.number().min(0, "El precio de compra no puede ser negativo.")
    .optional().or(z.literal('').transform(() => undefined)),
  precio_venta: z.coerce.number().min(0, "El precio de venta no puede ser negativo.")
    .optional().or(z.literal('').transform(() => undefined)),
  requiere_lote: z.preprocess((val) => val === 'on' || val === true, z.boolean().default(true)),
  notas_internas: z.string().transform(val => val === '' ? undefined : val).optional(),
});

// Esquema de Zod para validar una nueva entrada de lote
const EntradaLoteSchema = z.object({
  numero_lote: z.string().min(1, "El número de lote es requerido."),
  stock_lote: z.coerce.number().int("El stock debe ser un número entero.")
    .positive("El stock de entrada debe ser un número positivo."),
  fecha_entrada: z.string() 
    .transform(val => val === '' ? undefined : val) 
    .refine((date) => date === undefined || !isNaN(Date.parse(date)), { message: "Fecha de entrada inválida."})
    .default(new Date().toISOString().split('T')[0]),
  fecha_caducidad: z.string().transform(val => val === '' ? undefined : val)
    .refine((date) => date === undefined || !isNaN(Date.parse(date)), { message: "Fecha de caducidad inválida."})
    .optional(),
});

// Esquema de Zod para validar un nuevo movimiento de stock (salidas, ajustes manuales)
const MovimientoStockSchema = z.object({
  tipo_movimiento: z.enum(tiposDeMovimientoValues),
  cantidad: z.coerce.number().int("La cantidad debe ser un número entero.")
    .refine(val => val !== 0, "La cantidad no puede ser cero."),
  notas: z.string().optional().transform(val => val === '' ? undefined : val),
});

// Esquema de Zod para validar la actualización de datos de un lote (no el stock directamente)
const UpdateLoteSchema = z.object({
  numero_lote: z.string().min(1, "El número de lote es requerido.").optional(),
  fecha_entrada: z.string()
    .transform(val => val === '' ? undefined : val)
    .refine((date) => date === undefined || !isNaN(Date.parse(date)), { message: "Fecha de entrada inválida."})
    .optional(),
  fecha_caducidad: z.string().transform(val => val === '' ? undefined : val)
    .refine((date) => date === undefined || !isNaN(Date.parse(date)), { message: "Fecha de caducidad inválida."})
    .optional(),
  stock_lote: z.coerce.number().int("El stock debe ser un número entero.") // Para editar el stock del lote
    .min(0, "El stock no puede ser negativo.")
    .optional(), // Opcional en el esquema, el form lo enviará
});


// --- ACCIONES DEL CATÁLOGO DE PRODUCTOS ---
export async function agregarProductoCatalogo(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

  const rawFormData = {
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
    codigo_producto: formData.get("codigo_producto"),
    unidad: formData.get("unidad"),
    stock_minimo: formData.get("stock_minimo"),
    precio_compra: formData.get("precio_compra"),
    precio_venta: formData.get("precio_venta"),
    requiere_lote: formData.get("requiere_lote"),
    notas_internas: formData.get("notas_internas"),
  };
  const validatedFields = ProductoCatalogoSchemaBase.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };
  }
  
  const dataToInsert = {
    nombre: validatedFields.data.nombre,
    descripcion: validatedFields.data.descripcion ?? null,
    codigo_producto: validatedFields.data.codigo_producto ?? null,
    unidad: validatedFields.data.unidad,
    stock_minimo: validatedFields.data.stock_minimo ?? 0,
    precio_compra: validatedFields.data.precio_compra ?? null,
    precio_venta: validatedFields.data.precio_venta ?? null,
    requiere_lote: validatedFields.data.requiere_lote,
    notas_internas: validatedFields.data.notas_internas ?? null,
  };
  const { data, error: dbError } = await supabase.from("productos_inventario").insert([dataToInsert]).select().single();

  if (dbError) {
    console.error("Error al insertar producto en catálogo:", dbError);
    if (dbError.code === '23505') { 
        let field = 'desconocido';
        if (dbError.message.includes('productos_inventario_nombre_key')) field = 'nombre';
        else if (dbError.message.includes('productos_inventario_codigo_producto_key')) field = 'código de producto';
        return { success: false, error: { message: `Ya existe un producto con este ${field}.`} };
    }
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
  }
  revalidatePath("/dashboard/inventario");
  return { success: true, data };
}

export async function actualizarProductoCatalogo(id: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

  if (!z.string().uuid().safeParse(id).success) return { success: false, error: { message: "ID de producto inválido." }};
  
  const rawFormData = {
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
    codigo_producto: formData.get("codigo_producto"),
    unidad: formData.get("unidad"),
    stock_minimo: formData.get("stock_minimo"),
    precio_compra: formData.get("precio_compra"),
    precio_venta: formData.get("precio_venta"),
    requiere_lote: formData.get("requiere_lote"),
    notas_internas: formData.get("notas_internas"),
  };
  const validatedFields = ProductoCatalogoSchemaBase.partial().safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors } };
  }

  const dataToUpdate: { [key: string]: any } = { updated_at: new Date().toISOString() };
  let hasChanges = false;
  (Object.keys(validatedFields.data) as Array<keyof typeof validatedFields.data>).forEach(key => {
    if (validatedFields.data[key] !== undefined) {
        if (key === 'stock_minimo') { dataToUpdate[key] = validatedFields.data[key] ?? 0; }
        else if (key === 'requiere_lote') { dataToUpdate[key] = validatedFields.data[key];  }
        else { dataToUpdate[key] = validatedFields.data[key] ?? null; }
        hasChanges = true;
    }
  });

  if (!hasChanges) return { success: true, message: "No se proporcionaron datos diferentes para actualizar.", data: null };

  const { data, error: dbError } = await supabase.from("productos_inventario").update(dataToUpdate).eq("id", id).select().single();

  if (dbError) {
    console.error("Error al actualizar producto del catálogo:", dbError);
    if (dbError.code === '23505') { 
        let field = dbError.message.includes('nombre') ? 'nombre' : dbError.message.includes('codigo_producto') ? 'código' : 'campo único';
        return { success: false, error: { message: `Ya existe un producto con este ${field}.`} };
    }
    return { success: false, error: { message: `Error de base de datos al actualizar: ${dbError.message}` } };
  }
  revalidatePath("/dashboard/inventario");
  revalidatePath(`/dashboard/inventario/${id}`);
  revalidatePath(`/dashboard/inventario/${id}/editar`);
  return { success: true, data };
}

export async function eliminarProductoCatalogo(id: string) {
  if (!z.string().uuid().safeParse(id).success) return { success: false, error: { message: "ID de producto inválido." }};
  
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Usuario no autenticado." }};
  
  const { error: dbError, count } = await supabase.from("productos_inventario").delete({ count: 'exact' }).eq("id", id);

  if (dbError) {
    console.error("Error al eliminar producto del catálogo:", dbError);
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` }};
  }
  if (count === 0) return { success: false, error: { message: "El producto no se encontró o no se pudo eliminar." }};
  
  revalidatePath("/dashboard/inventario");
  return { success: true, message: "Producto eliminado del catálogo correctamente." };
}


// --- Acciones para Lotes ---
export async function registrarEntradaLote(productoId: string, formData: FormData) {
  if (!z.string().uuid().safeParse(productoId).success) return { success: false, error: { message: "ID de producto inválido." }};

  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

  const rawFormData = {
    numero_lote: formData.get("numero_lote"),
    stock_lote: formData.get("stock_lote"),
    fecha_entrada: formData.get("fecha_entrada"),
    fecha_caducidad: formData.get("fecha_caducidad"),
  };
  const validatedFields = EntradaLoteSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: { message: "Error de validación para la entrada de lote.", errors: validatedFields.error.flatten().fieldErrors } };
  }

  const { numero_lote, stock_lote: stockEntrada, fecha_entrada, fecha_caducidad } = validatedFields.data;
  let loteParaMovimientoId: string;
  const operacionTipoLote: 'insert' | 'update' = 'insert'; // Para el mensaje de error del movimiento

  const { data: lotePrevio, error: errorLotePrevio } = await supabase
    .from('lotes_producto').select('id, stock_lote').eq('producto_id', productoId).eq('numero_lote', numero_lote).single();

  if (errorLotePrevio && errorLotePrevio.code !== 'PGRST116') { 
    return { success: false, error: { message: `Error de BD al buscar lote: ${errorLotePrevio.message}` } };
  }

  if (lotePrevio) {
    loteParaMovimientoId = lotePrevio.id;
    const nuevoStock = lotePrevio.stock_lote + stockEntrada;
    const updateLotePayload: any = { 
        stock_lote: nuevoStock, 
        fecha_entrada: new Date(fecha_entrada).toISOString().split('T')[0], // Actualizar fecha_entrada si el lote existe
        updated_at: new Date().toISOString() 
    };
    if (fecha_caducidad !== undefined) { // Actualizar fecha_caducidad si se provee
        updateLotePayload.fecha_caducidad = fecha_caducidad ? new Date(fecha_caducidad).toISOString().split('T')[0] : null;
    }
    
    const { error: updateError } = await supabase.from('lotes_producto').update(updateLotePayload).eq('id', loteParaMovimientoId);
    if (updateError) return { success: false, error: { message: `Error de BD al actualizar lote: ${updateError.message}` } };
  } else {
    const { data: nuevoLote, error: insertLoteError } = await supabase
      .from('lotes_producto')
      .insert({
        producto_id: productoId, numero_lote, stock_lote: stockEntrada, 
        fecha_entrada: new Date(fecha_entrada).toISOString().split('T')[0],
        fecha_caducidad: fecha_caducidad ? new Date(fecha_caducidad).toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
        // esta_activo se setea por DEFAULT TRUE en la BD
      }).select('id').single();
    if (insertLoteError || !nuevoLote) return { success: false, error: { message: `Error de BD al crear lote: ${insertLoteError?.message || 'No se pudo crear el lote.'}` } };
    loteParaMovimientoId = nuevoLote.id;
  }

  const { error: movimientoError } = await supabase.from('movimientos_inventario').insert({
    lote_id: loteParaMovimientoId, producto_id: productoId, tipo_movimiento: 'Entrada Compra', cantidad: stockEntrada,
  });

  if (movimientoError) {
    return { success: false, error: { message: `Lote ${lotePrevio ? 'actualizado' : 'creado'}, pero falló el registro del movimiento: ${movimientoError.message}. Revisar manualmente.` } };
  }

  revalidatePath(`/dashboard/inventario/${productoId}`);
  revalidatePath("/dashboard/inventario");
  return { success: true, message: `Entrada de lote "${numero_lote}" registrada.` };
}

export async function actualizarDatosLote(
  loteId: string,
  productoId: string,
  formData: FormData
) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

  if (!z.string().uuid().safeParse(loteId).success || !z.string().uuid().safeParse(productoId).success) {
      return { success: false, error: { message: "ID de lote o producto proporcionado no es válido." }};
  }

  const rawFormData = {
    numero_lote: formData.get("numero_lote"),
    fecha_entrada: formData.get("fecha_entrada"),
    fecha_caducidad: formData.get("fecha_caducidad"),
    stock_lote: formData.get("stock_lote"), // Leemos el nuevo stock del formulario
  };

  const validatedFields = UpdateLoteSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (actualizarDatosLote):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación al actualizar datos del lote.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const { data: loteAnterior, error: errLoteAnterior } = await supabase
    .from('lotes_producto').select('stock_lote, numero_lote').eq('id', loteId).single();
  if (errLoteAnterior || !loteAnterior) {
    return { success: false, error: { message: "No se pudo encontrar el lote para actualizar." } };
  }

  const dataToUpdate: { [key: string]: any } = { updated_at: new Date().toISOString() };
  let stockFueModificado = false;
  let nuevoStockValor: number | undefined = undefined;

  if (validatedFields.data.numero_lote !== undefined) dataToUpdate.numero_lote = validatedFields.data.numero_lote;
  if (validatedFields.data.fecha_entrada !== undefined) {
    dataToUpdate.fecha_entrada = validatedFields.data.fecha_entrada ? new Date(validatedFields.data.fecha_entrada).toISOString().split('T')[0] : null;
  }
  if (validatedFields.data.fecha_caducidad !== undefined) {
    dataToUpdate.fecha_caducidad = validatedFields.data.fecha_caducidad ? new Date(validatedFields.data.fecha_caducidad).toISOString().split('T')[0] : null;
  }
  if (validatedFields.data.stock_lote !== undefined) {
    nuevoStockValor = validatedFields.data.stock_lote;
    dataToUpdate.stock_lote = nuevoStockValor;
    stockFueModificado = nuevoStockValor !== loteAnterior.stock_lote;
  }
  
  const camposCambiados = Object.keys(dataToUpdate).filter(k => k !== 'updated_at');
  if (camposCambiados.length === 0) {
    return { success: true, message: "No se proporcionaron datos diferentes para actualizar el lote.", data: null };
  }
  
  if (dataToUpdate.numero_lote && dataToUpdate.numero_lote !== loteAnterior.numero_lote) {
    const { data: loteExistenteConMismoNumero } = await supabase
      .from('lotes_producto').select('id').eq('producto_id', productoId).eq('numero_lote', dataToUpdate.numero_lote).neq('id', loteId).maybeSingle();
    if (loteExistenteConMismoNumero) {
      return { success: false, error: { message: `Ya existe otro lote con el número "${dataToUpdate.numero_lote}" para este producto.`, errors: {numero_lote: ["Este número de lote ya está en uso."]} } };
    }
  }

  const { data, error: dbError } = await supabase.from("lotes_producto").update(dataToUpdate).eq("id", loteId).select('id, producto_id').single();
  if (dbError) {
    console.error("Error al actualizar datos del lote:", dbError);
    return { success: false, error: { message: `Error de base de datos al actualizar lote: ${dbError.message}` } };
  }

  if (stockFueModificado && nuevoStockValor !== undefined) {
    const cantidadAjuste = nuevoStockValor - loteAnterior.stock_lote;
    if (cantidadAjuste !== 0) {
      const tipoMovimientoAjuste = cantidadAjuste > 0 ? 'Ajuste Positivo' : 'Ajuste Negativo';
      const { error: movimientoError } = await supabase.from('movimientos_inventario').insert({
        lote_id: loteId, producto_id: productoId, tipo_movimiento: tipoMovimientoAjuste,
        cantidad: Math.abs(cantidadAjuste), notas: `Ajuste manual de stock al editar lote. Stock anterior: ${loteAnterior.stock_lote}.`,
      });
      if (movimientoError) {
        return { success: true, data, message: "Datos del lote actualizados, PERO falló el registro del movimiento de ajuste. Revisar manualmente." };
      }
    }
  }

  revalidatePath(`/dashboard/inventario/${productoId}`); 
  return { success: true, data, message: "Datos del lote actualizados correctamente." };
}

export async function inactivarLoteProducto(loteId: string, productoId: string) {
  if (!z.string().uuid().safeParse(loteId).success || !z.string().uuid().safeParse(productoId).success) {
    return { success: false, error: { message: "ID de lote o producto inválido." }};
  }
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

  const { data: loteActualizado, error: dbError } = await supabase
    .from("lotes_producto").update({ esta_activo: false, updated_at: new Date().toISOString() })
    .eq("id", loteId).eq("producto_id", productoId).select().single();

  if (dbError) {
    return { success: false, error: { message: `Error de base de datos al inactivar lote: ${dbError.message}` } };
  }
  if (!loteActualizado) {
    return { success: false, error: { message: "El lote no se encontró para inactivar." } };
  }
  revalidatePath(`/dashboard/inventario/${productoId}`);
  revalidatePath("/dashboard/inventario"); 
  return { success: true, message: "Lote inactivado correctamente." };
}

export async function registrarMovimientoStock(
  productoId: string, loteId: string, formData: FormData
) {
  if (!z.string().uuid().safeParse(productoId).success || !z.string().uuid().safeParse(loteId).success) {
    return { success: false, error: { message: "IDs de producto o lote inválidos." }};
  }
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

  const rawFormData = {
    tipo_movimiento: formData.get("tipo_movimiento"),
    cantidad: formData.get("cantidad"),
    notas: formData.get("notas"),
  };
  const validatedFields = MovimientoStockSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };
  }

  const { tipo_movimiento, cantidad: cantidadMovimiento, notas } = validatedFields.data;
  let cantidadAjusteStock = 0;
  switch (tipo_movimiento) {
    case 'Entrada Compra': case 'Ajuste Positivo': case 'Devolución Cliente':
      cantidadAjusteStock = Math.abs(cantidadMovimiento); break;
    case 'Salida Venta': case 'Salida Uso Interno': case 'Ajuste Negativo': case 'Devolución Proveedor': case 'Transferencia':
      cantidadAjusteStock = -Math.abs(cantidadMovimiento); break;
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

  if (movimientoError) {
    return { success: false, error: { message: `Stock del lote actualizado, PERO falló el registro del movimiento: ${movimientoError.message}. Revisar manualmente.` } };
  }

  revalidatePath(`/dashboard/inventario/${productoId}`);
  revalidatePath("/dashboard/inventario");
  return { success: true, message: `Movimiento de stock (${tipo_movimiento}) registrado.` };
}
// --- ACCIÓN PARA REACTIVAR UN LOTE DE PRODUCTO ---
export async function reactivarLoteProducto(loteId: string, productoId: string) {
  if (!z.string().uuid().safeParse(loteId).success || !z.string().uuid().safeParse(productoId).success) {
    return { success: false, error: { message: "ID de lote o producto inválido." }};
  }

  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const { data: loteReactivado, error: dbError } = await supabase
    .from("lotes_producto")
    .update({ 
      esta_activo: true, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", loteId)
    .eq("producto_id", productoId) // Asegurar que pertenece al producto
    .select("id") // Para confirmar que la actualización encontró una fila
    .single();

  if (dbError) {
    console.error("Error al reactivar lote de producto:", dbError);
    return { success: false, error: { message: `Error de base de datos al reactivar lote: ${dbError.message}` } };
  }

  if (!loteReactivado) {
      return { success: false, error: { message: "El lote no se encontró para reactivar o no se pudo actualizar."}};
  }
  
  revalidatePath(`/dashboard/inventario/${productoId}`);
  revalidatePath("/dashboard/inventario"); 
  return { success: true, message: "Lote reactivado correctamente." };
}