// src/app/dashboard/pedidos/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ESTADOS_PEDIDO, type EstadoPedido } from "./types";

// --- ACCIÓN PARA ACTUALIZAR EL ESTADO ---
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
  const { estado } = validatedFields.data;
  try {
    const { error } = await supabase.from('pedidos').update({ estado, updated_at: new Date().toISOString() }).eq('id', pedidoId);
    if (error) throw new Error(`Error al actualizar el estado del pedido: ${error.message}`);
    revalidatePath(`/dashboard/pedidos/${pedidoId}`);
    revalidatePath('/dashboard/pedidos');
    return { success: true, message: "Estado del pedido actualizado." };
  } catch (e: any) {
    return { success: false, error: { message: `Error inesperado: ${e.message}` } };
  }
}

// --- ACCIÓN PARA CANCELAR UN PEDIDO ---
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
    return { success: true, message: "Pedido y factura asociada han sido cancelados. Recuerda ajustar el stock manualmente." };

  } catch (e: any) {
    return { success: false, error: { message: e.message } };
  }
}

// --- ACCIÓN PARA EDITAR DETALLES (DIRECCIÓN) DE UN PEDIDO ---
const DireccionEnvioSchema = z.object({
  nombre_completo: z.string().min(1, "El nombre es requerido."),
  direccion: z.string().min(1, "La dirección es requerida."),
  localidad: z.string().min(1, "La localidad es requerida."),
  provincia: z.string().min(1, "La provincia es requerida."),
  codigo_postal: z.string().min(5, "El código postal es inválido."),
  telefono: z.string().optional(),
});

export async function updateOrderDetails(pedidoId: string, formData: FormData) {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });

    if (!z.string().uuid().safeParse(pedidoId).success) {
      return { success: false, error: { message: "ID de pedido inválido." } };
    }
    
    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = DireccionEnvioSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
        return { success: false, error: { message: "Datos de envío inválidos.", errors: validatedFields.error.flatten().fieldErrors }};
    }
    
    try {
        const { error } = await supabase
            .from('pedidos')
            .update({ direccion_envio: validatedFields.data, updated_at: new Date().toISOString() })
            .eq('id', pedidoId);

        if (error) throw new Error(error.message);

        revalidatePath(`/dashboard/pedidos/${pedidoId}`);
        revalidatePath(`/dashboard/pedidos/${pedidoId}/editar`);
        return { success: true, message: "Los detalles del pedido han sido actualizados." };

    } catch(e: any) {
        return { success: false, error: { message: `Error al actualizar el pedido: ${e.message}` } };
    }
}


// -------- LÓGICA DE CREACIÓN DE PEDIDO (SIN CAMBIOS) --------

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

    revalidatePath("/dashboard/pedidos");
    revalidatePath("/dashboard/facturacion");
    revalidatePath("/dashboard/inventario");

    return { success: true, orderId, message: "Pedido manual creado y facturado con éxito." };
  } catch(e: any) {
    console.error("Error al ejecutar RPC crear_pedido_manual_completo:", e);
    return { success: false, error: { message: e.message } };
  }
}
