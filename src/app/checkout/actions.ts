"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CartItem } from "@/context/CartContext";
import type { ItemFactura } from "@/app/dashboard/facturacion/types";

// Esquema de validación para los datos del formulario de checkout
// Mantenemos nombre y apellidos separados para el formulario de dirección
const checkoutSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  apellidos: z.string().min(1, "Los apellidos son requeridos."),
  email: z.string().email("El correo electrónico no es válido."),
  direccion: z.string().min(1, "La dirección es requerida."),
  localidad: z.string().min(1, "La localidad es requerida."),
  provincia: z.string().min(1, "La provincia es requerida."),
  codigo_postal: z.string().min(5, "El código postal es inválido."),
  telefono: z.string().optional(),
});

export async function createOrder(cartItems: CartItem[], totalAmount: number, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = checkoutSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: {
        message: "Datos de envío inválidos.",
        errors: validatedFields.error.flatten().fieldErrors,
      },
    };
  }

  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: { message: "El carrito está vacío." } };
  }

  try {
    // ---- Inicia Transacción (Conceptual) ----
    
    // 1. Crear el registro en la tabla 'pedidos'
    const direccionEnvio = {
          nombre: validatedFields.data.nombre,
          apellidos: validatedFields.data.apellidos,
          direccion: validatedFields.data.direccion,
          localidad: validatedFields.data.localidad,
          provincia: validatedFields.data.provincia,
          codigo_postal: validatedFields.data.codigo_postal,
          telefono: validatedFields.data.telefono,
    };

    const { data: orderData, error: orderError } = await supabase
      .from("pedidos")
      .insert({
        propietario_id: user?.id ?? null, 
        estado: "procesando", // Estado inicial
        total: totalAmount,
        direccion_envio: direccionEnvio,
        email_cliente: validatedFields.data.email,
      })
      .select("id")
      .single();

    if (orderError) throw new Error(`Error al crear el pedido: ${orderError.message}`);
    const orderId = orderData.id;

    // 2. Crear los registros en 'items_pedido'
    const orderItemsToInsert = cartItems.map(item => ({
      pedido_id: orderId,
      producto_id: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precioFinal, // Precio final con impuesto
    }));
    
    const { error: itemsError } = await supabase.from("items_pedido").insert(orderItemsToInsert);
    if (itemsError) throw new Error(`Error al guardar los artículos del pedido: ${itemsError.message}`);

    // 3. Descontar el stock
    for (const item of cartItems) {
      const { error: stockError } = await supabase.rpc('descontar_stock', {
        producto_id_param: item.id,
        cantidad_param: item.cantidad,
        nota_param: `Venta Online Pedido #${orderId.substring(0, 6)}`,
      });
      if (stockError) throw new Error(`Stock insuficiente para ${item.nombre}. Por favor, contacta con nosotros.`);
    }

    // --- 4. GENERACIÓN AUTOMÁTICA DE FACTURA ---
    
    // Obtenemos los datos completos de los productos para calcular impuestos
    const productIds = cartItems.map(item => item.id);
    const { data: productsData, error: productsError } = await supabase
        .from('productos_inventario')
        .select('id, nombre, precio_venta, porcentaje_impuesto')
        .in('id', productIds);
    if (productsError) throw new Error("No se pudieron obtener los detalles de los productos para la factura.");

    // Construimos los items de la factura
    const items_factura: ItemFactura[] = cartItems.map(cartItem => {
        const productInfo = productsData.find(p => p.id === cartItem.id);
        const precioBase = productInfo?.precio_venta ?? 0;
        const porcentajeImpuesto = productInfo?.porcentaje_impuesto ?? 0;
        const montoImpuesto = precioBase * (porcentajeImpuesto / 100);

        return {
            descripcion: cartItem.nombre,
            cantidad: cartItem.cantidad,
            precio_unitario: precioBase,
            porcentaje_impuesto: porcentajeImpuesto,
            monto_impuesto: montoImpuesto,
            base_imponible: precioBase * cartItem.cantidad,
        };
    });
    
    const { data: newFactura, error: facturaError } = await supabase
        .from('facturas')
        .insert({
            // Si el usuario está logueado, lo asignamos como cliente. Si no, la factura no tiene cliente asignado.
            cliente_id: user?.id ?? null,
            estado: 'pendiente', // Los pedidos online empiezan como pendientes de pago
            total: totalAmount,
            items: items_factura,
            pedido_id: orderId, // Enlazamos la factura con el pedido
            notas: `Factura generada automáticamente para el pedido online #${orderId.substring(0, 8)}.`
        })
        .select('id')
        .single();

    if (facturaError) throw new Error(`Error al crear la factura automática: ${facturaError.message}`);
    
    // Actualizamos el pedido con el ID de la factura recién creada
    await supabase.from('pedidos').update({ factura_id: newFactura.id }).eq('id', orderId);
    
    // --- Fin de la lógica de facturación ---

    revalidatePath("/dashboard/inventario");
    revalidatePath("/dashboard/facturacion"); // Revalidamos la página de facturas

    return { success: true, orderId: orderId, isGuest: !user };

  } catch (error: any) {
    console.error("Error completo en createOrder:", error);
    // En un escenario real, aquí se debería implementar una lógica para revertir la transacción
    return { success: false, error: { message: `Error inesperado al procesar el pedido: ${error.message}` } };
  }
}
