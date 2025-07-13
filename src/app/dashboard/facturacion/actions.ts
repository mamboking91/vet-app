// src/app/dashboard/facturacion/actions.ts
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
import { parseISO, isBefore } from "date-fns";

const impuestoItemValues = impuestoItemOpciones.map(opt => opt.value) as [string, ...string[]];
const estadosFacturaValues = estadosFacturaPagoOpciones as readonly [string, ...string[]];
const metodosPagoValues = metodosDePagoOpciones.map(opt => opt.value) as [MetodoPagoValue, ...MetodoPagoValue[]];

const ItemFacturaSchemaInternal = z.object({
  descripcion: z.string().min(1, "La descripción del ítem es requerida."),
  cantidad: z.coerce.number().positive("La cantidad debe ser un número positivo."),
  precio_unitario: z.coerce.number().min(0, "El precio unitario no puede ser negativo."),
  porcentaje_impuesto_item: z.enum(impuestoItemValues).transform(val => parseFloat(val)),
  procedimiento_id: z.string().uuid("ID de procedimiento inválido").nullable().optional(),
  producto_inventario_id: z.string().uuid("ID de producto inválido").nullable().optional(),
  lote_id: z.string().uuid("ID de lote inválido").nullable().optional(),
});

const FacturaHeaderSchemaInternal = z.object({
  propietario_id: z.string().uuid("Propietario inválido."),
  paciente_id: z.string().uuid("Paciente inválido.").optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  numero_factura: z.string().min(1, "El número de factura es requerido.").optional(),
  fecha_emision: z.string().min(1, "La fecha de emisión es requerida.").refine((d) => !isNaN(Date.parse(d)), { message: "Fecha de emisión inválida." }),
  fecha_vencimiento: z.string().transform(v => v === '' ? undefined : v).refine((d) => d === undefined || !isNaN(Date.parse(d)), { message: "Fecha de vencimiento inválida." }).optional(),
  estado: z.enum(estadosFacturaValues).default('Borrador'),
  notas_cliente: z.string().optional().transform(v => v === '' ? undefined : v),
  notas_internas: z.string().optional().transform(v => v === '' ? undefined : v),
});

const FacturaConItemsSchema = FacturaHeaderSchemaInternal.extend({
  items: z.array(ItemFacturaSchemaInternal).min(1, "La factura debe tener al menos un ítem."),
});

const PagoFacturaSchemaBase = z.object({
    fecha_pago: z.string().min(1, "La fecha de pago es requerida.").refine(d => !isNaN(Date.parse(d)), { message: "Fecha de pago inválida."}),
    monto_pagado: z.coerce.number().positive("El monto pagado debe ser mayor que cero."),
    metodo_pago: z.enum(metodosPagoValues),
    referencia_pago: z.string().optional().transform(val => val === '' ? undefined : val),
    notas: z.string().optional().transform(val => val === '' ? undefined : val),
});

const CreatePagoFacturaSchema = PagoFacturaSchemaBase;
const UpdatePagoFacturaSchema = PagoFacturaSchemaBase.partial();

async function getNextInvoiceNumber(supabase: SupabaseClient, prefix: 'FACT' | 'MAN' | 'CLI') {
    const currentYear = new Date().getFullYear();
    const likePrefix = `${prefix}-${currentYear}-%`;

    const { data, error } = await supabase
      .from('facturas')
      .select('numero_factura')
      .like('numero_factura', likePrefix)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching last invoice number:', error);
      throw error;
    }

    if (!data) {
      return `${prefix}-${currentYear}-0001`;
    }

    const lastNumberStr = data.numero_factura.split('-')[2];
    const lastNumber = parseInt(lastNumberStr, 10);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `${prefix}-${currentYear}-${nextNumber}`;
}


async function recalcularYActualizarEstadoFactura(supabase: SupabaseClient, facturaId: string) {
  try {
    const { data: factura } = await supabase.from('facturas').select('id, total, estado, fecha_vencimiento').eq('id', facturaId).single<FacturaHeaderFromDB>();
    if (!factura) return { error: "Factura no encontrada." };

    if (factura.estado === 'Anulada' || factura.estado === 'Borrador') return { nuevoEstado: factura.estado };

    const { data: pagos } = await supabase.from('pagos_factura').select('monto_pagado').eq('factura_id', facturaId);
    if (!pagos) return { error: "Error al obtener pagos." };

    const sumaTotalPagada = pagos.reduce((sum, pago) => sum + pago.monto_pagado, 0);
    let nuevoEstado: EstadoFacturaPagoValue = 'Pendiente';

    if (sumaTotalPagada >= factura.total - 0.001) nuevoEstado = 'Pagada';
    else if (sumaTotalPagada > 0) nuevoEstado = 'Pagada Parcialmente';
    else nuevoEstado = 'Pendiente';

    if (nuevoEstado !== 'Pagada' && factura.fecha_vencimiento) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (isBefore(parseISO(factura.fecha_vencimiento), hoy)) {
            nuevoEstado = 'Vencida';
        }
    }

    if (nuevoEstado !== factura.estado) {
      await supabase.from('facturas').update({ estado: nuevoEstado, updated_at: new Date().toISOString() }).eq('id', facturaId);
    }
    return { nuevoEstado };
  } catch (e: any) {
    return { error: `Error inesperado al recalcular estado: ${e.message}` };
  }
}

// --- INICIO DE LA CORRECCIÓN ---
// Se añade el parámetro opcional `historialId`
export async function crearFacturaConItems(payload: NuevaFacturaPayload, origen: 'manual' | 'historial' | 'pedido' = 'manual', historialId?: string | null) {
// --- FIN DE LA CORRECCIÓN ---
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

    const FacturaPayloadSchema = FacturaConItemsSchema.omit({ numero_factura: true });
    const validatedFields = FacturaPayloadSchema.safeParse(payload);

    if (!validatedFields.success) {
      return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };
    }

    const { items, ...facturaHeaderData } = validatedFields.data;

    let numeroFactura;
    if (origen === 'historial') {
        numeroFactura = await getNextInvoiceNumber(supabase, 'CLI');
    } else if (origen === 'pedido') {
        numeroFactura = await getNextInvoiceNumber(supabase, 'FACT');
    } else {
        numeroFactura = await getNextInvoiceNumber(supabase, 'MAN');
    }

    let sumaBasesImponibles = 0;
    let sumaMontosImpuestos = 0;
    const desgloseImpuestosCalculado: { [key: string]: { base: number, impuesto: number } } = {};

    const itemsParaInsertar = items.map(item => {
      const baseImponibleItem = item.cantidad * item.precio_unitario;
      const montoImpuestoItem = baseImponibleItem * (item.porcentaje_impuesto_item / 100);
      sumaBasesImponibles += baseImponibleItem;
      sumaMontosImpuestos += montoImpuestoItem;
      const tasaKey = `IGIC_${item.porcentaje_impuesto_item}%`;
      if (!desgloseImpuestosCalculado[tasaKey]) desgloseImpuestosCalculado[tasaKey] = { base: 0, impuesto: 0 };
      desgloseImpuestosCalculado[tasaKey].base += baseImponibleItem;
      desgloseImpuestosCalculado[tasaKey].impuesto += montoImpuestoItem;
      return { ...item, factura_id: '', base_imponible_item: baseImponibleItem, monto_impuesto_item: montoImpuestoItem, total_item: baseImponibleItem + montoImpuestoItem };
    });

    const { data: nuevaFactura, error: dbErrorFactura } = await supabase
      .from("facturas").insert([{ 
          ...facturaHeaderData, 
          numero_factura: numeroFactura,
          subtotal: sumaBasesImponibles, 
          monto_impuesto: sumaMontosImpuestos, 
          total: sumaBasesImponibles + sumaMontosImpuestos, 
          desglose_impuestos: desgloseImpuestosCalculado 
      }]).select("id").single();

    if (dbErrorFactura || !nuevaFactura) {
      return { success: false, error: { message: `Error al crear la factura: ${dbErrorFactura?.message}` } };
    }

    const itemsConFacturaId = itemsParaInsertar.map(item => ({ ...item, factura_id: nuevaFactura.id }));
    const { error: dbErrorItems } = await supabase.from("items_factura").insert(itemsConFacturaId);

    if (dbErrorItems) {
      await supabase.from("facturas").delete().eq("id", nuevaFactura.id);
      return { success: false, error: { message: `Error al guardar los ítems de la factura: ${dbErrorItems.message}` } };
    }

    // --- INICIO DE LA CORRECCIÓN ---
    // Si se proporcionó un ID de historial, vinculamos la factura recién creada a él.
    if (historialId) {
        const { error: historialUpdateError } = await supabase
            .from('historiales_medicos')
            .update({ factura_id: nuevaFactura.id })
            .eq('id', historialId);
        
        if (historialUpdateError) {
            console.warn(`Factura ${nuevaFactura.id} creada, pero no se pudo vincular al historial ${historialId}:`, historialUpdateError.message);
        }
    }
    // --- FIN DE LA CORRECCIÓN ---

    revalidatePath("/dashboard/facturacion");
    return { success: true, data: nuevaFactura, message: "Factura creada correctamente." };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

// ... (El resto de las funciones: actualizar, eliminar, etc., permanecen igual)
export async function actualizarFacturaConItems(facturaId: string, payload: NuevaFacturaPayload) {
    try {
      const cookieStore = cookies();
      const supabase = createServerActionClient({ cookies: () => cookieStore });
  
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: { message: "Usuario no autenticado." } };
  
      if (!z.string().uuid().safeParse(facturaId).success) {
          return { success: false, error: { message: "ID de factura inválido." }};
      }
      
      const validatedFields = FacturaConItemsSchema.safeParse(payload);
      if (!validatedFields.success) {
        return { success: false, error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors } };
      }
  
      const { items, ...facturaHeaderData } = validatedFields.data;
  
      const { data: facturaActual } = await supabase.from('facturas').select('estado, numero_factura').eq('id', facturaId).single();
      if (facturaActual?.estado !== 'Borrador') {
          return { success: false, error: { message: "Solo se pueden editar facturas en estado 'Borrador'." } };
      }
  
      if (facturaHeaderData.numero_factura && facturaHeaderData.numero_factura !== facturaActual.numero_factura) {
          const { data: facturaExistente } = await supabase.from('facturas').select('id').eq('numero_factura', facturaHeaderData.numero_factura).neq('id', facturaId).maybeSingle();
          if (facturaExistente) {
              return { success: false, error: { message: `El número de factura "${facturaHeaderData.numero_factura}" ya existe.`, errors: { numero_factura: ["Este número ya está en uso."] } } };
          }
      }
  
      await supabase.from("items_factura").delete().eq("factura_id", facturaId);
  
      let sumaBasesImponibles = 0;
      let sumaMontosImpuestos = 0;
      const desgloseImpuestosCalculado: { [key: string]: { base: number, impuesto: number } } = {};
      const itemsParaInsertar = items.map(item => {
        const base = item.cantidad * item.precio_unitario;
        const impuesto = base * (item.porcentaje_impuesto_item / 100);
        sumaBasesImponibles += base;
        sumaMontosImpuestos += impuesto;
        const tasaKey = `IGIC_${item.porcentaje_impuesto_item}%`;
        if (!desgloseImpuestosCalculado[tasaKey]) desgloseImpuestosCalculado[tasaKey] = { base: 0, impuesto: 0 };
        desgloseImpuestosCalculado[tasaKey].base += base;
        desgloseImpuestosCalculado[tasaKey].impuesto += impuesto;
        return { ...item, factura_id: facturaId, base_imponible_item: base, monto_impuesto_item: impuesto, total_item: base + impuesto };
      });
  
      const { data: updatedFactura, error: updateError } = await supabase.from("facturas").update({ ...facturaHeaderData, subtotal: sumaBasesImponibles, monto_impuesto: sumaMontosImpuestos, total: sumaBasesImponibles + sumaMontosImpuestos, desglose_impuestos: desgloseImpuestosCalculado, updated_at: new Date().toISOString() }).eq("id", facturaId).select("id").single();
      if (updateError) return { success: false, error: { message: `Error al actualizar la cabecera: ${updateError.message}` } };
        
      if (itemsParaInsertar.length > 0) {
          const { error: itemsError } = await supabase.from("items_factura").insert(itemsParaInsertar);
          if (itemsError) return { success: false, error: { message: `Error al guardar los nuevos ítems: ${itemsError.message}` } };
      }
  
      revalidatePath("/dashboard/facturacion");
      revalidatePath(`/dashboard/facturacion/${facturaId}`);
      return { success: true, data: updatedFactura, message: "Factura actualizada correctamente." };
    } catch (e: any) {
      return { success: false, error: { message: `Error inesperado al actualizar la factura: ${e.message}` }};
    }
  }
  
  export async function eliminarFacturaBorrador(facturaId: string) {
    try {
      const cookieStore = cookies();
      const supabase = createServerActionClient({ cookies: () => cookieStore });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: { message: "Usuario no autenticado." } };
      if (!z.string().uuid().safeParse(facturaId).success) return { success: false, error: { message: "ID inválido." }};
      
      const { data: factura } = await supabase.from('facturas').select('estado, numero_factura').eq('id', facturaId).single();
      if (factura?.estado !== 'Borrador') return { success: false, error: { message: `Solo se pueden eliminar facturas en estado 'Borrador'.` } };
  
      await supabase.from('items_factura').delete().eq('factura_id', facturaId);
      await supabase.from('pagos_factura').delete().eq('factura_id', facturaId);
      const { error: deleteError } = await supabase.from('facturas').delete().eq('id', facturaId);
  
      if (deleteError) return { success: false, error: { message: `Error de BD al eliminar: ${deleteError.message}` } };
      
      revalidatePath("/dashboard/facturacion");
      return { success: true, message: `Factura borrador ${factura.numero_factura} eliminada.` };
    } catch (e: any) {
      return { success: false, error: { message: `Error inesperado: ${e.message}` }};
    }
  }
  
  export async function anularFactura(facturaId: string) {
      try {
          const cookieStore = cookies();
          const supabase = createServerActionClient({ cookies: () => cookieStore });
          if (!z.string().uuid().safeParse(facturaId).success) return { success: false, error: { message: "ID de factura inválido." } };
  
          const { data: factura } = await supabase.from('facturas').select('estado, numero_factura').eq('id', facturaId).single();
          if (!factura) return { success: false, error: { message: "Factura no encontrada." } };
          if (factura.estado === 'Anulada') return { success: true, message: "La factura ya estaba anulada." };
          if (factura.estado === 'Borrador') return { success: false, error: { message: "No se puede anular un borrador, debe eliminarlo." } };
  
          const { error } = await supabase.from('facturas').update({ estado: 'Anulada', updated_at: new Date().toISOString() }).eq('id', facturaId);
          if (error) return { success: false, error: { message: `Error al anular la factura: ${error.message}` } };
  
          revalidatePath("/dashboard/facturacion");
          revalidatePath(`/dashboard/facturacion/${facturaId}`);
          return { success: true, message: `Factura ${factura.numero_factura} anulada.` };
      } catch(e: any) {
          return { success: false, error: { message: `Error inesperado: ${e.message}` } };
      }
  }
  
  export async function registrarPagoFactura(facturaId: string, formData: FormData) {
      try {
          const cookieStore = cookies();
          const supabase = createServerActionClient({ cookies: () => cookieStore });
          if (!z.string().uuid().safeParse(facturaId).success) return { success: false, error: { message: "ID de factura inválido." } };
  
          const validatedFields = CreatePagoFacturaSchema.safeParse(Object.fromEntries(formData.entries()));
          if (!validatedFields.success) return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };
  
          const { data: factura } = await supabase.from('facturas').select('total, estado').eq('id', facturaId).single();
          if (!factura) return { success: false, error: { message: "Factura no encontrada." } };
          if (factura.estado === 'Pagada' || factura.estado === 'Anulada' || factura.estado === 'Borrador') return { success: false, error: { message: `No se pueden añadir pagos a una factura ${factura.estado.toLowerCase()}.` } };
  
          const { error } = await supabase.from('pagos_factura').insert([{ factura_id: facturaId, ...validatedFields.data }]);
          if (error) return { success: false, error: { message: `Error al registrar el pago: ${error.message}` } };
  
          await recalcularYActualizarEstadoFactura(supabase, facturaId);
  
          revalidatePath("/dashboard/facturacion");
          revalidatePath(`/dashboard/facturacion/${facturaId}`);
          return { success: true, message: "Pago registrado con éxito." };
      } catch(e: any) {
          return { success: false, error: { message: `Error inesperado: ${e.message}` } };
      }
  }
  
  export async function actualizarPagoFactura(pagoId: string, facturaId: string, formData: FormData) {
      try {
          const cookieStore = cookies();
          const supabase = createServerActionClient({ cookies: () => cookieStore });
          if (!z.string().uuid().safeParse(pagoId).success) return { success: false, error: { message: "ID de pago inválido." } };
  
          const validatedFields = UpdatePagoFacturaSchema.safeParse(Object.fromEntries(formData.entries()));
          if (!validatedFields.success) return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };
  
          const { error } = await supabase.from('pagos_factura').update(validatedFields.data).eq('id', pagoId);
          if (error) return { success: false, error: { message: `Error al actualizar el pago: ${error.message}` } };
  
          await recalcularYActualizarEstadoFactura(supabase, facturaId);
  
          revalidatePath(`/dashboard/facturacion/${facturaId}`);
          return { success: true, message: "Pago actualizado." };
      } catch(e: any) {
          return { success: false, error: { message: `Error inesperado: ${e.message}` } };
      }
  }
  
  export async function eliminarPagoFactura(pagoId: string, facturaId: string) {
      try {
          const cookieStore = cookies();
          const supabase = createServerActionClient({ cookies: () => cookieStore });
          if (!z.string().uuid().safeParse(pagoId).success) return { success: false, error: { message: "ID de pago inválido." } };
  
          const { error } = await supabase.from('pagos_factura').delete().eq('id', pagoId);
          if (error) return { success: false, error: { message: `Error al eliminar el pago: ${error.message}` } };
  
          await recalcularYActualizarEstadoFactura(supabase, facturaId);
          
          revalidatePath(`/dashboard/facturacion/${facturaId}`);
          return { success: true, message: "Pago eliminado." };
      } catch (e: any) {
          return { success: false, error: { message: `Error inesperado: ${e.message}` } };
      }
  }