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

const getSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase environment variables");
    }
    return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!sig || !webhookSecret || !stripeSecretKey) {
    console.error("[Stripe Webhook] Error: Faltan secretos de configuración.");
    return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error de verificación de firma: ${err.message}`);
    return NextResponse.json({ error: `Error de Webhook: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
        const supabaseAdmin = getSupabaseAdminClient();
        const metadata = session.metadata;

        if (!metadata || !metadata.direccion_envio_json || !metadata.items_pedido_json) {
            throw new Error("La sesión de Stripe no contiene los metadatos necesarios.");
        }

        const direccionEnvio: DireccionEnvio = JSON.parse(metadata.direccion_envio_json);
        const itemsPedido: CartItemMetadata[] = JSON.parse(metadata.items_pedido_json);
        
        // =====> INICIO DE LA CORRECCIÓN <=====
        // Leemos TODOS los detalles del descuento directamente desde los metadatos.
        const montoDescuento = (session.total_details?.amount_discount || 0) / 100;
        const codigoDescuento = metadata.codigo_descuento || null;
        const tipoDescuento = metadata.tipo_descuento || null;
        // Convertimos el valor del descuento de string a número.
        const valorDescuento = metadata.valor_descuento ? Number(metadata.valor_descuento) : null;
        // =====> FIN DE LA CORRECCIÓN <=====

        const rpcParams = {
            in_propietario_id: metadata.customer_id || null,
            in_email_cliente: session.customer_details?.email,
            in_total: (session.amount_total || 0) / 100,
            in_direccion_envio: direccionEnvio,
            in_metodo_pago: 'Stripe',
            in_transaccion_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            in_checkout_reference: session.id,
            in_items: itemsPedido,
            in_monto_descuento: montoDescuento,
            in_codigo_descuento: codigoDescuento,
            // Pasamos los nuevos parámetros a la función RPC
            in_tipo_descuento: tipoDescuento,
            in_valor_descuento: valorDescuento,
        };

        const { data: newOrderId, error: rpcError } = await supabaseAdmin
            .rpc('crear_pedido_y_factura_online', rpcParams);

        if (rpcError) {
            throw new Error(`Error en la BD al crear pedido: ${rpcError.message}`);
        }
        if (!newOrderId) {
            throw new Error("La función RPC no devolvió un ID de pedido válido.");
        }

        // Aquí iría la lógica para enviar el email de confirmación si lo deseas
        // ...

    } catch (e: any) {
        console.error(`[Stripe Webhook] Error crítico al procesar la sesión ${session.id}:`, e.message);
        return NextResponse.json({ error: `Fallo en el manejador del webhook: ${e.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
