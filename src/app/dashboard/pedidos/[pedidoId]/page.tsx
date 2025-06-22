// app/dashboard/pedidos/[pedidoId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, User, Ghost, Phone, Mail, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Pedido, DireccionEnvio, EstadoPedido } from '@/app/dashboard/pedidos/types';
import UpdateOrderStatus from '@/app/dashboard/pedidos/UpdateOrderStatus';

// Tipos de datos para el pedido
type ItemPedidoConProducto = {
  cantidad: number;
  precio_unitario: number;
  productos_inventario: {
    id: string;
    nombre: string;
    imagenes: { url: string; isPrimary: boolean; order: number }[] | null;
  } | null;
};

type PedidoCompleto = Pedido & {
  propietarios: {
    id: string;
    nombre_completo: string;
  } | null;
  items_pedido: ItemPedidoConProducto[];
};

interface PedidoDetallePageProps {
  params: {
    pedidoId: string;
  };
}

const getStatusColor = (status: EstadoPedido) => {
  switch (status) {
    case 'procesando': return 'bg-blue-100 text-blue-800';
    case 'enviado': return 'bg-yellow-100 text-yellow-800';
    case 'completado': return 'bg-green-100 text-green-800';
    case 'cancelado': return 'bg-red-100 text-red-800';
    case 'pendiente_pago': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default async function PedidoDetallePage({ params }: PedidoDetallePageProps) {
  const { pedidoId } = params;
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: order, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      propietarios ( id, nombre_completo ),
      items_pedido (
        cantidad,
        precio_unitario,
        productos_inventario ( id, nombre, imagenes )
      )
    `)
    .eq('id', pedidoId)
    .single<PedidoCompleto>();
  
  if (error || !order) {
    notFound();
  }
  
  // CORRECCIÓN: Se añade un objeto por defecto para 'direccion_envio' si es null
  const direccion = order.direccion_envio || {};
  
  const nombreCliente = order.propietarios?.nombre_completo 
                      || direccion.nombre_completo 
                      || `${direccion.nombre || ''} ${direccion.apellidos || ''}`.trim()
                      || 'Cliente Invitado';

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/pedidos">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Detalle del Pedido</h1>
        <Badge className={`ml-auto text-base px-4 py-1 capitalize ${getStatusColor(order.estado)}`}>
          {order.estado.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Items del Pedido</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y divide-gray-200">
                {order.items_pedido.map((item, index) => {
                  const producto = item.productos_inventario;
                  if (!producto) return <li key={index} className="py-3">Producto no disponible.</li>;
                  const primaryImage = producto.imagenes?.find(img => img.isPrimary) || producto.imagenes?.[0];

                  return (
                    <li key={index} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <Link href={`/dashboard/inventario/${producto.id}`}>
                          <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                            {primaryImage && <Image src={primaryImage.url} alt={producto.nombre} width={64} height={64} className="object-cover rounded-md"/>}
                          </div>
                        </Link>
                        <div>
                          <p className="font-semibold text-gray-800">{producto.nombre}</p>
                          <p className="text-sm text-gray-500">{item.cantidad} x {Number(item.precio_unitario).toFixed(2)} €</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-800">{(item.cantidad * Number(item.precio_unitario)).toFixed(2)} €</p>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Actualizar Estado</CardTitle></CardHeader>
            <CardContent>
              <UpdateOrderStatus pedidoId={order.id} currentStatus={order.estado} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Resumen Financiero</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Total:</span><span className="font-medium text-gray-900">{order.total.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Factura:</span>
                {order.factura_id ? <Link href={`/dashboard/facturacion/${order.factura_id}`} className="text-blue-600 hover:underline flex items-center gap-1">Ver Factura <FileText className="h-4 w-4"/></Link> : <span className="text-gray-500">No generada</span>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Información del Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                    {order.propietario_id ? <User className="h-5 w-5 text-blue-500"/> : <Ghost className="h-5 w-5 text-gray-400"/>}
                    <div className="font-semibold">{nombreCliente}</div>
                    {order.propietario_id && <Button asChild size="sm" variant="outline"><Link href={`/dashboard/propietarios/${order.propietario_id}`}>Ver Ficha</Link></Button>}
                </div>
                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-gray-400"/><a href={`mailto:${order.email_cliente}`} className="text-blue-600 hover:underline">{order.email_cliente}</a></div>
                {/* CORRECCIÓN: Se usa encadenamiento opcional para acceder a 'telefono' de forma segura */}
                {direccion?.telefono && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-gray-400"/><span>{direccion.telefono}</span></div>}
            </CardContent>
          </Card>
           <Card>
            <CardHeader><CardTitle>Dirección de Envío</CardTitle></CardHeader>
            <CardContent>
                <address className="not-italic text-sm text-gray-600">
                    {direccion?.direccion}<br/>
                    {direccion?.codigo_postal} {direccion?.localidad}<br/>
                    {direccion?.provincia}
                </address>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
