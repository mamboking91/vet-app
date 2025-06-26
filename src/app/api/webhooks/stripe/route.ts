import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { CustomerOrderConfirmation } from '@/app/emails/CustomerOrderConfirmation';
import { AdminOrderNotification } from '@/app/emails/AdminOrderNotification';

// No es necesario 'force-dynamic' con esta estructura, pero no hace daño dejarlo.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // --- INICIALIZACIÓN DENTRO DE LA FUNCIÓN ---
  // Esto asegura que los clientes solo se crean cuando la función se ejecuta.
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const adminEmail = process.env.ADMIN_EMAIL!;
  // ---------------------------------------------

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  
  try {
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata) {
        throw new Error("Faltan metadatos en la sesión de Stripe");
      }

      // 1. Crear el pedido en la base de datos
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
        throw rpcError;
      }
      
      // 2. Si el pedido se creó con éxito, enviar correos
      if (pedidoId && session.customer_details?.email) {
        const totalAmountString = ((session.amount_total || 0) / 100).toFixed(2);
        const shippingAddress = JSON.parse(metadata.direccion_envio_json);
        const customerName = shippingAddress.nombre_completo.split(' ')[0];

        try {
            await resend.emails.send({
                from: 'Clínica Vet <no-reply@tu-dominio.com>', // RECUERDA CAMBIAR ESTO
                to: session.customer_details.email,
                subject: `Confirmación de tu pedido #${(pedidoId as string).substring(0, 8)}`,
                react: CustomerOrderConfirmation({
                    customerName: customerName,
                    orderId: pedidoId as string,
                    orderTotal: totalAmountString,
                    shippingAddress: shippingAddress,
                }),
            });

            await resend.emails.send({
                from: 'Alerta de Pedido <no-reply@tu-dominio.com>', // Y ESTO
                to: adminEmail,
                subject: `¡Nuevo Pedido! - #${(pedidoId as string).substring(0, 8)}`,
                react: AdminOrderNotification({
                    orderId: pedidoId as string,
                    orderTotal: totalAmountString,
                }),
            });
        } catch (emailError) {
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