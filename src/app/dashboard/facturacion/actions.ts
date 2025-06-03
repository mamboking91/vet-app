// app/dashboard/facturacion/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { 
  estadosFacturaPagoOpciones,  // Array de strings ["Borrador", "Pendiente", ...]
  impuestoItemOpciones,      // Array de objetos [{value: "0", label: "0% (Exento)"}, ...]
  type NuevaFacturaPayload,   // Tipo para el payload que reciben las acciones
  type EstadoFacturaPagoValue // Tipo para los valores de estado
} from "./types";

// Extraemos los valores de string para Zod.enum a partir de las opciones importadas
const impuestoItemValues = impuestoItemOpciones.map(opt => opt.value) as [string, ...string[]]; // Ej: ["0", "3", "7"]
const estadosFacturaValues = estadosFacturaPagoOpciones as readonly [string, ...string[]]; // Ej: ["Borrador", "Pendiente", ...]

// Esquema Zod para un ítem de factura (usado internamente por FacturaConItemsSchema)
const ItemFacturaSchemaInternal = z.object({
  descripcion: z.string().min(1, "La descripción del ítem es requerida."),
  cantidad: z.coerce.number().positive("La cantidad debe ser un número positivo."),
  precio_unitario: z.coerce.number().min(0, "El precio unitario (base) no puede ser negativo."),
  porcentaje_impuesto_item: z.enum(impuestoItemValues, { 
        errorMap: () => ({ message: "Porcentaje de impuesto de ítem inválido."})
    }).transform(val => parseFloat(val)), // Convierte el string ("0", "3", "7") a número
});

// Esquema Zod para la cabecera de la factura (usado internamente por FacturaConItemsSchema)
const FacturaHeaderSchemaInternal = z.object({
  propietario_id: z.string().uuid("Propietario inválido."),
  paciente_id: z.string().uuid("Paciente inválido.").optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  numero_factura: z.string().min(1, "El número de factura es requerido."),
  fecha_emision: z.string()
    .min(1, "La fecha de emisión es requerida.")
    .refine((dateStr) => !isNaN(Date.parse(dateStr)), { message: "Fecha de emisión inválida."}),
  fecha_vencimiento: z.string().transform(val => val === '' ? undefined : val)
    .refine((dateStr) => dateStr === undefined || !isNaN(Date.parse(dateStr)), { message: "Fecha de vencimiento inválida."})
    .optional(),
  estado: z.enum(estadosFacturaValues).default('Borrador'),
  notas_cliente: z.string().optional().transform(val => val === '' ? undefined : val),
  notas_internas: z.string().optional().transform(val => val === '' ? undefined : val),
});

// Esquema Zod para la factura completa (cabecera + array de ítems)
// Este se usará tanto para crear como para el payload de actualizar.
const FacturaConItemsSchema = FacturaHeaderSchemaInternal.extend({
  items: z.array(ItemFacturaSchemaInternal).min(1, "La factura debe tener al menos un ítem."),
});


// --- ACCIÓN PARA CREAR UNA NUEVA FACTURA CON ÍTEMS ---
export async function crearFacturaConItems(
  payload: NuevaFacturaPayload // La acción ACEPTA el payload con strings en los items, Zod los transforma
) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const validatedFields = FacturaConItemsSchema.safeParse(payload);

  if (!validatedFields.success) {
    console.error("Error de validación (crearFacturaConItems):", validatedFields.error.flatten());
    return {
      success: false,
      error: { message: "Error de validación. Por favor, revisa los campos.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const { items, ...facturaHeaderData } = validatedFields.data;

  const { data: facturaExistente, error: errFacturaExistente } = await supabase
    .from('facturas').select('id').eq('numero_factura', facturaHeaderData.numero_factura).maybeSingle();
  if (errFacturaExistente) {
      console.error("Error verificando numero_factura:", errFacturaExistente);
      return { success: false, error: { message: "Error al verificar el número de factura." } };
  }
  if (facturaExistente) {
      return { success: false, error: { message: `El número de factura "${facturaHeaderData.numero_factura}" ya existe.`, errors: { numero_factura: ["Este número de factura ya está en uso."] } } };
  }

  let sumaBasesImponibles = 0;
  let sumaMontosImpuestos = 0;
  const desgloseImpuestosCalculado: { [key: string]: { base: number, impuesto: number } } = {};

  const itemsParaInsertar = items.map(item => {
    const baseImponibleItem = item.cantidad * item.precio_unitario;
    const montoImpuestoItem = baseImponibleItem * (item.porcentaje_impuesto_item / 100);
    const totalItem = baseImponibleItem + montoImpuestoItem;

    sumaBasesImponibles += baseImponibleItem;
    sumaMontosImpuestos += montoImpuestoItem;

    const tasaKey = `IGIC_${item.porcentaje_impuesto_item}%`;
    if (!desgloseImpuestosCalculado[tasaKey]) {
      desgloseImpuestosCalculado[tasaKey] = { base: 0, impuesto: 0 };
    }
    desgloseImpuestosCalculado[tasaKey].base += baseImponibleItem;
    desgloseImpuestosCalculado[tasaKey].impuesto += montoImpuestoItem;

    return {
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precio_unitario: parseFloat(item.precio_unitario.toFixed(2)),
      base_imponible_item: parseFloat(baseImponibleItem.toFixed(2)),
      porcentaje_impuesto_item: item.porcentaje_impuesto_item,
      monto_impuesto_item: parseFloat(montoImpuestoItem.toFixed(2)),
      total_item: parseFloat(totalItem.toFixed(2)),
    };
  });

  const totalFacturaCalculado = sumaBasesImponibles + sumaMontosImpuestos;

  const { data: nuevaFactura, error: dbErrorFactura } = await supabase
    .from("facturas")
    .insert([{
      numero_factura: facturaHeaderData.numero_factura,
      fecha_emision: new Date(facturaHeaderData.fecha_emision).toISOString(),
      fecha_vencimiento: facturaHeaderData.fecha_vencimiento ? new Date(facturaHeaderData.fecha_vencimiento).toISOString() : null,
      propietario_id: facturaHeaderData.propietario_id,
      paciente_id: facturaHeaderData.paciente_id ?? null,
      estado: facturaHeaderData.estado,
      subtotal: parseFloat(sumaBasesImponibles.toFixed(2)),
      monto_impuesto: parseFloat(sumaMontosImpuestos.toFixed(2)),
      total: parseFloat(totalFacturaCalculado.toFixed(2)),
      notas_cliente: facturaHeaderData.notas_cliente ?? null,
      notas_internas: facturaHeaderData.notas_internas ?? null,
      desglose_impuestos: desgloseImpuestosCalculado,
      updated_at: new Date().toISOString(),
    }])
    .select("id").single();

  if (dbErrorFactura || !nuevaFactura) {
    console.error("Error al insertar la factura:", dbErrorFactura);
    return { success: false, error: { message: `Error de base de datos al crear la factura: ${dbErrorFactura?.message || 'No se pudo crear la factura.'}` } };
  }

  const itemsConFacturaId = itemsParaInsertar.map(item => ({ ...item, factura_id: nuevaFactura.id }));
  const { error: dbErrorItems } = await supabase.from("items_factura").insert(itemsConFacturaId);

  if (dbErrorItems) {
    console.error("Error al insertar ítems de la factura:", dbErrorItems);
    return { success: false, error: { message: `Factura creada (ID: ${nuevaFactura.id}), PERO falló la inserción de ítems: ${dbErrorItems.message}. Se requiere revisión manual.` } };
  }

  revalidatePath("/dashboard/facturacion");
  revalidatePath("/dashboard"); 
  return { success: true, data: nuevaFactura, message: "Factura creada correctamente." };
}


// --- ACCIÓN PARA ACTUALIZAR UNA FACTURA EXISTENTE ---
export async function actualizarFacturaConItems(
  facturaId: string,
  payload: NuevaFacturaPayload 
) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const IdSchema = z.string().uuid("ID de factura inválido.");
  if (!IdSchema.safeParse(facturaId).success) {
      return { success: false, error: { message: "ID de factura proporcionado no es válido." }};
  }

  const validatedFields = FacturaConItemsSchema.safeParse(payload);
  if (!validatedFields.success) {
    console.error("Error de validación (actualizarFacturaConItems):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const { items, ...facturaHeaderData } = validatedFields.data;

  const { data: facturaActual, error: errFacturaActual } = await supabase
    .from('facturas').select('id, estado, numero_factura').eq('id', facturaId).single();
  if (errFacturaActual || !facturaActual) {
    return { success: false, error: { message: "Factura no encontrada o error al verificarla." } };
  }
  if (facturaActual.estado !== 'Borrador') {
    return { success: false, error: { message: `La factura ${facturaActual.numero_factura} no está en estado 'Borrador' y no puede ser modificada.` } };
  }

  if (facturaHeaderData.numero_factura !== facturaActual.numero_factura) {
    const { data: facturaExistente } = await supabase
      .from('facturas').select('id').eq('numero_factura', facturaHeaderData.numero_factura).neq('id', facturaId).maybeSingle();
    if (facturaExistente) {
        return { success: false, error: { message: `El número de factura "${facturaHeaderData.numero_factura}" ya existe.`, errors: { numero_factura: ["Este número ya está en uso."] } } };
    }
  }

  let sumaBasesImponibles = 0;
  let sumaMontosImpuestos = 0;
  const desgloseImpuestosCalculado: { [key: string]: { base: number, impuesto: number } } = {};

  const itemsParaActualizar = items.map(item => {
    const baseImponibleItem = item.cantidad * item.precio_unitario;
    const montoImpuestoItem = baseImponibleItem * (item.porcentaje_impuesto_item / 100);
    const totalItem = baseImponibleItem + montoImpuestoItem;
    sumaBasesImponibles += baseImponibleItem;
    sumaMontosImpuestos += montoImpuestoItem;
    const tasaKey = `IGIC_${item.porcentaje_impuesto_item}%`;
    if (!desgloseImpuestosCalculado[tasaKey]) desgloseImpuestosCalculado[tasaKey] = { base: 0, impuesto: 0 };
    desgloseImpuestosCalculado[tasaKey].base += baseImponibleItem;
    desgloseImpuestosCalculado[tasaKey].impuesto += montoImpuestoItem;
    return {
      descripcion: item.descripcion, cantidad: item.cantidad, precio_unitario: parseFloat(item.precio_unitario.toFixed(2)),
      base_imponible_item: parseFloat(baseImponibleItem.toFixed(2)),
      porcentaje_impuesto_item: item.porcentaje_impuesto_item,
      monto_impuesto_item: parseFloat(montoImpuestoItem.toFixed(2)),
      total_item: parseFloat(totalItem.toFixed(2)),
    };
  });
  const totalFacturaCalculado = sumaBasesImponibles + sumaMontosImpuestos;

  const { data: facturaActualizada, error: dbErrorFactura } = await supabase
    .from("facturas").update({
      numero_factura: facturaHeaderData.numero_factura,
      fecha_emision: new Date(facturaHeaderData.fecha_emision).toISOString(),
      fecha_vencimiento: facturaHeaderData.fecha_vencimiento ? new Date(facturaHeaderData.fecha_vencimiento).toISOString() : null,
      propietario_id: facturaHeaderData.propietario_id,
      paciente_id: facturaHeaderData.paciente_id ?? null,
      estado: facturaHeaderData.estado,
      subtotal: parseFloat(sumaBasesImponibles.toFixed(2)),
      monto_impuesto: parseFloat(sumaMontosImpuestos.toFixed(2)),
      total: parseFloat(totalFacturaCalculado.toFixed(2)),
      notas_cliente: facturaHeaderData.notas_cliente ?? null,
      notas_internas: facturaHeaderData.notas_internas ?? null,
      desglose_impuestos: desgloseImpuestosCalculado,
      updated_at: new Date().toISOString(),
    }).eq("id", facturaId).select("id, paciente_id").single();

  if (dbErrorFactura || !facturaActualizada) {
    return { success: false, error: { message: `Error de BD al actualizar factura: ${dbErrorFactura?.message || 'No se pudo actualizar.'}` } };
  }

  const { error: deleteErrorItems } = await supabase.from("items_factura").delete().eq("factura_id", facturaId);
  if (deleteErrorItems) {
    return { success: false, error: { message: `Cabecera actualizada, PERO falló eliminación de ítems antiguos: ${deleteErrorItems.message}. Revisar.` } };
  }

  if (itemsParaActualizar.length > 0) {
    const itemsConFacturaId = itemsParaActualizar.map(item => ({ ...item, factura_id: facturaId }));
    const { error: dbErrorItemsNuevos } = await supabase.from("items_factura").insert(itemsConFacturaId);
    if (dbErrorItemsNuevos) {
      return { success: false, error: { message: `Factura actualizada e ítems antiguos borrados, PERO falló inserción de nuevos ítems: ${dbErrorItemsNuevos.message}. Revisión URGENTE.` } };
    }
  }

  revalidatePath("/dashboard/facturacion");
  revalidatePath(`/dashboard/facturacion/${facturaId}`);
  revalidatePath(`/dashboard/facturacion/${facturaId}/editar`);
  revalidatePath("/dashboard");
  return { success: true, data: facturaActualizada, message: "Factura actualizada correctamente." };
}


// --- ACCIÓN PARA ELIMINAR UNA FACTURA EN ESTADO 'BORRADOR' ---
export async function eliminarFacturaBorrador(facturaId: string) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

  if (!z.string().uuid().safeParse(facturaId).success) {
      return { success: false, error: { message: "ID de factura proporcionado no es válido." }};
  }

  const { data: factura, error: fetchError } = await supabase
    .from('facturas').select('id, estado, numero_factura').eq('id', facturaId).single();
  if (fetchError || !factura) {
    return { success: false, error: { message: "Factura no encontrada o error al verificarla." } };
  }
  if (factura.estado !== 'Borrador') {
    return { success: false, error: { message: `La factura ${factura.numero_factura} no es un 'Borrador' y no puede ser eliminada. Considere anularla.` } };
  }

  const { error: deleteError } = await supabase.from('facturas').delete().eq('id', facturaId);
  if (deleteError) {
    return { success: false, error: { message: `Error de base de datos al eliminar la factura: ${deleteError.message}` } };
  }

  revalidatePath("/dashboard/facturacion");
  revalidatePath("/dashboard");
  return { success: true, message: `Factura ${factura.numero_factura} eliminada correctamente.` };
}


// --- ACCIÓN PARA ANULAR UNA FACTURA (CAMBIAR ESTADO A 'ANULADA') ---
export async function anularFactura(facturaId: string) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

  if (!z.string().uuid().safeParse(facturaId).success) {
      return { success: false, error: { message: "ID de factura proporcionado no es válido." }};
  }

  const { data: facturaActual, error: fetchError } = await supabase
    .from('facturas').select('id, estado, numero_factura, paciente_id').eq('id', facturaId).single();
  if (fetchError || !facturaActual) {
    return { success: false, error: { message: "Factura no encontrada o error al verificarla." } };
  }

  const estadosAnulables: EstadoFacturaPagoValue[] = ['Pendiente', 'Pagada Parcialmente', 'Vencida']; 
  if (!estadosAnulables.includes(facturaActual.estado as EstadoFacturaPagoValue)) {
    if (facturaActual.estado === 'Borrador') return { success: false, error: { message: `La factura ${facturaActual.numero_factura} es un borrador. Considere eliminarla.` } };
    if (facturaActual.estado === 'Pagada') return { success: false, error: { message: `La factura ${facturaActual.numero_factura} ya está pagada. Considere una nota de crédito.` } };
    if (facturaActual.estado === 'Anulada') return { success: false, error: { message: `La factura ${facturaActual.numero_factura} ya está anulada.` } };
    return { success: false, error: { message: `La factura ${facturaActual.numero_factura} con estado "${facturaActual.estado}" no puede ser anulada directamente.` } };
  }

  const { data: facturaAnulada, error: updateError } = await supabase
    .from('facturas').update({ 
      estado: 'Anulada' as EstadoFacturaPagoValue,
      updated_at: new Date().toISOString() 
    }).eq('id', facturaId).select("id, paciente_id").single();

  if (updateError || !facturaAnulada) {
    return { success: false, error: { message: `Error de base de datos al anular la factura: ${updateError?.message || 'No se pudo anular.'}` } };
  }

  revalidatePath("/dashboard/facturacion");
  revalidatePath(`/dashboard/facturacion/${facturaId}`);
  if (facturaAnulada.paciente_id) revalidatePath(`/dashboard/pacientes/${facturaAnulada.paciente_id}`);
  revalidatePath("/dashboard");
  return { success: true, data: facturaAnulada, message: `Factura ${facturaActual.numero_factura} anulada.` };
}