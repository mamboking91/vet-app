import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationEmail } from '@/app/emails/actions';
// --- 1. IMPORTAMOS EL MÓDULO 'crypto' DE NODE.JS ---
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = headersList.get('sumup-signature');
    const timestamp = headersList.get('sumup-timestamp');
    const webhookSecret = process.env.SUMUP_WEBHOOK_SECRET;

    // --- 2. VERIFICACIÓN MANUAL DE LA FIRMA DEL WEBHOOK ---
    if (!signature || !timestamp || !webhookSecret) {
      console.warn('SumUp webhook missing required headers or secret.');
      return NextResponse.json({ error: 'Missing headers or secret' }, { status: 400 });
    }
    
    // Crear la firma que esperamos recibir
    const signedPayload = `${timestamp}.${body}`;
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(signedPayload);
    const expectedSignature = hmac.digest('hex');

    // Comparar las firmas de forma segura
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)) === false) {
       console.warn('Invalid SumUp webhook signature received.');
       return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // --- 3. EL RESTO DE LA LÓGICA SE MANTIENE IGUAL ---
    const event = JSON.parse(body);

    if (event.type === 'transaction.succeeded') {
      const transaction = event.data;
      const metadata = transaction.checkout.metadata;
      const { customer_id, email_cliente, direccion_envio_json, items_pedido_json } = metadata;

      const { data: pedidoId, error } = await supabaseAdmin.rpc('crear_pedido_desde_pago', {
          p_checkout_reference: transaction.checkout.id,
          p_customer_id: customer_id,
          p_email_cliente: email_cliente,
          p_total: transaction.checkout.amount,
          p_direccion_envio: JSON.parse(direccion_envio_json),
          p_items_pedido: JSON.parse(items_pedido_json),
          p_transaccion_id: transaction.id,
          p_metodo_pago: transaction.payment_type
      });
      
      if (error) {
        console.error('Error in RPC crear_pedido_desde_pago:', error);
        return NextResponse.json({ received: true, error: error.message });
      }

      const itemsParaEmail = JSON.parse(items_pedido_json).map((item: any) => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_final_unitario: item.precio_venta * (1 + item.porcentaje_impuesto / 100),
      }));

      if(pedidoId) {
        const { data: clinicData } = await supabaseAdmin.from('datos_clinica').select('logo_url').single();

        await sendOrderConfirmationEmail({
            pedidoId: pedidoId,
            fechaPedido: new Date(),
            direccionEnvio: JSON.parse(direccion_envio_json),
            items: itemsParaEmail,
            total: transaction.checkout.amount,
            emailTo: email_cliente,
            logoUrl: clinicData?.logo_url,
        });
      }

      console.log(`Successfully processed webhook for checkout ${transaction.checkout.id}. Order created: ${pedidoId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing SumUp webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}