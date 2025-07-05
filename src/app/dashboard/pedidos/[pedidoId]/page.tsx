// src/app/dashboard/pedidos/[pedidoId]/page.tsx
"use client";

import React, { useState, useTransition, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, User, Ghost, Phone, Mail, FileText, XCircle, AlertTriangle, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Pedido, DireccionEnvio, EstadoPedido } from '@/app/dashboard/pedidos/types';
import UpdateOrderStatus from '@/app/dashboard/pedidos/UpdateOrderStatus';
import { cancelarPedido } from '@/app/dashboard/pedidos/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

// ==================================================================
// INICIO DE LA CORRECCIÓN
// ==================================================================

// 1. Se corrige el tipo para que refleje la relación real con `productos_catalogo`
type ItemPedidoConProducto = {
  cantidad: number;
  precio_unitario: number;
  productos_catalogo: { // <- Cambio de `productos_inventario` a `productos_catalogo`
    id: string;
    nombre: string;
    imagenes: { url: string; isPrimary: boolean; order: number }[] | null;
    precio_venta: number | null;
    porcentaje_impuesto: number | null;
  } | null;
};

type PedidoCompleto = Pedido & {
  propietarios: {
    id: string;
    nombre_completo: string;
  } | null;
  items_pedido: ItemPedidoConProducto[];
};

export default function PedidoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const pedidoId = params.pedidoId as string;

  const [order, setOrder] = useState<PedidoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isCancelling, startCancellingTransition] = useTransition();

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    const supabase = createClientComponentClient();
    
    // 2. Se corrige la consulta para que use la tabla correcta (`productos_catalogo`)
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        propietarios ( id, nombre_completo ),
        items_pedido (
          cantidad,
          precio_unitario,
          productos_catalogo ( id, nombre, imagenes, precio_venta, porcentaje_impuesto )
        )
      `)
      .eq('id', pedidoId)
      .single<PedidoCompleto>();
    
    if (error || !data) {
      setPageError("Pedido no encontrado o error al cargar: " + (error?.message || ""));
      setOrder(null);
    } else {
      setOrder(data);
      setPageError(null);
    }
    setLoading(false);
  }, [pedidoId]);

  useEffect(() => {
    if (pedidoId) {
      fetchOrder();
    }
  }, [pedidoId, fetchOrder]);

  // ==================================================================
  // FIN DE LA CORRECCIÓN (El resto del código permanece igual)
  // ==================================================================

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

  const handleCancelOrder = async () => {
    if (!order) return;
    startCancellingTransition(async () => {
      const result = await cancelarPedido(order.id);
      if (result.success) {
        toast.success(result.message);
        fetchOrder();
      } else {
        toast.error(result.error?.message || "No se pudo cancelar el pedido.");
      }
    });
  };

  const handleEditOrder = () => {
    if (!order) {
      toast.error("No se puede editar un pedido que no se ha cargado.");
      return;
    }
    router.push(`/dashboard/pedidos/${order.id}/editar`);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando detalles del pedido...</div>;
  }

  if (pageError || !order) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al Cargar Pedido</h2>
        <p className="text-muted-foreground mb-6">{pageError || "El pedido solicitado no pudo ser cargado."}</p>
        <Button asChild variant="outline">
            <Link href="/dashboard/pedidos">Volver a la Lista de Pedidos</Link>
        </Button>
      </div>
    );
  }
  
  const direccion = order.direccion_envio || {};
  const nombreCliente = order.propietarios?.nombre_completo || direccion.nombre_completo || `${direccion.nombre || ''} ${direccion.apellidos || ''}`.trim() || 'Cliente Invitado';

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/pedidos"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-3xl font-bold">Detalle del Pedido</h1>
        <Badge className={`ml-auto text-base px-4 py-1 capitalize ${getStatusColor(order.estado)}`}>{order.estado.replace('_', ' ')}</Badge>
        {(order.estado === 'procesando' || order.estado === 'pendiente_pago') && (
            <Button variant="outline" size="sm" onClick={handleEditOrder} disabled={isCancelling}><Edit3 className="mr-2 h-4 w-4" /> Editar Pedido</Button>
        )}
        {(order.estado !== 'cancelado' && order.estado !== 'completado') && (
            <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={isCancelling}><XCircle className="mr-2 h-4 w-4" /> Cancelar Pedido</Button></AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> ¿Estás seguro de cancelar este pedido?</AlertDialogTitle><AlertDialogDescription>Esta acción marcará el pedido como "Cancelado" y el stock de los productos se repondrá. Esta acción no se puede deshacer.<br/><p className="mt-2 text-sm font-semibold">Pedido Nº: {order.id.substring(0,8)}</p><p className="mt-1 text-sm font-semibold">Cliente: {nombreCliente}</p></AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel disabled={isCancelling}>No, mantener</AlertDialogCancel><AlertDialogAction onClick={handleCancelOrder} disabled={isCancelling} className="bg-destructive hover:bg-destructive/90">{isCancelling ? "Cancelando..." : "Sí, cancelar"}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Items del Pedido</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="w-24 text-center">Cant.</TableHead>
                    <TableHead className="text-right">Precio Base</TableHead>
                    <TableHead className="text-right">% IGIC</TableHead>
                    <TableHead className="text-right">Total Item</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items_pedido.map((item, index) => {
                    // 3. Se corrige la referencia para obtener los datos del producto
                    const producto = item.productos_catalogo;
                    if (!producto) return <TableRow key={index}><TableCell colSpan={5}>Producto no disponible.</TableCell></TableRow>;
                    const precioBase = producto.precio_venta ?? 0;
                    const impuesto = producto.porcentaje_impuesto ?? 0;
                    const totalItem = item.cantidad * item.precio_unitario;

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Link href={`/dashboard/inventario/${producto.id}`}>
                              <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0">
                                {producto.imagenes?.[0] && <Image src={producto.imagenes[0].url} alt={producto.nombre} width={48} height={48} className="object-cover rounded-md"/>}
                              </div>
                            </Link>
                             <Link href={`/dashboard/inventario/${producto.id}`} className="font-semibold text-gray-800 hover:underline">{producto.nombre}</Link>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.cantidad}</TableCell>
                        <TableCell className="text-right">{formatCurrency(precioBase)}</TableCell>
                        <TableCell className="text-right">{impuesto}%</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(totalItem)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Actualizar Estado</CardTitle></CardHeader>
            <CardContent>
              {(order.estado !== 'cancelado' && order.estado !== 'completado') ? (<UpdateOrderStatus pedidoId={order.id} currentStatus={order.estado} onStatusUpdate={fetchOrder} />) : (<Badge className={`w-full text-base py-2 text-center capitalize ${getStatusColor(order.estado)}`}>{order.estado.replace('_', ' ')}</Badge>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Resumen Financiero</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between font-bold text-lg"><span className="text-gray-600">Total:</span><span className="font-medium text-gray-900">{formatCurrency(order.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Factura:</span>
                {order.factura_id ? <Link href={`/dashboard/facturacion/${order.factura_id}`} className="text-blue-600 hover:underline flex items-center gap-1">Ver Factura <FileText className="h-4 w-4"/></Link> : <span className="text-gray-500">No generada</span>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Información del Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3">{order.propietario_id ? <User className="h-5 w-5 text-blue-500"/> : <Ghost className="h-5 w-5 text-gray-400"/>}<div className="font-semibold">{nombreCliente}</div>{order.propietario_id && <Button asChild size="sm" variant="outline"><Link href={`/dashboard/propietarios/${order.propietario_id}`}>Ver Ficha</Link></Button>}</div>
                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-gray-400"/><a href={`mailto:${order.email_cliente}`} className="text-blue-600 hover:underline">{order.email_cliente}</a></div>
                {direccion?.telefono && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-gray-400"/><span>{direccion.telefono}</span></div>}
            </CardContent>
          </Card>
           <Card>
            <CardHeader><CardTitle>Dirección de Envío</CardTitle></CardHeader>
            <CardContent><address className="not-italic text-sm text-gray-600">{direccion?.direccion && <span>{direccion.direccion}<br/></span>}{(direccion?.codigo_postal || direccion?.localidad) && <span>{direccion.codigo_postal} {direccion.localidad}<br/></span>}{direccion?.provincia && <span>{direccion.provincia}</span>}</address></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
