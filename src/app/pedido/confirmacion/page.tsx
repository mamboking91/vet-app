// src/app/pedido/confirmacion/page.tsx

import { createClient } from '@supabase/supabase-js';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ProductImage from '@/components/ui/ProductImage';

// --- TIPOS DE DATOS CORREGIDOS ---
type ItemPedidoConDetalles = {
  cantidad: number;
  precio_unitario: number;
  producto_variantes: {
    productos_catalogo: {
        nombre: string;
        imagenes: string[] | null; // La imagen es un array de strings
    } | null;
  } | null;
};

type PedidoConfirmacion = {
  id: string;
  total: number;
  monto_descuento: number | null;
  codigo_descuento: string | null;
  direccion_envio: {
    nombre_completo?: string;
    direccion: string;
    localidad: string;
    provincia: string;
    codigo_postal: string;
  };
  email_cliente: string;
  factura: {
    subtotal: number;
    monto_impuesto: number;
    codigo_descuento: string | null; // Pedimos el código desde la factura
  } | null;
  items_pedido: ItemPedidoConDetalles[];
};

// --- LÓGICA DE OBTENCIÓN DE DATOS ---
async function findOrderWithRetry(sessionId: string, retries = 5, delay = 1500): Promise<PedidoConfirmacion | null> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (let i = 0; i < retries; i++) {
    // --- CONSULTA CORREGIDA Y FINAL ---
    const { data: orderData, error } = await supabaseAdmin
      .from('pedidos')
      .select(`
        id,
        total,
        monto_descuento,
        codigo_descuento,
        direccion_envio,
        email_cliente,
        factura:factura_id (
          subtotal,
          monto_impuesto,
          codigo_descuento
        ),
        items_pedido (
          cantidad,
          precio_unitario,
          producto_variantes (
            productos_catalogo ( 
              nombre,
              imagenes 
            )
          )
        )
      `)
      .eq('checkout_reference', sessionId)
      .single<PedidoConfirmacion>();

    if (orderData && orderData.items_pedido.length > 0) {
      return orderData;
    }
    
    if (error && error.code !== 'PGRST116') {
      console.error(`Intento ${i + 1}: Error al buscar pedido.`, error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return null;
}

// --- COMPONENTE DE PÁGINA ---
export default async function ConfirmationPage({ searchParams }: { searchParams: { session_id?: string } }) {
  if (!searchParams.session_id) {
    redirect('/');
  }

  const order = await findOrderWithRetry(searchParams.session_id);

  if (!order) {
    console.error("Fallo al obtener el pedido después de los reintentos para la sesión:", searchParams.session_id);
    notFound();
  }

  const { direccion_envio, factura, total, monto_descuento, email_cliente, items_pedido } = order;
  const nombreCompleto = direccion_envio.nombre_completo || 'Cliente';
  // Usamos el código de la factura, que es más fiable
  const codigoDescuentoFinal = factura?.codigo_descuento || order.codigo_descuento;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">¡Gracias por tu pedido, {nombreCompleto.split(' ')[0]}!</h1>
          <p className="mt-2 text-lg text-gray-600">Hemos recibido tu pedido y lo estamos preparando.</p>
          <p className="mt-1 text-sm text-gray-500">Número de pedido: <span className="font-medium text-gray-700">{order.id.substring(0, 8)}</span></p>
        </div>

        <Card className="shadow-lg">
          <CardHeader><CardTitle>Resumen de tu Compra</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200">
              {items_pedido.map((item, index) => {
                const variante = item.producto_variantes;
                const catalogo = variante?.productos_catalogo;
                if (!variante || !catalogo) return null;
                
                const totalItem = item.precio_unitario * item.cantidad;
                // --- CORRECCIÓN DE IMAGEN ---
                const imagenUrl = catalogo.imagenes?.[0] || '';

                return (
                  <div key={index} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                        <ProductImage 
                          src={imagenUrl} 
                          alt={catalogo.nombre}
                          width={64} 
                          height={64} 
                          className="object-cover rounded-md"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{catalogo.nombre}</p>
                        <p className="text-sm text-gray-500">Cantidad: {item.cantidad}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-800">{formatCurrency(totalItem)}</p>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm">
               <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(factura?.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impuestos (IGIC):</span>
                <span className="font-medium text-gray-900">{formatCurrency(factura?.monto_impuesto)}</span>
              </div>
              
              {monto_descuento && monto_descuento > 0 && (
                 <div className="flex justify-between text-green-600">
                    <span className="font-medium">
                      {/* --- CORRECCIÓN VISUAL DEL DESCUENTO --- */}
                      Descuento {codigoDescuentoFinal ? <span className="font-semibold uppercase">({codigoDescuentoFinal})</span> : ''}
                    </span>
                    <span className="font-medium">
                      -{formatCurrency(monto_descuento)}
                    </span>
                  </div>
              )}

              <div className="flex justify-between font-bold text-base pt-2 border-t mt-2">
                <span>Total Pagado:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t pt-6">
                <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Dirección de envío</h3>
                    <address className="not-italic text-sm text-gray-600">
                        {nombreCompleto}<br/>
                        {direccion_envio.direccion}<br/>
                        {direccion_envio.codigo_postal} {direccion_envio.localidad}, {direccion_envio.provincia}
                    </address>
                </div>
                 <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Información de contacto</h3>
                     <p className="text-sm text-gray-600">{email_cliente}</p>
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
