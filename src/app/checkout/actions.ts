"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CartItem } from "@/context/CartContext";

// Esquema de validación para los datos del formulario de checkout
const checkoutSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido."),
  apellidos: z.string().min(1, "Los apellidos son requeridos."),
  email: z.string().email("El correo electrónico no es válido."), // <-- NUEVO CAMPO
  direccion: z.string().min(1, "La dirección es requerida."),
  localidad: z.string().min(1, "La localidad es requerida."),
  provincia: z.string().min(1, "La provincia es requerida."),
  codigo_postal: z.string().min(5, "El código postal es inválido."),
  telefono: z.string().optional(),
});

export async function createOrder(cartItems: CartItem[], totalAmount: number, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  // 1. Obtenemos al usuario. Puede ser `null` si es un invitado.
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
    // 2. Crear el registro en la tabla 'pedidos'
    const { data: orderData, error: orderError } = await supabase
      .from("pedidos")
      .insert({
        // El propietario_id será el ID del usuario si está logueado, o null si es un invitado
        propietario_id: user?.id ?? null, 
        estado: "procesando",
        total: totalAmount,
        direccion_envio: {
          nombre: validatedFields.data.nombre,
          apellidos: validatedFields.data.apellidos,
          direccion: validatedFields.data.direccion,
          localidad: validatedFields.data.localidad,
          provincia: validatedFields.data.provincia,
          codigo_postal: validatedFields.data.codigo_postal,
          telefono: validatedFields.data.telefono,
        },
        // Guardamos el email del cliente, sea invitado o no
        email_cliente: validatedFields.data.email,
      })
      .select("id")
      .single();

    if (orderError) throw new Error(`Error al crear el pedido: ${orderError.message}`);

    const orderId = orderData.id;

    // 3. Crear los registros en 'items_pedido'
    const orderItemsToInsert = cartItems.map(item => ({
      pedido_id: orderId,
      producto_id: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precioFinal,
    }));
    
    const { error: itemsError } = await supabase
      .from("items_pedido")
      .insert(orderItemsToInsert);

    if (itemsError) throw new Error(`Error al guardar los artículos del pedido: ${itemsError.message}`);

    // 4. Descontar el stock
    for (const item of cartItems) {
      const { error: stockError } = await supabase.rpc('descontar_stock', {
        producto_id_param: item.id,
        cantidad_param: item.cantidad,
        nota_param: `Venta Online Pedido #${orderId.substring(0, 6)}`,
      });
      
      if (stockError) {
        console.error(`Error descontando stock para producto ${item.id}: ${stockError.message}. El pedido ${orderId} necesita revisión manual.`);
        throw new Error(`Stock insuficiente para ${item.nombre}. Por favor, contacta con nosotros.`);
      }
    }

    revalidatePath("/dashboard/inventario");
    // Devolvemos también si el usuario era invitado para poder mostrarle la opción de registrarse
    return { success: true, orderId: orderId, isGuest: !user };

  } catch (error: any) {
    console.error("Error completo en createOrder:", error);
    return { success: false, error: { message: `Error inesperado al procesar el pedido: ${error.message}` } };
  }
}
