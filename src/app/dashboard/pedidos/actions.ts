// src/app/dashboard/pedidos/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ESTADOS_PEDIDO, type EstadoPedido, type DireccionEnvio } from "./types";
// --- 1. SE AÑADE LA IMPORTACIÓN PARA ENVIAR CORREOS ---
import { sendOrderConfirmationEmail } from "@/app/emails/actions"; 

// --- ACCIÓN PARA ACTUALIZAR EL ESTADO (MEJORADA) ---
const updateStatusSchema = z.object({
  estado: z.enum(ESTADOS_PEDIDO, {
    errorMap: () => ({ message: "Por favor, selecciona un estado válido." }),
  }),
});

export async function updateOrderStatus(pedidoId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const validatedFields = updateStatusSchema.safeParse({ estado: formData.get('estado') });
  
  if (!validatedFields.success) {
    return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };
  }
  
  const { estado: nuevoEstadoPedido } = validatedFields.data;

  try {
    const { data: pedidoActualizado, error: pedidoError } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstadoPedido })
      .eq('id', pedidoId)
      .select('factura_id')
      .single();

    if (pedidoError) throw new Error(`Error al actualizar el estado del pedido: ${pedidoError.message}`);

    if (nuevoEstadoPedido === 'completado' && pedidoActualizado?.factura_id) {
      const { error: facturaError } = await supabase
        .from('facturas')
        .update({ estado: 'Pagada' })
        .eq('id', pedidoActualizado.factura_id);
      
      if (facturaError) {
        console.warn(`Pedido ${pedidoId} completado, pero error al actualizar factura ${pedidoActualizado.factura_id}: ${facturaError.message}`);
      }
    }

    revalidatePath(`/dashboard/pedidos/${pedidoId}`);
    revalidatePath('/dashboard/pedidos');
    revalidatePath('/dashboard/facturacion');
    if (pedidoActualizado?.factura_id) {
      revalidatePath(`/dashboard/facturacion/${pedidoActualizado.factura_id}`);
    }

    return { success: true, message: "Estado del pedido y factura asociados actualizados." };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

// --- El resto de las acciones se mantienen como en la respuesta anterior ---
// --- (Incluyendo cancelarPedido, actualizarPedido y createManualOrder) ---

export async function cancelarPedido(pedidoId: string) {
  try {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    if (!z.string().uuid().safeParse(pedidoId).success) {
      return { success: false, error: { message: "ID de pedido inválido." } };
    }

    const { error } = await supabase.rpc('cancelar_pedido_y_factura', {
      pedido_id_param: pedidoId
    });

    if (error) {
      throw new Error(`Error al cancelar el pedido: ${error.message}`);
    }

    revalidatePath("/dashboard/pedidos");
    revalidatePath(`/dashboard/pedidos/${pedidoId}`);
    revalidatePath('/dashboard/inventario');
    return { success: true, message: "Pedido y factura asociada han sido cancelados. El stock ha sido repuesto." };

  } catch (e: any) {
    return { success: false, error: { message: e.message } };
  }
}

const ItemPedidoUpdateSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.coerce.number().int().min(1),
  precio_unitario: z.coerce.number().min(0),
  porcentaje_impuesto: z.coerce.number().min(0),
  descripcion: z.string()
});

const DireccionEnvioSchema = z.object({
  nombre_completo: z.string().min(1, "El nombre es requerido."),
  direccion: z.string().min(1, "La dirección es requerida."),
  localidad: z.string().min(1, "La localidad es requerida."),
  provincia: z.string().min(1, "La provincia es requerida."),
  codigo_postal: z.string().min(5, "El código postal es inválido."),
  telefono: z.string().optional(),
});

const UpdatePedidoPayloadSchema = z.object({
  direccion_envio: DireccionEnvioSchema,
  items: z.array(ItemPedidoUpdateSchema).min(1, "El pedido debe tener al menos un artículo."),
});

export async function actualizarPedido(pedidoId: string, payload: unknown) {
  const validation = UpdatePedidoPayloadSchema.safeParse(payload);
  if (!validation.success) {
    return {
      success: false,
      error: { message: "Datos de pedido inválidos.", errors: validation.error.flatten().fieldErrors },
    };
  }

  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  
  const { error: rpcError } = await supabase.rpc('actualizar_pedido_y_ajustar_stock', {
    p_pedido_id: pedidoId,
    p_nuevos_items: validation.data.items,
    p_direccion_envio: validation.data.direccion_envio,
  });

  if (rpcError) {
    console.error("Error en RPC actualizar_pedido_y_ajustar_stock:", rpcError);
    return { success: false, error: { message: `Error al actualizar el pedido: ${rpcError.message}` } };
  }

  revalidatePath("/dashboard/pedidos");
  revalidatePath(`/dashboard/pedidos/${pedidoId}`);
  revalidatePath(`/dashboard/pedidos/${pedidoId}/editar`);
  revalidatePath('/dashboard/inventario');
  revalidatePath('/dashboard/facturacion');

  return { success: true, message: "Pedido y factura actualizados con éxito." };
}

const itemSchema = z.object({
  id_temporal: z.string(),
  producto_id: z.string().uuid(),
  nombre: z.string(),
  cantidad: z.number().min(1),
  precio_unitario: z.number(),
  porcentaje_impuesto: z.number(),
  subtotal: z.number(),
});

const manualClientSchema = z.object({
    nombre_completo: z.string().min(1, "El nombre es requerido."),
    email: z.string().email("El correo electrónico no es válido."),
    direccion: z.string().min(1, "La dirección es requerida."),
    localidad: z.string().min(1, "La localidad es requerida."),
    provincia: z.string().min(1, "La provincia es requerida."),
    codigo_postal: z.string().min(5, "El código postal es inválido."),
    telefono: z.string().optional(),
});

const createManualOrderSchema = z.object({
  clienteId: z.string().uuid("El ID del cliente no es válido.").optional().or(z.literal('')),
  clienteManual: manualClientSchema.optional(),
  items: z.array(itemSchema).min(1, "El pedido debe tener al menos un artículo."),
  total: z.number().positive("El total del pedido debe ser positivo."),
}).refine(data => data.clienteId || data.clienteManual, {
  message: "Se debe proporcionar un cliente existente o datos de cliente manual.",
});

type ManualOrderPayload = z.infer<typeof createManualOrderSchema>;

export async function createManualOrder(payload: ManualOrderPayload) {
  const validation = createManualOrderSchema.safeParse(payload);
  if (!validation.success) {
    return {
      success: false,
      error: { message: "Datos de pedido inválidos.", errors: validation.error.flatten().fieldErrors },
    };
  }

  const { clienteId, clienteManual, items, total } = validation.data;
  
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  // --- 2. SE OBTIENEN LOS DATOS COMPLETOS DEL CLIENTE ---
  let direccionEnvio, emailCliente, nombreCompleto;
  if(clienteManual) {
    direccionEnvio = clienteManual;
    emailCliente = clienteManual.email;
    nombreCompleto = clienteManual.nombre_completo;
  } else if (clienteId) {
    const { data: clienteData, error: clienteError } = await supabase.from('propietarios').select('*').eq('id', clienteId).single();
    if(clienteError || !clienteData) throw new Error("No se pudo obtener la información del cliente seleccionado.");
    direccionEnvio = clienteData;
    emailCliente = clienteData.email;
    nombreCompleto = clienteData.nombre_completo;
  } else {
    throw new Error("No se proporcionaron datos de cliente.");
  }


  const rpcParams = {
      cliente_id_param: clienteId || null,
      cliente_manual_param: clienteManual || null,
      items_param: items,
      total_param: total,
  };

  try {
    const { data: orderId, error } = await supabase.rpc('crear_pedido_manual_completo', rpcParams);

    if (error) {
        throw new Error(error.message);
    }
    
    // --- 3. SE LLAMA A LA FUNCIÓN DE ENVÍO DE CORREO ---
    if(emailCliente && nombreCompleto && direccionEnvio){
      await sendOrderConfirmationEmail({
          pedidoId: orderId,
          fechaPedido: new Date(),
          direccionEnvio: {
              nombre_completo: nombreCompleto,
              direccion: direccionEnvio.direccion || '',
              localidad: direccionEnvio.localidad || '',
              provincia: direccionEnvio.provincia || '',
              codigo_postal: direccionEnvio.codigo_postal || '',
          },
          items: items.map(item => ({
              nombre: item.nombre,
              cantidad: item.cantidad,
              precio_final_unitario: item.subtotal / item.cantidad,
          })),
          total: total,
          emailTo: emailCliente,
      });
    }

    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard/facturacion");
    revalidatePath("/dashboard/inventario");

    return { success: true, orderId, message: "Pedido manual creado y facturado con éxito." };
  } catch(e: any) {
    console.error("Error al ejecutar RPC crear_pedido_manual_completo:", e);
    return { success: false, error: { message: e.message } };
  }
}