// src/app/pedido/confirmacion/page.tsx

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home } from 'lucide-react';

// --- TIPOS DE DATOS ---
type ImagenProducto = {
  url: string;
  isPrimary: boolean;
  order: number;
};

type DetalleProducto = {
  nombre: string;
  imagen_producto_principal: string | null;
  porcentaje_impuesto: number | null;
  precio_venta: number | null;
};

type ItemPedido = {
  cantidad: number;
  precio_unitario: number;
  producto_id: string;
  productos_inventario?: DetalleProducto;
};

type PedidoCompleto = {
  id: string;
  created_at: string;
  total: number;
  email_cliente: string;
  direccion_envio: {
    nombre_completo?: string;
    nombre?: string;
    apellidos?: string;
    direccion: string;
    localidad: string;
    provincia: string;
    codigo_postal: string;
  };
  items_pedido: ItemPedido[];
};

// --- FUNCIÓN DE UTILIDAD ---
const formatCurrency = (amount: number | null | undefined): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0,00 €';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

// --- LÓGICA DE REINTENTO (CORREGIDA) ---
async function findOrderWithRetry(sessionId: string, retries = 5, delay = 1500) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (let i = 0; i < retries; i++) {
    console.log(`[findOrderWithRetry] Intento ${i + 1} para la sesión: ${sessionId}`);
    
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('pedidos')
      .select(`
        id, created_at, total, email_cliente, direccion_envio,
        items_pedido ( producto_id, cantidad, precio_unitario )
      `)
      .eq('checkout_reference', sessionId)
      .single();

    if (orderError && orderError.code !== 'PGRST116') {
      console.error(`[findOrderWithRetry Intento ${i + 1}] Error al obtener el pedido:`, JSON.stringify(orderError, null, 2));
      if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }

    if (orderData && orderData.items_pedido) {
      console.log(`[findOrderWithRetry] Pedido encontrado. Obteniendo detalles de productos...`);
      
      const productIds = orderData.items_pedido.map((item: ItemPedido) => item.producto_id);
      
      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabaseAdmin
          .from('productos_inventario_con_stock')
          .select('id, nombre, imagen_producto_principal, porcentaje_impuesto, precio_venta')
          .in('id', productIds);

        if (productsError) {
          console.error(`[findOrderWithRetry] Error al obtener detalles de productos desde la vista:`, JSON.stringify(productsError, null, 2));
          if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const productsMap = new Map(productsData.map((p: any) => [p.id, p]));
        orderData.items_pedido.forEach((item: ItemPedido) => {
          item.productos_inventario = productsMap.get(item.producto_id);
        });
      }
      
      console.log("[findOrderWithRetry] Detalles de productos unidos con éxito.");
      return { data: orderData as PedidoCompleto, error: null };
    }

    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return { data: null, error: { message: "No se pudo encontrar el pedido después de varios intentos." } };
}

// --- COMPONENTE DE PÁGINA ---
export default async function ConfirmationPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const { session_id } = searchParams;

  if (!session_id) {
    redirect('/');
  }

  const { data: order, error } = await findOrderWithRetry(session_id);

  if (error || !order) {
    console.error("Fallo al obtener el pedido después de los reintentos:", error?.message);
    notFound();
  }

  let subtotal = 0;
  let totalImpuestos = 0;

  order.items_pedido.forEach(item => {
    const precioBase = item.precio_unitario || 0;
    const impuestoPorcentaje = item.productos_inventario?.porcentaje_impuesto ?? 0;
    
    const subtotalItem = item.cantidad * precioBase;
    const impuestoItem = subtotalItem * (impuestoPorcentaje / 100);

    subtotal += subtotalItem;
    totalImpuestos += impuestoItem;
  });

  const direccion = order.direccion_envio;
  const nombreCompleto = direccion.nombre_completo || `${direccion.nombre || ''} ${direccion.apellidos || ''}`.trim();

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
                const producto = item.productos_inventario;
                
                if (!producto) {
                  return (
                    <div key={index} className="flex items-center justify-between py-4">
                      <p className="text-sm text-red-600">Información de un producto no disponible.</p>
                    </div>
                  );
                }
                
                const precioFinalItem = item.precio_unitario * (1 + (producto.porcentaje_impuesto ?? 0) / 100);
                return (
                  <div key={index} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                        {producto.imagen_producto_principal && <Image src={producto.imagen_producto_principal} alt={producto.nombre} width={64} height={64} className="object-contain rounded-md"/>}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{producto.nombre}</p>
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
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impuestos (IGIC):</span>
                <span className="font-medium text-gray-900">{formatCurrency(totalImpuestos)}</span>
              </div>
               <div className="flex justify-between">
                <span className="text-gray-600">Envío:</span>
                <span className="font-medium text-gray-900">Gratis</span>
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
