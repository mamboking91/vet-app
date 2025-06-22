"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ItemFactura } from '@/app/dashboard/facturacion/types';
import type { Propietario } from '@/app/dashboard/propietarios/types';
import { ESTADOS_PEDIDO, type EstadoPedido } from "./types";

// Esquema para validar el cambio de estado
const updateStatusSchema = z.object({
  estado: z.enum(ESTADOS_PEDIDO, {
    errorMap: () => ({ message: "Por favor, selecciona un estado válido." }),
  }),
});

// --- FUNCIÓN AÑADIDA ---
export async function updateOrderStatus(pedidoId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const validatedFields = updateStatusSchema.safeParse({
    estado: formData.get('estado'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: {
        message: "Error de validación.",
        errors: validatedFields.error.flatten().fieldErrors,
      },
    };
  }

  const { estado } = validatedFields.data;

  try {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: estado, updated_at: new Date().toISOString() })
      .eq('id', pedidoId);

    if (error) {
      throw new Error(`Error al actualizar el estado del pedido: ${error.message}`);
    }

    revalidatePath(`/dashboard/pedidos/${pedidoId}`);
    revalidatePath('/dashboard/pedidos');

    return { success: true, message: "Estado del pedido actualizado." };

  } catch (e: any) {
    return {
      success: false,
      error: { message: `Error inesperado: ${e.message}` },
    };
  }
}

// Esquema para validar los items que vienen del formulario
const itemSchema = z.object({
  id_temporal: z.string(),
  producto_id: z.string().uuid(),
  nombre: z.string(),
  cantidad: z.number().min(1),
  precio_unitario: z.number(), // Este es el precio base sin impuestos
  porcentaje_impuesto: z.number(),
  subtotal: z.number(), // Este es el precio final (con impuesto) para la línea
});

// Esquema para validar los datos del pedido manual
const createManualOrderSchema = z.object({
  clienteId: z.string().uuid("El ID del cliente no es válido."),
  items: z.array(itemSchema).min(1, "El pedido debe tener al menos un artículo."),
  total: z.number().positive("El total del pedido debe ser positivo."),
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

  const { clienteId, items, total } = validation.data;

  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: { message: "Usuario no autenticado." } };
  }
  
  const { data: cliente, error: clienteError } = await supabase
    .from('propietarios')
    .select('*')
    .eq('id', clienteId)
    .single<Propietario>();
  
  if (clienteError || !cliente) {
      return { success: false, error: { message: `Cliente con ID ${clienteId} no encontrado.` } };
  }

  try {
    // 1. Crear el pedido
    const direccionEnvio = {
        nombre_completo: cliente.nombre_completo,
        direccion: cliente.direccion || 'Recogida en tienda',
        localidad: cliente.localidad || '',
        provincia: cliente.provincia || '',
        codigo_postal: cliente.codigo_postal || '',
        telefono: cliente.telefono || '',
    };
    
    const { data: orderData, error: orderError } = await supabase
      .from("pedidos")
      .insert({
        propietario_id: clienteId,
        estado: "completado", // Los pedidos manuales se consideran completados
        total: total,
        direccion_envio: direccionEnvio,
        email_cliente: cliente.email,
      })
      .select("id")
      .single();

    if (orderError) throw new Error(`Error al crear el pedido: ${orderError.message}`);
    const orderId = orderData.id;

    // 2. Crear los items del pedido
    const orderItemsToInsert = items.map(item => ({
      pedido_id: orderId,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.subtotal / item.cantidad, // Guardamos el precio final unitario
    }));

    await supabase.from("items_pedido").insert(orderItemsToInsert);

    // 3. Descontar el stock de cada producto
    for (const item of items) {
      const { error: stockError } = await supabase.rpc('descontar_stock', {
        producto_id_param: item.producto_id,
        cantidad_param: item.cantidad,
        nota_param: `Venta Manual Pedido #${orderId.substring(0, 6)}`,
      });
      if (stockError) throw new Error(`Stock insuficiente para ${item.nombre}.`);
    }

    // 4. Crear la factura correspondiente
    const items_factura: ItemFactura[] = items.map(item => {
        const montoImpuesto = item.precio_unitario * item.cantidad * (item.porcentaje_impuesto / 100);
        return {
            descripcion: item.nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            porcentaje_impuesto: item.porcentaje_impuesto,
            monto_impuesto: montoImpuesto,
            base_imponible: item.precio_unitario * item.cantidad,
        };
    });
    
    const { data: newFactura, error: facturaError } = await supabase
        .from('facturas')
        .insert({
            cliente_id: clienteId,
            estado: 'pagada', // Los pedidos manuales se consideran pagados
            total: total,
            items: items_factura,
            pedido_id: orderId, // Enlazamos la factura al pedido
            notas: `Factura generada para pedido manual #${orderId.substring(0, 8)}.`
        })
        .select('id')
        .single();

    if (facturaError) throw new Error(`Error al crear la factura: ${facturaError.message}`);
    
    // 5. Vincular la factura al pedido
    await supabase.from('pedidos').update({ factura_id: newFactura.id }).eq('id', orderId);
    
    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard/facturacion");
    revalidatePath("/dashboard/inventario");

    return { success: true, orderId: orderId, message: "Pedido manual creado y facturado con éxito." };

  } catch (e: any) {
    console.error("Error completo en createManualOrder:", e);
    // En un escenario real, aquí se debería implementar una transacción para revertir cambios si algo falla
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}
