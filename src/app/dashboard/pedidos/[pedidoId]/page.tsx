// src/app/dashboard/pedidos/[pedidoId]/page.tsx
"use client";

import React, { useState, useTransition, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, User, Mail, Phone, Home, FileText, AlertTriangle, PercentIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Pedido, DireccionEnvio, EstadoPedido } from '@/app/dashboard/pedidos/types';
import UpdateOrderStatus from '@/app/dashboard/pedidos/UpdateOrderStatus';
import { formatCurrency } from '@/lib/utils';
import ProductImage from '@/components/ui/ProductImage';
import { Separator } from '@/components/ui/separator';

// Tipos corregidos para reflejar la estructura de la consulta
type ItemPedidoConDetalles = {
  cantidad: number;
  precio_unitario: number;
  producto_variantes: {
    id: string;
    sku: string | null;
    imagen_url: string | null;
    productos_catalogo: {
        id: string;
        nombre: string;
        porcentaje_impuesto: number;
    } | null;
  } | null;
};

// Se añaden los campos de descuento y propietario al tipo local
type PedidoCompleto = Pedido & {
  propietarios: {
    id: string;
    nombre_completo: string;
    email: string;
    telefono: string | null;
  } | null;
  items_pedido: ItemPedidoConDetalles[];
  monto_descuento: number | null;
  codigo_descuento: string | null;
  tipo_descuento: 'porcentaje' | 'fijo' | null;
  valor_descuento: number | null;
};

export default function PedidoDetallePage() {
  const router = useRouter();
  const params = useParams();
  const pedidoId = params.pedidoId as string;

  const [order, setOrder] = useState<PedidoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    const supabase = createClientComponentClient();
    
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        propietarios ( id, nombre_completo, email, telefono ),
        items_pedido (
          cantidad,
          precio_unitario,
          producto_variantes (
            id,
            sku,
            imagen_url,
            productos_catalogo ( id, nombre, porcentaje_impuesto )
          )
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
  
  const direccion: DireccionEnvio = order.direccion_envio || {};
  const nombreCliente = order.propietarios?.nombre_completo || direccion.nombre_completo || 'Cliente Invitado';
  const emailCliente = order.email_cliente || order.propietarios?.email || 'No disponible';
  const telefonoCliente = order.propietarios?.telefono || direccion.telefono || 'No disponible';

  const subtotal = order.items_pedido.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
  const totalImpuestos = order.items_pedido.reduce((acc, item) => {
    const base = item.precio_unitario * item.cantidad;
    const tasa = item.producto_variantes?.productos_catalogo?.porcentaje_impuesto ?? 0;
    return acc + (base * (tasa / 100));
  }, 0);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/pedidos"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-3xl font-bold">Detalle del Pedido #{order.id.substring(0, 8)}</h1>
        <Badge className={`ml-auto text-base px-4 py-1 capitalize ${getStatusColor(order.estado)}`}>{order.estado.replace('_', ' ')}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Items del Pedido</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="w-24 text-center">Cant.</TableHead><TableHead className="text-right">Precio Base</TableHead><TableHead className="text-right">% IGIC</TableHead><TableHead className="text-right">Total Item</TableHead></TableRow></TableHeader>
                <TableBody>
                  {order.items_pedido.map((item, index) => {
                    const variante = item.producto_variantes;
                    if (!variante || !variante.productos_catalogo) return <TableRow key={index}><TableCell colSpan={5}>Producto no disponible.</TableCell></TableRow>;
                    const precioBase = item.precio_unitario;
                    const impuesto = variante.productos_catalogo.porcentaje_impuesto ?? 0;
                    const totalItem = precioBase * item.cantidad * (1 + impuesto / 100);
                    return (<TableRow key={index}><TableCell><div className="flex items-center gap-3"><Link href={`/dashboard/inventario/${variante.productos_catalogo.id}`}><div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0"><ProductImage src={variante.imagen_url || ''} alt={variante.productos_catalogo.nombre} width={48} height={48} className="object-cover rounded-md"/></div></Link><Link href={`/dashboard/inventario/${variante.productos_catalogo.id}`} className="font-semibold text-gray-800 hover:underline">{variante.productos_catalogo.nombre}</Link></div></TableCell><TableCell className="text-center">{item.cantidad}</TableCell><TableCell className="text-right">{formatCurrency(precioBase)}</TableCell><TableCell className="text-right">{impuesto}%</TableCell><TableCell className="text-right font-semibold">{formatCurrency(totalItem)}</TableCell></TableRow>);
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
            <CardHeader><CardTitle>Datos del Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/><span>{nombreCliente}</span></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/><span>{emailCliente}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/><span>{telefonoCliente}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Dirección de Envío</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
                <div className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-muted-foreground mt-0.5"/>
                    <address className="not-italic">
                        {direccion.direccion || 'No especificada'}<br/>
                        {direccion.codigo_postal || ''} {direccion.localidad || ''}<br/>
                        {direccion.provincia || ''}
                    </address>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Resumen Financiero</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>

                {/* =====> INICIO DE LA CORRECCIÓN: Condición más estricta <===== */}
                {typeof order.monto_descuento === 'number' && order.monto_descuento > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span className="font-medium flex items-center gap-1">
                            <PercentIcon className="h-4 w-4" />
                            Descuento ({order.codigo_descuento || 'N/A'})
                        </span>
                        <span className="font-medium">-{formatCurrency(order.monto_descuento)}</span>
                    </div>
                )}
                {/* =====> FIN DE LA CORRECCIÓN <===== */}

                <div className="flex justify-between">
                    <span className="text-muted-foreground">Impuestos (IGIC)</span>
                    <span>{formatCurrency(totalImpuestos)}</span>
                </div>
              
                <Separator className="my-2" />

                <div className="flex justify-between font-bold text-lg">
                    <span>Total Pagado:</span>
                    <span>{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-muted-foreground">Factura:</span>
                    {order.factura_id ? <Link href={`/dashboard/facturacion/${order.factura_id}`} className="text-blue-600 hover:underline flex items-center gap-1">Ver Factura <FileText className="h-4 w-4"/></Link> : <span className="text-gray-500">No generada</span>}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
