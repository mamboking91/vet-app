// src/app/checkout/actions.ts

"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";
import Stripe from 'stripe';
import SumUp from '@sumup/sdk';
import type { CartItem } from "@/context/CartContext";
import type { ImagenProducto } from "@/app/dashboard/inventario/types";
import type { CodigoDescuento } from "@/app/dashboard/descuentos/types";
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

async function prepareCheckoutData(cartItems: CartItem[], formData: FormData) {
    const supabase = createServerActionClient({ cookies: () => cookies() });
    
    if (!cartItems || cartItems.length === 0) {
        throw new Error("El carrito está vacío.");
    }

    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = checkoutSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
        throw new Error("Datos de envío inválidos.");
    }

    const productIds = cartItems.map(item => item.id);
    
    const { data: productsData, error: productsError } = await supabase
      .from('productos_inventario_con_stock')
      .select('id, nombre, precio_venta, porcentaje_impuesto, imagen_producto_principal')
      .in('id', productIds);

    if (productsError) {
        console.error("Error al consultar la vista de productos:", productsError);
        throw new Error("No se pudieron obtener los detalles de los productos.");
    }

    const itemsConPrecio = cartItems.map(cartItem => {
      const productInfo = productsData?.find(p => p.id === cartItem.id);
      if (!productInfo || productInfo.precio_venta === null) {
          throw new Error(`El producto '${cartItem.nombre}' no tiene un precio válido.`);
      }
      const precioBase = Number(productInfo.precio_venta);
      const impuesto = Number(productInfo.porcentaje_impuesto ?? 0);
      const precioFinalUnitario = precioBase * (1 + impuesto / 100);
      
      return {
        ...cartItem,
        precio_venta: precioBase,
        porcentaje_impuesto: impuesto,
        precio_final_unitario: parseFloat(precioFinalUnitario.toFixed(2)),
        imagenes: productInfo.imagen_producto_principal ? [{ url: productInfo.imagen_producto_principal, isPrimary: true, order: 0 }] : [],
      };
    });

    return { validatedAddress: validatedFields.data, detailedItems: itemsConPrecio };
}

export async function createStripeCheckout(
  cartItems: CartItem[], 
  descuento: CodigoDescuento | null,
  formData: FormData
) {
  try {
    const { validatedAddress, detailedItems } = await prepareCheckoutData(cartItems, formData);

    const line_items = detailedItems.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.nombre,
          images: item.imagenes?.map((img: ImagenProducto) => img.url) || [],
        },
        unit_amount: Math.round(item.precio_final_unitario * 100),
      },
      quantity: item.quantity,
    }));

    const subtotal = detailedItems.reduce((acc, item) => acc + (item.precio_final_unitario * item.quantity), 0);
    const discountAmount = descuento ? (descuento.tipo_descuento === 'fijo' ? descuento.valor : (subtotal * descuento.valor / 100)) : 0;

    const coupon = discountAmount > 0 ? await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: 'eur',
        duration: 'once',
        name: `Descuento: ${descuento?.codigo || 'N/A'}`
    }) : null;

    const { data: authData } = await createServerActionClient({ cookies: () => cookies() }).auth.getUser();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      discounts: coupon ? [{ coupon: coupon.id }] : [],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pedido/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/carrito`,
      metadata: {
        customer_id: authData.user?.id || null,
        direccion_envio_json: JSON.stringify(validatedAddress),
        items_pedido_json: JSON.stringify(detailedItems.map(item => ({ 
            producto_id: item.id,
            nombre: item.nombre,
            cantidad: item.quantity,
            precio_unitario: item.precio_venta,
            porcentaje_impuesto: item.porcentaje_impuesto,
        }))),
        // --- ESTA ES LA PARTE MÁS IMPORTANTE ---
        // Enviamos todos los detalles del descuento directamente.
        codigo_descuento: descuento?.codigo || null,
        tipo_descuento: descuento?.tipo_descuento || null,
        valor_descuento: descuento?.valor?.toString() || null,
      }
    });

    if (!session.url) throw new Error("No se pudo crear la URL de pago de Stripe.");
    return { success: true, checkoutUrl: session.url };

  } catch (error: any) {
    return { success: false, error: `Error al crear el pago con Stripe: ${error.message}` };
  }
}

// También actualizamos SumUp para que sea consistente
export async function createSumupCheckout(
  cartItems: CartItem[], 
  descuento: CodigoDescuento | null,
  formData: FormData
) {
  try {
    const { validatedAddress, detailedItems } = await prepareCheckoutData(cartItems, formData);

    const subtotal = detailedItems.reduce((acc, item) => acc + (item.precio_final_unitario * item.quantity), 0);
    const discountAmount = descuento ? (descuento.tipo_descuento === 'fijo' ? descuento.valor : (subtotal * descuento.valor / 100)) : 0;
    const totalFinal = subtotal - discountAmount;

    const sumup = new SumUp({ apiKey: process.env.SUMUP_CLIENT_SECRET! });

    const checkoutData = {
      checkout_reference: `VET-APP-${crypto.randomUUID()}`,
      amount: parseFloat(totalFinal.toFixed(2)),
      currency: 'EUR' as const,
      merchant_code: process.env.NEXT_PUBLIC_SUMUP_MERCHANT_CODE!,
      customer: {
        name: validatedAddress.nombre_completo,
        email: validatedAddress.email
      },
      metadata: {
        direccion_envio_json: JSON.stringify(validatedAddress),
        items_pedido_json: JSON.stringify(detailedItems.map(item => ({ 
            producto_id: item.id, 
            cantidad: item.quantity,
            precio_unitario: item.precio_final_unitario
        }))),
        codigo_descuento: descuento?.codigo || null,
        tipo_descuento: descuento?.tipo_descuento || null,
        valor_descuento: descuento?.valor?.toString() || null,
      },
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pedido/confirmacion`
    };

    const checkoutResponse = await sumup.checkouts.create(checkoutData);
    return { success: true, checkoutId: checkoutResponse.id };

  } catch (error: any) {
    return { success: false, error: `Error al crear el pago con SumUp: ${error.message}` };
  }
}
