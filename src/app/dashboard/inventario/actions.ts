// app/dashboard/inventario/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
// Importa las OPCIONES desde types.ts para usarlas en Zod
import { 
    unidadesDeMedidaInventarioOpciones, 
    tiposDeMovimientoInventarioOpciones 
} from "./types";

// Extraemos los valores para los enums de Zod
const unidadesDeMedidaValues = unidadesDeMedidaInventarioOpciones.map(u => u.value) as [string, ...string[]];
const tiposDeMovimientoValues = tiposDeMovimientoInventarioOpciones.map(t => t.value) as [string, ...string[]];


// Esquema de Zod base para la validación
const ProductoCatalogoSchemaBase = z.object({
  nombre: z.string().min(1, "El nombre del producto es requerido."),
  descripcion: z.string().transform(val => val === '' ? undefined : val).optional(),
  codigo_producto: z.string().transform(val => val === '' ? undefined : val).optional(),
  unidad: z.enum(unidadesDeMedidaValues).default('Unidad'), // Usa los valores derivados
  stock_minimo: z.coerce.number().int().min(0).optional().or(z.literal('').transform(() => undefined)),
  precio_compra: z.coerce.number().min(0).optional().or(z.literal('').transform(() => undefined)),
  precio_venta: z.coerce.number().min(0).optional().or(z.literal('').transform(() => undefined)),
  requiere_lote: z.preprocess((val) => val === 'on' || val === true, z.boolean().default(true)),
  notas_internas: z.string().transform(val => val === '' ? undefined : val).optional(),
});

const EntradaLoteSchema = z.object({
  numero_lote: z.string().min(1, "El número de lote es requerido."),
  stock_lote: z.coerce.number().int().positive("El stock de entrada debe ser un número positivo."),
  fecha_entrada: z.string()
    .transform(val => val === '' ? undefined : val) 
    .refine((date) => date === undefined || !isNaN(Date.parse(date)), { message: "Fecha de entrada inválida."})
    .default(new Date().toISOString().split('T')[0]),
  fecha_caducidad: z.string().transform(val => val === '' ? undefined : val)
    .refine((date) => date === undefined || !isNaN(Date.parse(date)), { message: "Fecha de caducidad inválida."})
    .optional(),
});

const MovimientoStockSchema = z.object({
  tipo_movimiento: z.enum(tiposDeMovimientoValues), // Usa los valores derivados
  cantidad: z.coerce.number().int().refine(val => val !== 0, "La cantidad no puede ser cero."),
  notas: z.string().optional().transform(val => val === '' ? undefined : val),
});


// --- ACCIÓN PARA AGREGAR UN NUEVO PRODUCTO AL CATÁLOGO ---
export async function agregarProductoCatalogo(formData: FormData) {
  // ... (código como lo tenías, asegurándote que ProductoCatalogoSchemaBase use unidadesDeMedidaValues) ...
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
        let field = dbError.message.includes('nombre') ? 'nombre' : dbError.message.includes('codigo_producto') ? 'código' : 'campo único';
        return { success: false, error: { message: `Ya existe un producto con este ${field}.`} };
    }
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
  }
  revalidatePath("/dashboard/inventario");
  return { success: true, data };
}

// --- ACCIÓN PARA ACTUALIZAR UN PRODUCTO DEL CATÁLOGO ---
export async function actualizarProductoCatalogo(id: string, formData: FormData) {
  // ... (código como lo tenías, asegurándote que ProductoCatalogoSchemaBase.partial() use unidadesDeMedidaValues) ...
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
  if (validatedFields.data.nombre !== undefined) { dataToUpdate.nombre = validatedFields.data.nombre; hasChanges = true; }
  if (validatedFields.data.descripcion !== undefined) { dataToUpdate.descripcion = validatedFields.data.descripcion ?? null; hasChanges = true; }
  if (validatedFields.data.codigo_producto !== undefined) { dataToUpdate.codigo_producto = validatedFields.data.codigo_producto ?? null; hasChanges = true; }
  if (validatedFields.data.unidad !== undefined) { dataToUpdate.unidad = validatedFields.data.unidad; hasChanges = true; }
  if (validatedFields.data.stock_minimo !== undefined) { dataToUpdate.stock_minimo = validatedFields.data.stock_minimo ?? 0; hasChanges = true; }
  if (validatedFields.data.precio_compra !== undefined) { dataToUpdate.precio_compra = validatedFields.data.precio_compra ?? null; hasChanges = true; }
  if (validatedFields.data.precio_venta !== undefined) { dataToUpdate.precio_venta = validatedFields.data.precio_venta ?? null; hasChanges = true; }
  if (validatedFields.data.requiere_lote !== undefined) { dataToUpdate.requiere_lote = validatedFields.data.requiere_lote; hasChanges = true; }
  if (validatedFields.data.notas_internas !== undefined) { dataToUpdate.notas_internas = validatedFields.data.notas_internas ?? null; hasChanges = true; }

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

// --- ACCIÓN PARA ELIMINAR UN PRODUCTO DEL CATÁLOGO ---
export async function eliminarProductoCatalogo(id: string) {
  // ... (código como lo tenías) ...
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

// --- ACCIÓN PARA REGISTRAR UNA NUEVA ENTRADA DE LOTE ---
export async function registrarEntradaLote(productoId: string, formData: FormData) {
  // ... (código como lo tenías) ...
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

  const { data: lotePrevio, error: errorLotePrevio } = await supabase
    .from('lotes_producto').select('id, stock_lote').eq('producto_id', productoId).eq('numero_lote', numero_lote).single();

  if (errorLotePrevio && errorLotePrevio.code !== 'PGRST116') { // PGRST116: 0 rows
    return { success: false, error: { message: `Error de BD al buscar lote: ${errorLotePrevio.message}` } };
  }

  if (lotePrevio) {
    loteParaMovimientoId = lotePrevio.id;
    const nuevoStock = lotePrevio.stock_lote + stockEntrada;
    const updateLotePayload: any = { stock_lote: nuevoStock, fecha_entrada, updated_at: new Date().toISOString() };
    if (fecha_caducidad !== undefined) updateLotePayload.fecha_caducidad = fecha_caducidad ? new Date(fecha_caducidad).toISOString().split('T')[0] : null;
    
    const { error: updateError } = await supabase.from('lotes_producto').update(updateLotePayload).eq('id', loteParaMovimientoId);
    if (updateError) return { success: false, error: { message: `Error de BD al actualizar lote: ${updateError.message}` } };
  } else {
    const { data: nuevoLote, error: insertLoteError } = await supabase
      .from('lotes_producto')
      .insert({
        producto_id: productoId, numero_lote, stock_lote: stockEntrada, fecha_entrada,
        fecha_caducidad: fecha_caducidad ? new Date(fecha_caducidad).toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      }).select('id').single();
    if (insertLoteError || !nuevoLote) return { success: false, error: { message: `Error de BD al crear lote: ${insertLoteError?.message || 'No se pudo crear el lote.'}` } };
    loteParaMovimientoId = nuevoLote.id;
  }

  const { error: movimientoError } = await supabase.from('movimientos_inventario').insert({
    lote_id: loteParaMovimientoId, producto_id: productoId, tipo_movimiento: 'Entrada Compra', cantidad: stockEntrada,
  });

  if (movimientoError) {
    return { success: false, error: { message: `Lote registrado/actualizado, pero falló el registro del movimiento: ${movimientoError.message}. Revisar manualmente.` } };
  }

  revalidatePath(`/dashboard/inventario/${productoId}`);
  revalidatePath("/dashboard/inventario");
  return { success: true, message: `Entrada de lote "${numero_lote}" registrada.` };
}

// --- ACCIÓN PARA REGISTRAR MOVIMIENTO DE STOCK (ENTRADA/SALIDA/AJUSTE) ---
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
  if (loteError || !loteActual) return { success: false, error: { message: `Lote no encontrado: ${loteError?.message || 'No encontrado'}` } };

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