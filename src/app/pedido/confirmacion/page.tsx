// src/app/pedido/confirmacion/page.tsx

import { createClient } from '@supabase/supabase-js';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home } from 'lucide-react';

// --- TIPOS DE DATOS ---
type DetalleProducto = {
  nombre: string;
  imagen_producto_principal: string | null;
};

type ItemPedido = {
  cantidad: number;
  precio_unitario: number;
  producto_id: string;
  nombre: string;
  porcentaje_impuesto: number;
  productos_inventario?: DetalleProducto;
};

type PedidoCompleto = {
  id: string;
  created_at: string;
  total: number;
  email_cliente: string;
  direccion_envio: {
    nombre_completo?: string;
    direccion: string;
    localidad: string;
    provincia: string;
    codigo_postal: string;
  };
  items_pedido: ItemPedido[];
  factura?: {
    subtotal: number;
    monto_impuesto: number;
  } | null;
};

// --- FUNCIÓN DE UTILIDAD ---
const formatCurrency = (amount: number | null | undefined): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0,00 €';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

// --- LÓGICA DE REINTENTO ---
async function findOrderWithRetry(sessionId: string, retries = 5, delay = 1500): Promise<{ data: PedidoCompleto | null; error: { message: string } | null }> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (let i = 0; i < retries; i++) {
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('pedidos')
      .select(`
        *,
        factura:factura_id (
          subtotal,
          monto_impuesto,
          items_factura ( * )
        )
      `)
      .eq('checkout_reference', sessionId)
      .single();

    if (orderData) {
      const factura = Array.isArray(orderData.factura) ? orderData.factura[0] : orderData.factura;
      const itemsFactura = factura?.items_factura as any[] || [];
      const productIds = itemsFactura.map(item => item.producto_inventario_id).filter(Boolean);

      let productsMap = new Map();
      if (productIds.length > 0) {
        const { data: productsData } = await supabaseAdmin
          .from('productos_inventario_con_stock')
          .select('id, nombre, imagen_producto_principal')
          .in('id', productIds);
        productsMap = new Map(productsData?.map((p: any) => [p.id, p]));
      }
      
      const itemsPedidoFinal = itemsFactura.map((item: any) => ({
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        producto_id: item.producto_inventario_id,
        nombre: item.descripcion,
        porcentaje_impuesto: item.porcentaje_impuesto_item,
        productos_inventario: productsMap.get(item.producto_inventario_id)
      }));

      const finalOrderData = {
        ...orderData,
        items_pedido: itemsPedidoFinal,
        factura: {
          subtotal: factura?.subtotal || 0,
          monto_impuesto: factura?.monto_impuesto || 0,
        }
      };
      
      return { data: finalOrderData as PedidoCompleto, error: null };
    }
    
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return { data: null, error: { message: "No se pudo encontrar el pedido después de varios intentos." } };
}

// --- COMPONENTE DE PÁGINA ---
export default async function ConfirmationPage({ searchParams }: { searchParams: { session_id?: string } }) {
  if (!searchParams.session_id) {
    redirect('/');
  }

  const { data: order, error } = await findOrderWithRetry(searchParams.session_id);

  if (error || !order) {
    console.error("Fallo al obtener el pedido después de los reintentos:", error?.message);
    notFound();
  }

  const direccion = order.direccion_envio;
  const nombreCompleto = direccion.nombre_completo || 'Cliente';

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">¡Gracias por tu pedido!</h1>
          <p className="mt-2 text-lg text-gray-600">Hemos recibido tu pedido y lo estamos preparando.</p>
          <p className="mt-1 text-sm text-gray-500">Número de pedido: <span className="font-medium text-gray-700">{order.id.substring(0, 8)}</span></p>
        </div>

        <Card className="shadow-lg">
          <CardHeader><CardTitle>Resumen de tu Compra</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200">
              {order.items_pedido.map((item, index) => {
                const precioFinalItem = (item.precio_unitario || 0) * (1 + ((item.porcentaje_impuesto ?? 0) / 100));
                return (
                  <div key={index} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                        {item.productos_inventario?.imagen_producto_principal && <Image src={item.productos_inventario.imagen_producto_principal} alt={item.nombre} width={64} height={64} className="object-contain rounded-md"/>}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{item.nombre}</p>
                        <p className="text-sm text-gray-500">{item.cantidad} x {formatCurrency(precioFinalItem)}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-800">{formatCurrency(item.cantidad * precioFinalItem)}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm">
               <div className="flex justify-between">
                <span className="text-gray-600">Subtotal (Base Imponible):</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.factura?.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impuestos (IGIC):</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.factura?.monto_impuesto)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t mt-2">
                <span>Total Pagado:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t pt-6">
                <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Dirección de envío</h3>
                    <address className="not-italic text-sm text-gray-600">
                        {nombreCompleto}<br/>
                        {direccion.direccion}<br/>
                        {direccion.codigo_postal} {direccion.localidad}, {direccion.provincia}
                    </address>
                </div>
                 <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Información de contacto</h3>
                     <p className="text-sm text-gray-600">{order.email_cliente}</p>
                  </div>
            </div>
            <div className="mt-8 text-center">
              <Button asChild><Link href="/tienda"><Home className="mr-2 h-4 w-4"/>Seguir Comprando</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}