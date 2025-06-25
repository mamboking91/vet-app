"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";
import SumUp from '@sumup/sdk';
import type { CartItem } from "@/context/CartContext";
import crypto from 'crypto';

const checkoutSchema = z.object({
  nombre_completo: z.string().min(1, "El nombre es requerido."),
  email: z.string().email("El correo electrónico no es válido."),
  direccion: z.string().min(1, "La dirección es requerida."),
  localidad: z.string().min(1, "La localidad es requerida."),
  provincia: z.string().min(1, "La provincia es requerida."),
  codigo_postal: z.string().min(5, "El código postal es inválido."),
  telefono: z.string().optional(),
  create_account: z.string().optional(),
});

export async function createSumupCheckout(cartItems: CartItem[], totalAmount: number, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  let { data: { user } } = await supabase.auth.getUser();

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = checkoutSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: "Datos de envío inválidos." };
  }
  
  const { create_account, ...checkoutDetails } = validatedFields.data;
  let isNewUser = false;

  if (create_account === 'on' && !user) {
    const tempPassword = crypto.randomBytes(16).toString('hex');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: checkoutDetails.email,
        password: tempPassword,
        options: {
            data: {
                nombre_completo: checkoutDetails.nombre_completo,
            }
        }
    });

    if (signUpError) {
        if (!signUpError.message.includes("User already registered")) {
            return { success: false, error: `No se pudo crear la cuenta: ${signUpError.message}` };
        }
    } else if (signUpData.user) {
        isNewUser = true;
        user = signUpData.user;
        console.log(`Nueva cuenta creada para el invitado: ${user.email}`);
    }
  }

  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: "El carrito está vacío." };
  }

  try {
    const sumup = new SumUp({ apiKey: process.env.SUMUP_CLIENT_SECRET! });

    const productIds = cartItems.map(item => item.id);
    const { data: productsData, error: productsError } = await supabase
      .from('productos_inventario')
      .select('id, nombre, precio_venta, porcentaje_impuesto')
      .in('id', productIds);

    if (productsError) throw new Error("No se pudieron obtener los detalles de los productos.");

    const itemsParaMetadata = cartItems.map(cartItem => {
      const productInfo = productsData?.find(p => p.id === cartItem.id);
      return {
        producto_id: cartItem.id,
        // CORRECCIÓN: Se usa 'quantity' en lugar de 'cantidad' para coincidir con el tipo CartItem.
        cantidad: cartItem.quantity,
        nombre: cartItem.nombre,
        precio_venta: productInfo?.precio_venta ?? 0,
        porcentaje_impuesto: productInfo?.porcentaje_impuesto ?? 0,
      };
    });

    const checkoutData = {
      checkout_reference: `VET-APP-${crypto.randomUUID()}`,
      amount: totalAmount,
      currency: 'EUR' as const,
      merchant_code: process.env.NEXT_PUBLIC_SUMUP_MERCHANT_CODE!,
      customer: {
        name: checkoutDetails.nombre_completo,
        email: checkoutDetails.email
      },
      metadata: {
        customer_id: user?.id || null,
        email_cliente: checkoutDetails.email,
        direccion_envio_json: JSON.stringify(checkoutDetails),
        items_pedido_json: JSON.stringify(itemsParaMetadata),
        is_new_user: isNewUser,
      },
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pedido/confirmacion`
    };

    const checkoutResponse = await sumup.checkouts.create(checkoutData);

    return { success: true, checkoutId: checkoutResponse.id };

  } catch (error: any) {
    console.error("Error creating SumUp checkout:", error);
    return { success: false, error: `Error al crear el pago: ${error.message}` };
  }
}
