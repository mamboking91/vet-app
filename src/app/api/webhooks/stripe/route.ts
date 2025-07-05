// src/app/api/webhooks/stripe/route.ts

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationEmail } from '@/app/emails/actions';
import type { DireccionEnvio } from '@/app/dashboard/pedidos/types';

export const dynamic = 'force-dynamic';

type CartItemMetadata = {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  porcentaje_impuesto: number;
};

type RpcResult = {
    id: string;
    created_at: string;
    total: number;
    is_new_user: boolean;
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Error de Webhook: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    try {
      const metadata = session.metadata;
      if (!metadata) throw new Error("La sesión de Stripe no contiene metadatos.");
      
      const direccionEnvio: DireccionEnvio = JSON.parse(metadata.direccion_envio_json);
      const itemsPedido: CartItemMetadata[] = JSON.parse(metadata.items_pedido_json);

      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('crear_pedido_y_factura_online', {
        in_propietario_id: metadata.customer_id || null,
        in_email_cliente: session.customer_details?.email,
        in_total: session.amount_total ? session.amount_total / 100 : 0,
        in_direccion_envio: direccionEnvio,
        in_metodo_pago: 'Stripe',
        in_transaccion_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        in_checkout_reference: session.id,
        in_items: itemsPedido
      }).single<RpcResult>();

      if (rpcError) {
        console.error("Error devuelto por la función RPC:", rpcError);
        throw new Error(`Error en la base de datos: ${rpcError.message}`);
      }
      
      console.log('¡ÉXITO! Pedido creado en la base de datos con ID:', rpcResult?.id);

    } catch (e: any) {
      console.error(`[Webhook] Error crítico al procesar la sesión ${session.id}:`, e.message);
      return NextResponse.json({ error: `Fallo en el manejador del webhook: ${e.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}