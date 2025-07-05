// src/app/cuenta/pedidos/[pedidoId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

// 1. Tipos de datos ajustados para que coincidan con la respuesta de Supabase
type Imagen = {
  url: string;
};

type ProductoCatalogo = {
  id: string;
  nombre: string;
  imagenes: Imagen[] | null;
  porcentaje_impuesto: number; // Se añade el impuesto para los cálculos
};

type ItemPedido = {
  id: string;
  cantidad: number;
  precio_unitario: number; // Este es el precio CON impuestos
  productos_catalogo: ProductoCatalogo | null; // La relación es con un solo producto
};

type DireccionEnvio = {
  nombre_completo?: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string;
};

type Order = {
  id: string;
  created_at: string;
  estado: string;
  total: number;
  direccion_envio: DireccionEnvio | null;
  items_pedido: ItemPedido[];
};

export default function DetallePedidoClientePage() {
  const params = useParams();
  const pedidoId = params.pedidoId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClientComponentClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("No estás autenticado.");
      setLoading(false);
      return;
    }

    // Consulta corregida para usar `!inner` y asegurar que `productos_catalogo` no sea un array
    const { data, error: dbError } = await supabase
      .from('pedidos')
      .select(
        `
        id, created_at, estado, total, direccion_envio,
        items_pedido!inner (
          id, cantidad, precio_unitario,
          productos_catalogo!inner ( id, nombre, imagenes, porcentaje_impuesto )
        )
      `
      )
      .eq('id', pedidoId)
      .eq('propietario_id', user.id)
      .single();

    if (dbError || !data) {
      setError("Pedido no encontrado o no tienes permiso para verlo.");
    } else {
      // ==================================================================
      // INICIO DE LA CORRECCIÓN
      // ==================================================================
      // Se usa 'as unknown as Order' para indicarle a TypeScript que confíe en la forma de los datos.
      setOrder(data as unknown as Order);
      // ==================================================================
      // FIN DE LA CORRECCIÓN
      // ==================================================================
    }
    setLoading(false);
  }, [pedidoId]);

  useEffect(() => {
    if (pedidoId) {
      fetchOrder();
    }
  }, [pedidoId, fetchOrder]);

  if (loading) {
    return <div className="text-center py-10">Cargando detalles del pedido...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Error al Cargar el Pedido</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button asChild className="mt-6">
          <Link href="/cuenta/pedidos">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Mis Pedidos
          </Link>
        </Button>
      </div>
    );
  }

  if (!order) {
    return null; 
  }

  const direccion = order.direccion_envio || {};

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'procesando': return { text: 'Procesando', color: 'bg-blue-100 text-blue-800' };
      case 'enviado': return { text: 'Enviado', color: 'bg-yellow-100 text-yellow-800' };
      case 'completado': return { text: 'Completado', color: 'bg-green-100 text-green-800' };
      case 'cancelado': return { text: 'Cancelado', color: 'bg-red-100 text-red-800' };
      case 'pendiente_pago': return { text: 'Pendiente de Pago', color: 'bg-orange-100 text-orange-800' };
      default: return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusInfo = getStatusInfo(order.estado);

  // Cálculos para el desglose de totales
  const subtotalGeneral = order.items_pedido.reduce((acc, item) => {
    const impuesto = item.productos_catalogo?.porcentaje_impuesto ?? 0;
    const precioBase = item.precio_unitario / (1 + impuesto / 100);
    return acc + (precioBase * item.cantidad);
  }, 0);
  const totalImpuestos = order.total - subtotalGeneral;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/cuenta/pedidos"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detalles del Pedido</h1>
          <p className="text-sm text-muted-foreground">
            Realizado el {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pedido #{order.id.split('-')[0].toUpperCase()}</CardTitle>
            <CardDescription>
              Un total de {formatCurrency(order.total)}
            </CardDescription>
          </div>
          <Badge className={`${statusInfo.color} px-3 py-1 text-sm`}>{statusInfo.text}</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cant.</TableHead>
                <TableHead className="text-right">Precio Base</TableHead>
                <TableHead className="text-right">% IGIC</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items_pedido.map((item) => {
                const producto = item.productos_catalogo;
                if (!producto) return null;

                const imagenUrl = producto.imagenes?.[0]?.url 
                  || 'https://placehold.co/64x64/e2e8f0/e2e8f0?text=Producto';
                
                // Cálculos correctos por línea de producto
                const impuesto = producto.porcentaje_impuesto ?? 0;
                const precioBase = item.precio_unitario / (1 + impuesto / 100);
                const subtotalLinea = precioBase * item.cantidad;

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Image
                          src={imagenUrl}
                          alt={producto.nombre}
                          width={64}
                          height={64}
                          className="rounded-md object-cover bg-gray-100"
                        />
                        <span className="font-medium">{producto.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{item.cantidad}</TableCell>
                    <TableCell className="text-right">{formatCurrency(precioBase)}</TableCell>
                    <TableCell className="text-right">{impuesto}%</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(subtotalLinea)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            {/* Footer de la tabla con el desglose de totales */}
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={3}></TableCell>
                    <TableCell className="text-right font-medium">Subtotal</TableCell>
                    <TableCell className="text-right">{formatCurrency(subtotalGeneral)}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan={3}></TableCell>
                    <TableCell className="text-right font-medium">IGIC</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalImpuestos)}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan={3}></TableCell>
                    <TableCell className="text-right font-bold text-lg">Total</TableCell>
                    <TableCell className="text-right font-bold text-lg">{formatCurrency(order.total)}</TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dirección de Envío</CardTitle>
        </CardHeader>
        <CardContent>
          <address className="not-italic text-muted-foreground">
            <p className="font-semibold text-primary">{direccion.nombre_completo}</p>
            <p>{direccion.direccion}</p>
            <p>{direccion.codigo_postal} {direccion.localidad}</p>
            <p>{direccion.provincia}</p>
          </address>
        </CardContent>
      </Card>
    </div>
  );
}
