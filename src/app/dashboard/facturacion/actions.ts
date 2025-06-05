// app/dashboard/facturacion/actions.ts
"use server";

import { createServerActionClient, type SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  estadosFacturaPagoOpciones,
  impuestoItemOpciones,
  metodosDePagoOpciones,
  type NuevaFacturaPayload,
  type EstadoFacturaPagoValue,
  type MetodoPagoValue,
  type FacturaHeaderFromDB,
} from "./types";
import { parseISO, isBefore, isSameDay } from "date-fns";

const impuestoItemValues = impuestoItemOpciones.map(opt => opt.value) as [string, ...string[]];
const estadosFacturaValues = estadosFacturaPagoOpciones as readonly [string, ...string[]];
const metodosPagoValues = metodosDePagoOpciones.map(opt => opt.value) as [MetodoPagoValue, ...MetodoPagoValue[]];

const ItemFacturaSchemaInternal = z.object({
  descripcion: z.string().min(1, "La descripción del ítem es requerida."),
  cantidad: z.coerce.number().positive("La cantidad debe ser un número positivo."),
  precio_unitario: z.coerce.number().min(0, "El precio unitario (base) no puede ser negativo."),
  porcentaje_impuesto_item: z.enum(impuestoItemValues, {
        errorMap: () => ({ message: "Porcentaje de impuesto de ítem inválido."})
    }).transform(val => parseFloat(val)),
  procedimiento_id: z.string().uuid("ID de procedimiento inválido").nullable().optional(),
  producto_inventario_id: z.string().uuid("ID de producto inválido").nullable().optional(),
  lote_id: z.string().uuid("ID de lote inválido").nullable().optional(),
});

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

const FacturaConItemsSchema = FacturaHeaderSchemaInternal.extend({
  items: z.array(ItemFacturaSchemaInternal).min(1, "La factura debe tener al menos un ítem."),
});

const PagoFacturaSchemaBase = z.object({
  fecha_pago: z.string().min(1, "La fecha de pago es requerida.")
    .refine((dateStr) => !isNaN(Date.parse(dateStr)), { message: "Fecha de pago inválida."}),
  monto_pagado: z.coerce.number().positive("El monto pagado debe ser un número positivo mayor que cero."),
  metodo_pago: z.enum(metodosPagoValues, {
    errorMap: () => ({ message: "Por favor, selecciona un método de pago válido."})
  }),
  referencia_pago: z.string().optional().transform(val => val === '' ? undefined : val),
  notas: z.string().optional().transform(val => val === '' ? undefined : val),
});

const CreatePagoFacturaSchema = PagoFacturaSchemaBase;
const UpdatePagoFacturaSchema = PagoFacturaSchemaBase.partial();

async function recalcularYActualizarEstadoFactura(
  supabase: SupabaseClient,
  facturaId: string
): Promise<{ nuevoEstado?: EstadoFacturaPagoValue, facturaOriginal?: FacturaHeaderFromDB, error?: string, detallesError?: any }> {
  try {
    const { data: factura, error: errFactura } = await supabase
      .from('facturas')
      .select('id, total, estado, fecha_vencimiento, paciente_id')
      .eq('id', facturaId)
      .single<FacturaHeaderFromDB>();

    if (errFactura || !factura) {
      console.error("RecalcularEstado: Error al obtener la factura:", errFactura);
      return { error: "Factura no encontrada para recalcular estado." };
    }

    if (factura.estado === 'Anulada' || factura.estado === 'Borrador') {
      return { nuevoEstado: factura.estado, facturaOriginal: factura };
    }

    const { data: pagosActuales, error: errPagos } = await supabase
      .from('pagos_factura')
      .select('monto_pagado')
      .eq('factura_id', facturaId);

    if (errPagos) {
      console.error("RecalcularEstado: Error al obtener pagos:", errPagos);
      return { error: "Error al obtener pagos para recalcular estado.", facturaOriginal: factura };
    }

    const sumaTotalPagada = pagosActuales.reduce((sum, pago) => sum + pago.monto_pagado, 0);
    let nuevoEstadoDeterminado: EstadoFacturaPagoValue = 'Pendiente';

    if (sumaTotalPagada >= factura.total - 0.001) {
      nuevoEstadoDeterminado = 'Pagada';
    } else if (sumaTotalPagada > 0) {
      nuevoEstadoDeterminado = 'Pagada Parcialmente';
    } else {
      nuevoEstadoDeterminado = 'Pendiente';
    }

    if (nuevoEstadoDeterminado !== 'Pagada' && factura.fecha_vencimiento) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaVenc = parseISO(factura.fecha_vencimiento);

      if (isBefore(fechaVenc, hoy)) {
        nuevoEstadoDeterminado = 'Vencida';
      }
    }

    if (nuevoEstadoDeterminado !== factura.estado) {
      const { error: updateError } = await supabase
        .from('facturas')
        .update({ estado: nuevoEstadoDeterminado, updated_at: new Date().toISOString() })
        .eq('id', facturaId);
      if (updateError) {
        console.error(`RecalcularEstado: Error al actualizar estado de factura ${facturaId}:`, updateError);
        return { error: `Estado de factura no actualizado: ${updateError.message}`, facturaOriginal: factura, detallesError: updateError };
      }
      return { nuevoEstado: nuevoEstadoDeterminado, facturaOriginal: factura };
    }

    return { nuevoEstado: factura.estado, facturaOriginal: factura };
  } catch (e: any) {
    console.error("RecalcularEstado: Error inesperado:", e);
    return { error: `Error inesperado al recalcular estado: ${e.message}` };
  }
}

export async function crearFacturaConItems(
  payload: NuevaFacturaPayload
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
      procedimiento_id: item.procedimiento_id || null,
      producto_inventario_id: item.producto_inventario_id || null,
      lote_id: item.lote_id || null,
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
    console.error("Error de validación (actualizarFacturaConItems):", validatedFields.error.flatten());
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

  const itemsParaActualizarEnDB = items.map(item => {
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
      procedimiento_id: item.procedimiento_id || null,
      producto_inventario_id: item.producto_inventario_id || null,
      lote_id: item.lote_id || null,
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

  if (itemsParaActualizarEnDB.length > 0) {
    const itemsConFacturaId = itemsParaActualizarEnDB.map(item => ({ ...item, factura_id: facturaId }));
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

  const { error: deleteItemsError } = await supabase
    .from('items_factura')
    .delete()
    .eq('factura_id', facturaId);

  if (deleteItemsError) {
    console.error(`Error al eliminar ítems de la factura borrador ${facturaId}: ${deleteItemsError.message}`);
  }

   const { error: deletePagosError } = await supabase
    .from('pagos_factura')
    .delete()
    .eq('factura_id', facturaId);
  if (deletePagosError) {
    console.error(`Error al eliminar pagos de la factura borrador ${facturaId}: ${deletePagosError.message}`);
  }

  const { error: deleteError } = await supabase.from('facturas').delete().eq('id', facturaId);
  if (deleteError) {
    return { success: false, error: { message: `Error de base de datos al eliminar la factura: ${deleteError.message}` } };
  }

  revalidatePath("/dashboard/facturacion");
  revalidatePath("/dashboard");
  return { success: true, message: `Factura ${factura.numero_factura} eliminada correctamente.` };
}

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

  const estadosAnulables: EstadoFacturaPagoValue[] = ['Pendiente', 'Pagada Parcialmente', 'Vencida', 'Pagada'];
  if (!estadosAnulables.includes(facturaActual.estado as EstadoFacturaPagoValue)) {
    if (facturaActual.estado === 'Borrador') return { success: false, error: { message: `La factura ${facturaActual.numero_factura} es un borrador. Considere eliminarla.` } };
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

export async function registrarPagoFactura(
  facturaId: string,
  formData: FormData
) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const facturaIdSchema = z.string().uuid("ID de factura para el pago es inválido.");
  const facturaIdValidation = facturaIdSchema.safeParse(facturaId);
  if (!facturaIdValidation.success) {
    return { success: false, error: { message: facturaIdValidation.error.issues[0].message }};
  }

  const rawFormData = {
    fecha_pago: formData.get("fecha_pago"),
    monto_pagado: formData.get("monto_pagado"),
    metodo_pago: formData.get("metodo_pago"),
    referencia_pago: formData.get("referencia_pago"),
    notas: formData.get("notas"),
  };

  const validatedFields = CreatePagoFacturaSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Error de validación (registrarPagoFactura):", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: { message: "Error de validación al registrar el pago.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const { data: facturaData, error: facturaError } = await supabase
    .from('facturas')
    .select('id, total, estado, fecha_vencimiento, paciente_id')
    .eq('id', facturaId)
    .single<FacturaHeaderFromDB>();

  if (facturaError || !facturaData) {
    return { success: false, error: { message: "Factura no encontrada para registrar el pago." } };
  }
  if (facturaData.estado === 'Pagada' || facturaData.estado === 'Anulada' || facturaData.estado === 'Borrador') {
    return { success: false, error: { message: `No se pueden registrar pagos para una factura en estado "${facturaData.estado}".` } };
  }

  const { data: pagosAnteriores, error: pagosError } = await supabase
    .from('pagos_factura')
    .select('monto_pagado')
    .eq('factura_id', facturaId);

  if (pagosError) {
    return { success: false, error: { message: "Error al obtener pagos anteriores." } };
  }

  const totalPagadoAnteriormente = pagosAnteriores.reduce((sum, pago) => sum + pago.monto_pagado, 0);
  const saldoPendiente = facturaData.total - totalPagadoAnteriormente;
  const montoNuevoPago = validatedFields.data.monto_pagado;

  if (montoNuevoPago > saldoPendiente + 0.001) {
    return {
      success: false,
      error: {
        message: `El monto del pago (${montoNuevoPago.toFixed(2)}€) excede el saldo pendiente (${saldoPendiente.toFixed(2)}€).`,
        errors: { monto_pagado: [`El monto no puede ser mayor que ${saldoPendiente.toFixed(2)}€.`] }
      },
    };
  }

  const dataPagoAInsertar = {
    factura_id: facturaId,
    fecha_pago: new Date(validatedFields.data.fecha_pago).toISOString(),
    monto_pagado: montoNuevoPago,
    metodo_pago: validatedFields.data.metodo_pago,
    referencia_pago: validatedFields.data.referencia_pago ?? null,
    notas: validatedFields.data.notas ?? null,
    // Si tuvieras la columna 'created_at' en pagos_factura con default now(), no necesitas añadirla aquí
    // Si no, y quieres registrarla: created_at: new Date().toISOString(),
  };

  const { data: nuevoPago, error: dbErrorPago } = await supabase
    .from("pagos_factura")
    .insert([dataPagoAInsertar])
    .select("id")
    .single();

  if (dbErrorPago || !nuevoPago) {
    console.error("Error al insertar el pago:", dbErrorPago);
    return { success: false, error: { message: `Error de base de datos al registrar el pago: ${dbErrorPago?.message || 'No se pudo registrar el pago.'}` } };
  }

  const resultadoRecalculo = await recalcularYActualizarEstadoFactura(supabase, facturaId);

  if (resultadoRecalculo.error) {
      console.warn(`Pago ID ${nuevoPago.id} registrado, PERO ${resultadoRecalculo.error} Detalles: ${JSON.stringify(resultadoRecalculo.detallesError || {})}`);
  }

  revalidatePath(`/dashboard/facturacion/${facturaId}`);
  revalidatePath("/dashboard/facturacion");
  if (facturaData.paciente_id) revalidatePath(`/dashboard/pacientes/${facturaData.paciente_id}`);
  revalidatePath("/dashboard");
  return { success: true, data: nuevoPago, message: `Pago registrado. ${resultadoRecalculo.nuevoEstado ? `Nuevo estado factura: ${resultadoRecalculo.nuevoEstado}.` : ''} ${resultadoRecalculo.error ? `Advertencia: ${resultadoRecalculo.error}` : ''}`.trim() };
}

export async function actualizarPagoFactura(
  pagoId: string,
  facturaId: string,
  formData: FormData
) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const IdSchema = z.string().uuid();
  if (!IdSchema.safeParse(pagoId).success || !IdSchema.safeParse(facturaId).success) {
      return { success: false, error: { message: "ID de pago o factura inválido." }};
  }

  const rawFormData = {
    fecha_pago: formData.get("fecha_pago"),
    monto_pagado: formData.get("monto_pagado"),
    metodo_pago: formData.get("metodo_pago"),
    referencia_pago: formData.get("referencia_pago"),
    notas: formData.get("notas"),
  };

  const validatedFields = UpdatePagoFacturaSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: { message: "Error de validación al actualizar el pago.", errors: validatedFields.error.flatten().fieldErrors },
    };
  }

  const { data: facturaData, error: facturaError } = await supabase
    .from('facturas')
    .select('id, total, estado, paciente_id')
    .eq('id', facturaId)
    .single<FacturaHeaderFromDB>();

  if (facturaError || !facturaData) {
    return { success: false, error: { message: "Factura asociada al pago no encontrada." } };
  }
  if (facturaData.estado === 'Anulada') {
    return { success: false, error: { message: "No se pueden modificar pagos de una factura anulada." } };
  }

  // ** CORRECCIÓN: Inicializar dataToUpdate vacío y no incluir updated_at si la tabla no lo tiene **
  const dataToUpdate: Partial<z.infer<typeof PagoFacturaSchemaBase>> = {};
  // Si tu tabla pagos_factura SÍ tiene 'updated_at', descomenta la siguiente línea:
  // (dataToUpdate as any).updated_at = new Date().toISOString();

  let montoNuevoPago: number | undefined = undefined;
  let hasChanges = false;

  if (validatedFields.data.fecha_pago !== undefined) {
    dataToUpdate.fecha_pago = new Date(validatedFields.data.fecha_pago).toISOString();
    hasChanges = true;
  }
  if (validatedFields.data.monto_pagado !== undefined) {
    montoNuevoPago = validatedFields.data.monto_pagado;
    dataToUpdate.monto_pagado = montoNuevoPago;
    hasChanges = true;
  }
  if (validatedFields.data.metodo_pago !== undefined) {
    dataToUpdate.metodo_pago = validatedFields.data.metodo_pago;
    hasChanges = true;
  }
  if (validatedFields.data.referencia_pago !== undefined) {
    dataToUpdate.referencia_pago = validatedFields.data.referencia_pago ?? null;
    hasChanges = true;
  }
  if (validatedFields.data.notas !== undefined) {
    dataToUpdate.notas = validatedFields.data.notas ?? null;
    hasChanges = true;
  }

  if (!hasChanges) {
     return { success: true, message: "No hubo cambios detectados en el pago.", data: null };
  }

  if (montoNuevoPago !== undefined) {
    const { data: otrosPagos, error: otrosPagosError } = await supabase
      .from('pagos_factura')
      .select('monto_pagado')
      .eq('factura_id', facturaId)
      .neq('id', pagoId);

    if (otrosPagosError) {
      return { success: false, error: { message: "Error al obtener otros pagos para validación." } };
    }
    const totalOtrosPagos = otrosPagos.reduce((sum, p) => sum + p.monto_pagado, 0);
    const saldoPermitido = facturaData.total - totalOtrosPagos;

    if (montoNuevoPago > saldoPermitido + 0.001) {
      return {
        success: false,
        error: {
          message: `El monto del pago (${montoNuevoPago.toFixed(2)}€) excede el saldo permitido (${saldoPermitido.toFixed(2)}€) considerando otros pagos.`,
          errors: { monto_pagado: [`El monto no puede ser mayor que ${saldoPermitido.toFixed(2)}€.`] }
        },
      };
    }
  }

  const { data: pagoActualizado, error: dbErrorUpdatePago } = await supabase
    .from("pagos_factura")
    .update(dataToUpdate)
    .eq("id", pagoId)
    .select("id")
    .single();

  if (dbErrorUpdatePago || !pagoActualizado) {
    return { success: false, error: { message: `Error de BD al actualizar el pago: ${dbErrorUpdatePago?.message || 'No se pudo actualizar.'}` } };
  }

  const resultadoRecalculo = await recalcularYActualizarEstadoFactura(supabase, facturaId);
  if (resultadoRecalculo.error) {
     console.warn(`Pago ID ${pagoId} actualizado, PERO ${resultadoRecalculo.error}`);
  }

  revalidatePath(`/dashboard/facturacion/${facturaId}`);
  revalidatePath("/dashboard/facturacion");
  if (facturaData.paciente_id) revalidatePath(`/dashboard/pacientes/${facturaData.paciente_id}`);
  revalidatePath("/dashboard");
  return { success: true, data: pagoActualizado, message: `Pago actualizado. ${resultadoRecalculo.error ? `Advertencia: ${resultadoRecalculo.error}` : ''}`.trim()};
}

export async function eliminarPagoFactura(
  pagoId: string,
  facturaId: string
) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }

  const IdSchema = z.string().uuid();
  if (!IdSchema.safeParse(pagoId).success || !IdSchema.safeParse(facturaId).success) {
      return { success: false, error: { message: "ID de pago o factura inválido." }};
  }

  const { data: facturaData, error: facturaError } = await supabase
    .from('facturas')
    .select('id, estado, paciente_id')
    .eq('id', facturaId)
    .single<Pick<FacturaHeaderFromDB, 'id' | 'estado' | 'paciente_id'>>();

  if (facturaError || !facturaData) {
    return { success: false, error: { message: "Factura asociada al pago no encontrada." } };
  }
  if (facturaData.estado === 'Anulada') {
    return { success: false, error: { message: "No se pueden eliminar pagos de una factura anulada." } };
  }

  const { error: dbErrorDeletePago } = await supabase
    .from("pagos_factura")
    .delete()
    .eq("id", pagoId);

  if (dbErrorDeletePago) {
    return { success: false, error: { message: `Error de BD al eliminar el pago: ${dbErrorDeletePago.message}` } };
  }

  const resultadoRecalculo = await recalcularYActualizarEstadoFactura(supabase, facturaId);
   if (resultadoRecalculo.error) {
     console.warn(`Pago ID ${pagoId} eliminado, PERO ${resultadoRecalculo.error}`);
  }

  revalidatePath(`/dashboard/facturacion/${facturaId}`);
  revalidatePath("/dashboard/facturacion");
  if (facturaData.paciente_id) revalidatePath(`/dashboard/pacientes/${facturaData.paciente_id}`);
  revalidatePath("/dashboard");
  return { success: true, message: `Pago eliminado. ${resultadoRecalculo.error ? `Advertencia: ${resultadoRecalculo.error}` : ''}`.trim() };
}
