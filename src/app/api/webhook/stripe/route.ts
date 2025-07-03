import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!sig || !webhookSecret) {
    console.error("Stripe Webhook: Faltan la firma o el secreto.");
    return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Stripe Webhook: Verificación de firma fallida: ${err.message}`);
    return NextResponse.json({ error: `Error de Webhook: ${err.message}` }, { status: 400 });
  }

  // Solo nos interesa el evento que confirma que la sesión de pago se completó
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(`[Webhook] Procesando checkout.session.completed para la sesión: ${session.id}`);

    try {
      const metadata = session.metadata;
      if (!metadata) {
        throw new Error("La sesión de Stripe no contiene los metadatos necesarios.");
      }
      
      const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

      // Llamamos a nuestra nueva y robusta función de la base de datos
      const { data: newOrderId, error: rpcError } = await supabaseAdmin.rpc('crear_pedido_y_factura_desde_stripe', {
        p_checkout_reference: session.id,
        p_propietario_id: metadata.customer_id || null,
        p_email_cliente: session.customer_details?.email,
        p_total: session.amount_total ? session.amount_total / 100 : 0,
        p_direccion_envio: JSON.parse(metadata.direccion_envio_json),
        p_items_pedido: JSON.parse(metadata.items_pedido_json),
        p_transaccion_id: typeof session.payment_intent === 'string' ? session.payment_intent : 'N/A',
        p_metodo_pago: 'Stripe'
      });

      if (rpcError) {
        throw new Error(`Error en la función RPC: ${rpcError.message}`);
      }

      console.log(`[Webhook] Pedido y factura creados con éxito. ID del Pedido: ${newOrderId}`);
      
      // Aquí puedes añadir la lógica para enviar emails de confirmación si lo deseas

    } catch (processingError: any) {
      console.error(`[Webhook] Error crítico al procesar la sesión ${session.id}:`, processingError.message);
      return NextResponse.json({ error: `Fallo en el manejador del webhook: ${processingError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
