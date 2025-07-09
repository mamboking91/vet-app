// src/app/dashboard/pedidos/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ESTADOS_PEDIDO, type EstadoPedido, type DireccionEnvio } from "./types";
import { sendOrderConfirmationEmail } from "@/app/emails/actions";

export async function getOrderById(orderId: string) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  
  const { data: order, error } = await supabase
    .from('pedidos')
    .select(
      `
      id,
      created_at,
      estado,
      total,
      direccion_envio,
      email_cliente,
      factura_id,
      propietarios ( id, nombre_completo, email, telefono ),
      items_pedido (
        id,
        cantidad,
        precio_unitario,
        variante:producto_variantes (id, nombre, precio_venta, sku)
      )
    `
    )
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error al cargar el pedido:', error);
    throw new Error(`Pedido no encontrado o error al cargar: ${error.message}`);
  }

  return order;
}

export async function getRecentOrders() {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, created_at, total, estado, propietarios(nombre_completo)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error al cargar pedidos recientes:', error);
    return [];
  }
  return data;
}

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

// --- INICIO DE LA CORRECCIÓN: Esquema de Payload ---
const createManualOrderSchema = z.object({
  clienteId: z.string().uuid("El ID del cliente no es válido.").optional().or(z.literal('')),
  // clienteManual ahora siempre vendrá con los datos del formulario
  clienteManual: manualClientSchema,
  items: z.array(itemSchema).min(1, "El pedido debe tener al menos un artículo."),
  total: z.number().positive("El total del pedido debe ser positivo."),
});
// --- FIN DE LA CORRECCIÓN: Esquema de Payload ---

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

  // --- INICIO DE LA CORRECCIÓN: Lógica de cliente y email ---
  let finalCustomerId: string | null = clienteId || null;
  let isNewUser = false;

  // Si hay un ID de cliente, actualizamos sus datos con los del formulario.
  // Si no, verificamos si existe por email para asignarlo, o lo creamos.
  if (clienteId) {
    const { error: updateError } = await supabase.from('propietarios').update(clienteManual).eq('id', clienteId);
    if(updateError) console.warn("No se pudo actualizar la información del cliente existente:", updateError.message);
  } else {
    const { data: existingByEmail } = await supabase.from('propietarios').select('id').eq('email', clienteManual.email).single();
    if (existingByEmail) {
        finalCustomerId = existingByEmail.id;
    } else {
        const { data: newCustomer, error: createError } = await supabase.from('propietarios').insert(clienteManual).select('id').single();
        if (createError) throw new Error(`No se pudo crear el nuevo cliente: ${createError.message}`);
        finalCustomerId = newCustomer.id;
        isNewUser = true;
    }
  }

  const rpcParams = {
      cliente_id_param: finalCustomerId,
      cliente_manual_param: clienteManual, 
      items_param: items,
      total_param: total,
  };

  try {
    const { data: orderId, error } = await supabase.rpc('crear_pedido_manual_completo', rpcParams);
    if (error) {
        throw new Error(error.message);
    }
    
    // Obtenemos el logo de la clínica para el email
    const { data: clinicData } = await supabase.from('datos_clinica').select('logo_url').single();

    if(clienteManual.email && clienteManual.nombre_completo){
      await sendOrderConfirmationEmail({
          pedidoId: orderId,
          fechaPedido: new Date(),
          direccionEnvio: {
              nombre_completo: clienteManual.nombre_completo,
              direccion: clienteManual.direccion,
              localidad: clienteManual.localidad,
              provincia: clienteManual.provincia,
              codigo_postal: clienteManual.codigo_postal,
          },
          items: items.map(item => ({
              nombre: item.nombre,
              cantidad: item.cantidad,
              precio_final_unitario: item.subtotal / item.cantidad,
          })),
          total: total,
          emailTo: clienteManual.email,
          customerName: clienteManual.nombre_completo.split(' ')[0] || clienteManual.nombre_completo,
          logoUrl: clinicData?.logo_url,
          isNewUser: isNewUser, // Indicamos si es un nuevo usuario para el texto del email
      });
    }
    // --- FIN DE LA CORRECCIÓN: Lógica de cliente y email ---

    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard/facturacion");
    revalidatePath("/dashboard/inventario");

    return { success: true, orderId, message: "Pedido manual creado y facturado con éxito." };
  } catch(e: any) {
    console.error("Error al ejecutar RPC crear_pedido_manual_completo:", e);
    return { success: false, error: { message: e.message } };
  }
}