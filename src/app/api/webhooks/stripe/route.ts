import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { CustomerOrderConfirmation } from '@/app/emails/CustomerOrderConfirmation';
import { AdminOrderNotification } from '@/app/emails/AdminOrderNotification';

// Inicialización de los servicios
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);

// Claves secretas
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const adminEmail = process.env.ADMIN_EMAIL!; // Asegúrate de tener esta variable en tu .env.local

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  
  try {
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    // Solo actuar en el evento que confirma el pago completo
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata) {
        throw new Error("Faltan metadatos en la sesión de Stripe");
      }

      // 1. Crear el pedido en la base de datos y obtener el ID devuelto
      const { data: pedidoId, error: rpcError } = await supabaseAdmin.rpc('crear_pedido_y_factura_desde_pago', {
          p_checkout_reference: session.id,
          p_email_cliente: session.customer_details?.email,
          p_total: session.amount_total ? session.amount_total / 100 : 0,
          p_direccion_envio: JSON.parse(metadata.direccion_envio_json),
          p_items_pedido: JSON.parse(metadata.items_pedido_json),
          p_transaccion_id: typeof session.payment_intent === 'string' ? session.payment_intent : 'N/A',
          p_metodo_pago: 'Stripe',
          p_cliente_id: metadata.customer_id || null
      });

      if (rpcError) {
        console.error("Error al crear el pedido en la BD:", rpcError);
        throw rpcError; // Detener si la creación del pedido falla
      }
      
      // 2. Si el pedido se creó con éxito, enviar correos
      if (pedidoId && session.customer_details?.email) {
        const totalAmountString = ((session.amount_total || 0) / 100).toFixed(2);
        const shippingAddress = JSON.parse(metadata.direccion_envio_json);
        const customerName = shippingAddress.nombre_completo.split(' ')[0]; // Usar solo el primer nombre

        try {
            // Enviar correo de confirmación al cliente
            await resend.emails.send({
                from: 'Gomera Mascotas <no-reply@gomeramascotas.com>', // IMPORTANTE: Cambia esto a tu dominio verificado en Resend
                to: session.customer_details.email,
                subject: `Confirmación de tu pedido #${(pedidoId as string).substring(0, 8)}`,
                react: CustomerOrderConfirmation({
                    customerName: customerName,
                    orderId: pedidoId as string,
                    orderTotal: totalAmountString,
                    shippingAddress: shippingAddress,
                }),
            });

            // Enviar correo de notificación al administrador
            await resend.emails.send({
                from: 'Alerta de Pedido <no-reply@gomeramascotas.com>', // IMPORTANTE: Cambia esto a tu dominio
                to: adminEmail,
                subject: `¡Nuevo Pedido! - #${(pedidoId as string).substring(0, 8)}`,
                react: AdminOrderNotification({
                    orderId: pedidoId as string,
                    orderTotal: totalAmountString,
                }),
            });
        } catch (emailError) {
            // Si los correos fallan, no detenemos el proceso, pero lo registramos.
            // El pedido ya está creado, que es lo más importante.
            console.error("El pedido se creó, pero falló el envío de correos:", emailError);
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error("Error en el handler del webhook de Stripe:", err.message);
    return NextResponse.json({ error: `Error de Webhook: ${err.message}` }, { status: 400 });
  }
}