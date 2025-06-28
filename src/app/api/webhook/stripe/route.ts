// src/app/api/webhooks/stripe/route.ts

import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { CustomerOrderConfirmation } from '@/app/emails/CustomerOrderConfirmation';
import { AdminOrderNotification } from '@/app/emails/AdminOrderNotification';

export const dynamic = 'force-dynamic';

// --- FUNCIÓN PARA GENERAR NÚMERO DE FACTURA ---
async function getNextInvoiceNumber(supabase: any) {
  const currentYear = new Date().getFullYear();
  const { data, error } = await supabase
    .from('facturas')
    .select('numero_factura')
    .like('numero_factura', `FACT-${currentYear}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = 'No rows found'
    throw error;
  }

  if (!data) {
    return `FACT-${currentYear}-0001`;
  }

  const lastNumber = parseInt(data.numero_factura.split('-')[2], 10);
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `FACT-${currentYear}-${nextNumber}`;
}


export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const adminEmail = process.env.ADMIN_EMAIL!;

  if (!sig || !webhookSecret) {
    console.error("Stripe Webhook Error: Missing signature or secret.");
    return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Stripe Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(`[Webhook] Processing event for session ${session.id}`);

    try {
      const metadata = session.metadata;
      if (!metadata) throw new Error("Metadata is missing from the Stripe session.");
      
      const itemsFromStripe = JSON.parse(metadata.items_pedido_json);
      const direccionEnvio = JSON.parse(metadata.direccion_envio_json);
      const propietarioId = metadata.customer_id || null;

      if (!propietarioId) {
        throw new Error("Cannot create invoice: 'propietario_id' is null. User might not be logged in.");
      }

      // --- PASO 1: Crear el registro principal del pedido ---
      const { data: nuevoPedido, error: insertPedidoError } = await supabaseAdmin
        .from('pedidos')
        .insert({
          checkout_reference: session.id,
          email_cliente: session.customer_details?.email,
          total: session.amount_total ? session.amount_total / 100 : 0,
          direccion_envio: direccionEnvio,
          transaccion_id: typeof session.payment_intent === 'string' ? session.payment_intent : 'N/A',
          metodo_pago: 'Stripe',
          propietario_id: propietarioId,
          estado: 'procesando' as const
        })
        .select('id')
        .single();

      if (insertPedidoError || !nuevoPedido) throw new Error(`Database INSERT Error (pedidos): ${insertPedidoError?.message}`);
      
      const pedidoId = nuevoPedido.id;
      console.log(`[Webhook] Main order record created with ID: ${pedidoId}`);

      // --- PASO 2: Crear los items del pedido ---
      const itemsParaInsertar = itemsFromStripe.map((item: any) => ({
        pedido_id: pedidoId,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      }));

      const { error: insertItemsError } = await supabaseAdmin.from('items_pedido').insert(itemsParaInsertar);

      if (insertItemsError) {
        await supabaseAdmin.from('pedidos').delete().eq('id', pedidoId);
        throw new Error(`Database INSERT Error (items_pedido): ${insertItemsError.message}`);
      }
      console.log(`[Webhook] ${itemsParaInsertar.length} items inserted for order ID: ${pedidoId}`);

      // --- PASO 3: Calcular totales y crear la factura ---
      const subtotal = itemsFromStripe.reduce((acc: number, item: any) => acc + (item.precio_unitario * item.cantidad), 0);
      const montoImpuesto = itemsFromStripe.reduce((acc: number, item: any) => {
        const impuesto = (item.precio_unitario * item.cantidad) * (item.porcentaje_impuesto / 100);
        return acc + impuesto;
      }, 0);
      const desgloseImpuestos = itemsFromStripe.reduce((acc: any, item: any) => {
        const tipo = item.porcentaje_impuesto.toString();
        const valor = (item.precio_unitario * item.cantidad) * (item.porcentaje_impuesto / 100);
        if (!acc[tipo]) acc[tipo] = 0;
        acc[tipo] += valor;
        return acc;
      }, {});
      
      const numeroFactura = await getNextInvoiceNumber(supabaseAdmin);
      const fechaEmision = new Date().toISOString().split('T')[0];
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

      const { data: nuevaFactura, error: insertFacturaError } = await supabaseAdmin
        .from('facturas')
        .insert({
          pedido_id: pedidoId,
          propietario_id: propietarioId,
          numero_factura: numeroFactura,
          fecha_emision: fechaEmision,
          fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
          subtotal: subtotal,
          monto_impuesto: montoImpuesto,
          total: session.amount_total ? session.amount_total / 100 : 0,
          // --- CORRECCIÓN FINAL ---
          // Se usa el valor correcto del ENUM con mayúscula inicial.
          estado: 'Pagada' as const,
          desglose_impuestos: desgloseImpuestos,
        })
        .select('id')
        .single();
      
      if (insertFacturaError || !nuevaFactura) throw new Error(`Database INSERT Error (facturas): ${insertFacturaError?.message}`);
      
      const facturaId = nuevaFactura.id;
      console.log(`[Webhook] Invoice record created with ID: ${facturaId}`);

      // --- PASO 4: Vincular la factura al pedido ---
      await supabaseAdmin.from('pedidos').update({ factura_id: facturaId }).eq('id', pedidoId);
      console.log(`[Webhook] Order ${pedidoId} updated with Invoice ID ${facturaId}`);

      // --- PASO 5: Enviar correos de confirmación ---
      if (session.customer_details?.email) {
        const totalAmountString = (session.amount_total || 0) / 100;
        const customerName = direccionEnvio.nombre_completo.split(' ')[0] || 'Cliente';
        
        await resend.emails.send({
            from: 'Gomera Mascotas <info@gomeramascotas.com>',
            to: session.customer_details.email,
            subject: `Confirmación de tu pedido #${pedidoId.substring(0, 8)}`,
            react: CustomerOrderConfirmation({
                customerName: customerName,
                orderId: pedidoId,
                orderTotal: totalAmountString.toFixed(2),
                shippingAddress: direccionEnvio,
            }),
        });
        console.log(`[Webhook] Confirmation email sent to ${session.customer_details.email}`);

        await resend.emails.send({
            from: 'Alerta de Pedido <info@gomeramascotas.com>',
            to: adminEmail,
            subject: `¡Nuevo Pedido! - #${pedidoId.substring(0, 8)}`,
            react: AdminOrderNotification({
                orderId: pedidoId,
                orderTotal: totalAmountString.toFixed(2),
            }),
        });
        console.log(`[Webhook] Admin notification sent to ${adminEmail}`);
      }

    } catch (processingError: any) {
      console.error(`[Webhook] Critical error processing session ${session.id}:`, processingError.message);
      return NextResponse.json({ error: `Webhook handler failed: ${processingError.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
