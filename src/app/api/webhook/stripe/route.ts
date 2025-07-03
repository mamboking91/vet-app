import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

      const p_items_pedido = JSON.parse(metadata.items_pedido_json);

      // Iniciar transacción (simulada, ya que Supabase no tiene transacciones en JS, pero agrupamos operaciones)
      // 1. Crear el pedido
      const { data: pedido, error: pedidoError } = await supabaseAdmin
        .from('pedidos')
        .insert({
          propietario_id: metadata.customer_id || null,
          email_cliente: session.customer_details?.email,
          total: session.amount_total ? session.amount_total / 100 : 0,
          direccion_envio: JSON.parse(metadata.direccion_envio_json),
          estado: 'procesando',
          metodo_pago: 'Stripe',
          transaccion_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          checkout_reference: session.id,
        })
        .select()
        .single();
      
      if (pedidoError) throw new Error(`Error al crear el pedido: ${pedidoError.message}`);
      const v_nuevo_pedido_id = pedido.id;

      // 2. Calcular totales para la factura
      let v_subtotal = 0;
      let v_monto_impuesto = 0;
      let v_desglose_impuestos: { [key: string]: { base: number; impuesto: number } } = {};

      for (const item of p_items_pedido) {
        const base_item = item.cantidad * item.precio_unitario;
        const tasa = item.porcentaje_impuesto / 100.0;
        const impuesto_item = base_item * tasa;

        v_subtotal += base_item;
        v_monto_impuesto += impuesto_item;
        
        const tasa_key = `IGIC_${item.porcentaje_impuesto}%`;
        if (!v_desglose_impuestos[tasa_key]) {
            v_desglose_impuestos[tasa_key] = { base: 0, impuesto: 0 };
        }
        v_desglose_impuestos[tasa_key].base += base_item;
        v_desglose_impuestos[tasa_key].impuesto += impuesto_item;
      }

      // 3. Obtener número de factura
      const { data: numero_factura, error: fnError } = await supabaseAdmin.rpc('get_next_invoice_number', { p_prefix: 'FACT' });
      if (fnError) throw new Error(`Error al generar número de factura: ${fnError.message}`);

      // 4. Crear la factura
      const { data: factura, error: facturaError } = await supabaseAdmin
        .from('facturas')
        .insert({
          numero_factura,
          propietario_id: metadata.customer_id || null,
          fecha_emision: new Date().toISOString(),
          subtotal: v_subtotal,
          monto_impuesto: v_monto_impuesto,
          total: session.amount_total ? session.amount_total / 100 : 0,
          desglose_impuestos: v_desglose_impuestos,
          estado: 'Pendiente',
          origen: 'Pedido Online',
          pedido_id_origen: v_nuevo_pedido_id,
        })
        .select()
        .single();

      if (facturaError) throw new Error(`Error al crear la factura: ${facturaError.message}`);
      const v_nueva_factura_id = factura.id;

      // 5. Insertar items de la factura
      const itemsParaInsertar = p_items_pedido.map((item: any) => ({
        factura_id: v_nueva_factura_id,
        producto_inventario_id: item.producto_id,
        descripcion: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        base_imponible_item: item.cantidad * item.precio_unitario,
        porcentaje_impuesto_item: item.porcentaje_impuesto,
        monto_impuesto_item: (item.cantidad * item.precio_unitario) * (item.porcentaje_impuesto / 100.0),
        total_item: (item.cantidad * item.precio_unitario) * (1 + (item.porcentaje_impuesto / 100.0)),
      }));

      const { error: itemsError } = await supabaseAdmin.from('items_factura').insert(itemsParaInsertar);
      if (itemsError) throw new Error(`Error al insertar los items de la factura: ${itemsError.message}`);

      // 6. Actualizar el pedido con el ID de la factura
      await supabaseAdmin.from('pedidos').update({ factura_id: v_nueva_factura_id }).eq('id', v_nuevo_pedido_id);

    } catch (e: any) {
      console.error(`[Webhook] Error crítico al procesar la sesión ${session.id}:`, e);
      return NextResponse.json({ error: `Fallo en el manejador del webhook: ${e.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}