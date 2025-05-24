// app/dashboard/inventario/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Valores del ENUM unidad_medida_inventario (de tu script SQL o types.ts)
// Si lo tienes en types.ts, importa 'unidadesDeMedidaInventarioOpciones' y mapea a values.
// Por ahora, lo defino aquí para asegurar que el archivo actions.ts sea autocontenido con sus validaciones.
const unidadesDeMedidaInventarioValues = [
  "Unidad", "Caja", "Blister", "Frasco", "Tubo", "Bolsa", 
  "ml", "L", "g", "kg", "Dosis", "Otro"
] as const;

// Esquema de Zod base para la validación de datos del producto del catálogo
const ProductoCatalogoSchemaBase = z.object({
  nombre: z.string().min(1, "El nombre del producto es requerido."),
  descripcion: z.string().transform(val => val === '' ? undefined : val).optional(),
  codigo_producto: z.string().transform(val => val === '' ? undefined : val).optional(),
  unidad: z.enum(unidadesDeMedidaInventarioValues).default('Unidad'),
  stock_minimo: z.coerce.number().int("Debe ser un número entero.")
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
  // producto_id se pasará como argumento a la función, no desde FormData directamente para este esquema.
  numero_lote: z.string().min(1, "El número de lote es requerido."),
  stock_lote: z.coerce.number().int("El stock debe ser un número entero.")
    .positive("El stock de entrada debe ser un número positivo."),
  fecha_entrada: z.string().refine((date) => date === '' || !isNaN(Date.parse(date)), { // Permite string vacío o fecha válida
    message: "Fecha de entrada inválida.",
  }).transform(val => val === '' ? undefined : val), // Transforma "" a undefined para .default()
  fecha_caducidad: z.string().transform(val => val === '' ? undefined : val)
    .refine((date) => date === undefined || !isNaN(Date.parse(date)), {
      message: "Fecha de caducidad inválida.",
    }).optional(),
});


// --- ACCIÓN PARA AGREGAR UN NUEVO PRODUCTO AL CATÁLOGO ---
export async function agregarProductoCatalogo(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

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
    console.error("Error de validación (agregarProductoCatalogo):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors },
    };
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

  const { data, error: dbError } = await supabase
    .from("productos_inventario")
    .insert([dataToInsert])
    .select().single();

  if (dbError) {
    console.error("Error al insertar producto en catálogo:", dbError);
    if (dbError.code === '23505') { 
        let field = 'desconocido';
        if (dbError.message.includes('productos_inventario_nombre_key')) field = 'nombre';
        if (dbError.message.includes('productos_inventario_codigo_producto_key')) field = 'código';
        return { success: false, error: { message: `Ya existe un producto con este ${field}.`} };
    }
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
  }

  revalidatePath("/dashboard/inventario");
  return { success: true, data };
}

// --- ACCIÓN PARA ACTUALIZAR UN PRODUCTO DEL CATÁLOGO ---
export async function actualizarProductoCatalogo(id: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const IdSchema = z.string().uuid("ID de producto inválido.");
  if (!IdSchema.safeParse(id).success) {
      return { success: false, error: { message: "ID de producto proporcionado no es válido." }};
  }

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
    console.error("Error de validación (actualizarProductoCatalogo):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors },
    };
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
  
  if (!hasChanges) {
    return { success: true, message: "No se proporcionaron datos diferentes para actualizar.", data: null };
  }

  const { data, error: dbError } = await supabase
    .from("productos_inventario")
    .update(dataToUpdate)
    .eq("id", id)
    .select().single();

  if (dbError) {
    console.error("Error al actualizar producto del catálogo:", dbError);
    if (dbError.code === '23505') { 
        let field = 'desconocido';
        if (dbError.message.includes('productos_inventario_nombre_key')) field = 'nombre';
        if (dbError.message.includes('productos_inventario_codigo_producto_key')) field = 'código';
        return { success: false, error: { message: `Ya existe un producto con este ${field}.`} };
    }
    return { success: false, error: { message: `Error de base de datos al actualizar: ${dbError.message}` } };
  }

  revalidatePath("/dashboard/inventario");
  revalidatePath(`/dashboard/inventario/${id}/editar`);
  revalidatePath(`/dashboard/inventario/${id}`);
  return { success: true, data };
}

// --- ACCIÓN PARA ELIMINAR UN PRODUCTO DEL CATÁLOGO ---
export async function eliminarProductoCatalogo(id: string) {
  const IdSchema = z.string().uuid("El ID proporcionado no es un UUID válido.");
  if (!IdSchema.safeParse(id).success) {
    return { success: false, error: { message: "ID de producto inválido." } };
  }

  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }
  
  const { error: dbError, count } = await supabase
    .from("productos_inventario")
    .delete({ count: 'exact' })
    .eq("id", id);

  if (dbError) {
    console.error("Error al eliminar producto del catálogo:", dbError);
    return { success: false, error: { message: `Error de base de datos: ${dbError.message}` } };
  }

  if (count === 0) {
    return { 
        success: false, 
        error: { message: "El producto no se encontró o no se pudo eliminar (0 filas afectadas)." }
    };
  }
  
  revalidatePath("/dashboard/inventario");
  return { success: true, message: "Producto eliminado del catálogo correctamente." };
}


// --- ACCIÓN PARA REGISTRAR UNA NUEVA ENTRADA DE LOTE ---
export async function registrarEntradaLote(productoId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const ProductoIdSchema = z.string().uuid();
  if (!ProductoIdSchema.safeParse(productoId).success) {
      return { success: false, error: { message: "ID de producto para el lote no es válido." } };
  }

  const rawFormData = {
    numero_lote: formData.get("numero_lote"),
    stock_lote: formData.get("stock_lote"), // Cantidad que entra
    fecha_entrada: formData.get("fecha_entrada") || new Date().toISOString().split('T')[0], // Default a hoy si no se provee
    fecha_caducidad: formData.get("fecha_caducidad"),
  };

  // Adaptamos el esquema para que fecha_entrada use default si es undefined después de transform
  const EntradaLoteSchemaConDefault = EntradaLoteSchema.extend({
      fecha_entrada: z.string().transform(val => val === '' ? undefined : val)
        .refine((date) => date === undefined || !isNaN(Date.parse(date)), { message: "Fecha de entrada inválida."})
        .default(new Date().toISOString().split('T')[0]),
  });


  const validatedFields = EntradaLoteSchemaConDefault.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (registrarEntradaLote):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación para la entrada de lote.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const { 
    numero_lote, 
    stock_lote: stockEntrada,
    fecha_entrada, // Ya tiene el default si era undefined
    fecha_caducidad 
  } = validatedFields.data;

  let loteParaMovimientoId: string;
  let operacionTipo: 'insert' | 'update' = 'insert';

  const { data: lotePrevio, error: errorLotePrevio } = await supabase
    .from('lotes_producto')
    .select('id, stock_lote')
    .eq('producto_id', productoId)
    .eq('numero_lote', numero_lote)
    .single();

  if (errorLotePrevio && errorLotePrevio.code !== 'PGRST116') { // PGRST116: 0 rows
    console.error("Error buscando lote existente:", errorLotePrevio);
    return { success: false, error: { message: `Error de BD al buscar lote: ${errorLotePrevio.message}` } };
  }

  if (lotePrevio) {
    loteParaMovimientoId = lotePrevio.id;
    operacionTipo = 'update';
    const nuevoStock = lotePrevio.stock_lote + stockEntrada;
    
    const updateLotePayload: any = { // Usamos any temporalmente por la opcionalidad de fecha_caducidad
        stock_lote: nuevoStock,
        fecha_entrada: new Date(fecha_entrada).toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
    };
    if (fecha_caducidad !== undefined) {
        updateLotePayload.fecha_caducidad = fecha_caducidad ? new Date(fecha_caducidad).toISOString().split('T')[0] : null;
    }

    const { error: updateError } = await supabase
      .from('lotes_producto')
      .update(updateLotePayload)
      .eq('id', loteParaMovimientoId);

    if (updateError) {
      console.error("Error al actualizar stock del lote existente:", updateError);
      return { success: false, error: { message: `Error de BD al actualizar lote: ${updateError.message}` } };
    }
  } else {
    const { data: nuevoLote, error: insertLoteError } = await supabase
      .from('lotes_producto')
      .insert({
        producto_id: productoId,
        numero_lote: numero_lote,
        stock_lote: stockEntrada,
        fecha_entrada: new Date(fecha_entrada).toISOString().split('T')[0],
        fecha_caducidad: fecha_caducidad ? new Date(fecha_caducidad).toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(), // También al crear
      })
      .select('id').single();

    if (insertLoteError || !nuevoLote) {
      console.error("Error al crear nuevo lote:", insertLoteError);
      return { success: false, error: { message: `Error de BD al crear lote: ${insertLoteError?.message || 'No se pudo crear el lote.'}` } };
    }
    loteParaMovimientoId = nuevoLote.id;
  }

  const { error: movimientoError } = await supabase
    .from('movimientos_inventario')
    .insert({
      lote_id: loteParaMovimientoId,
      producto_id: productoId,
      tipo_movimiento: 'Entrada Compra',
      cantidad: stockEntrada,
      // fecha_movimiento es DEFAULT now()
      // usuario_id: user.id, // Opcional
    });

  if (movimientoError) {
    console.error("Error al registrar movimiento de inventario:", movimientoError);
    return { 
        success: false,
        error: { message: `Lote ${operacionTipo === 'insert' ? 'creado' : 'actualizado'}, pero falló el registro del movimiento: ${movimientoError.message}` } 
    };
  }

  revalidatePath(`/dashboard/inventario/${productoId}`);
  revalidatePath("/dashboard/inventario");
  
  return { success: true, message: `Entrada de lote "${numero_lote}" registrada correctamente.` };
}