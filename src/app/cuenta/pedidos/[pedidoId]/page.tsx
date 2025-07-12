// src/app/cuenta/pedidos/[pedidoId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle, PercentIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import ProductImage from '@/components/ui/ProductImage';
import { Separator } from '@/components/ui/separator';
import BuyAgainButton from './BuyAgainButton';

export type ItemPedido = {
  id: string;
  cantidad: number;
  precio_unitario: number;
  producto_variantes: {
    id: string;
    sku: string | null;
    imagen_url: string | null;
    stock_actual: number;
    atributos: Record<string, any> | null;
    productos_catalogo: {
        id: string;
        nombre: string;
        descripcion_publica: string | null;
        requiere_lote: boolean;
        en_tienda: boolean;
        destacado: boolean;
        porcentaje_impuesto: number;
        imagenes: { url: string; isPrimary: boolean; order: number; }[] | null;
    } | null;
  } | null;
};

type PedidoCompleto = {
  id: string;
  created_at: string;
  estado: string;
  total: number;
  subtotal: number;
  monto_impuesto: number;
  monto_descuento: number | null;
  codigo_descuento: string | null;
  tipo_descuento: 'porcentaje' | 'fijo' | null;
  valor_descuento: number | null;
  direccion_envio: {
    nombre_completo?: string;
    direccion?: string;
    localidad?: string;
    provincia?: string;
    codigo_postal?: string;
  } | null;
  items_pedido: ItemPedido[];
};

export default function DetallePedidoClientePage() {
  const params = useParams();
  const router = useRouter();
  const pedidoId = params.pedidoId as string;

  const [order, setOrder] = useState<PedidoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClientComponentClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error: dbError } = await supabase
      .from('pedidos')
      .select(`
        id, created_at, estado, total, monto_descuento, direccion_envio,
        codigo_descuento, tipo_descuento, valor_descuento,
        items_pedido (
          id, cantidad, precio_unitario,
          producto_variantes (
            id,
            sku,
            imagen_url,
            stock_actual,
            atributos, 
            productos_catalogo ( 
                id, nombre, descripcion_publica, requiere_lote, en_tienda, destacado, porcentaje_impuesto, imagenes
            )
          )
        )
      `)
      .eq('id', pedidoId)
      .eq('propietario_id', user.id)
      .single<PedidoCompleto>();

    if (dbError || !data) {
      setError("Pedido no encontrado o no tienes permiso para verlo.");
    } else {
      setOrder(data);
    }
    setLoading(false);
  }, [pedidoId, router]);

  useEffect(() => {
    if (pedidoId) {
      fetchOrder();
    }
  }, [pedidoId, fetchOrder]);

  if (loading) {
    return <div className="text-center py-10">Cargando detalles del pedido...</div>;
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Error al Cargar el Pedido</h2>
        <p className="text-muted-foreground">{error || "No se ha podido encontrar el pedido."}</p>
        <Button asChild className="mt-6">
          <Link href="/cuenta/pedidos">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Mis Pedidos
          </Link>
        </Button>
      </div>
    );
  }

  const direccion = order.direccion_envio || {};
  const statusInfo = { text: order.estado.replace('_', ' '), color: 'bg-blue-100 text-blue-800' };
  
  // --- INICIO DE LA CORRECCIÓN ---
  // Cálculo correcto del subtotal y los impuestos.
  const subtotal = order.items_pedido.reduce((acc, item) => {
    // El precio_unitario del item de pedido ya es el precio base (sin impuestos).
    return acc + (item.precio_unitario * item.cantidad);
  }, 0);
  
  const totalImpuestos = order.items_pedido.reduce((acc, item) => {
    const base = item.precio_unitario * item.cantidad;
    const tasa = item.producto_variantes?.productos_catalogo?.porcentaje_impuesto ?? 0;
    return acc + (base * (tasa / 100));
  }, 0);
  // --- FIN DE LA CORRECCIÓN ---

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
          <CardTitle>Pedido #{order.id.split('-')[0].toUpperCase()}</CardTitle>
          <Badge className={`${statusInfo.color} px-3 py-1 text-sm capitalize`}>{statusInfo.text}</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Cant.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items_pedido.map((item, index) => {
                const variante = item.producto_variantes;
                const catalogo = variante?.productos_catalogo;
                if (!variante || !catalogo) return null;
                const totalItem = item.precio_unitario * item.cantidad * (1 + (catalogo.porcentaje_impuesto / 100));
                const imagenUrl = variante.imagen_url || catalogo.imagenes?.[0]?.url || 'https://placehold.co/64x64/e2e8f0/e2e8f0?text=G';
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Image
                          src={imagenUrl}
                          alt={catalogo.nombre}
                          width={64}
                          height={64}
                          className="rounded-md object-cover bg-gray-100"
                        />
                        <span className="font-medium">{catalogo.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{item.cantidad}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(totalItem)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
                <TableRow><TableCell colSpan={2} className="text-right">Subtotal</TableCell><TableCell className="text-right">{formatCurrency(subtotal)}</TableCell></TableRow>
                <TableRow><TableCell colSpan={2} className="text-right">Impuestos (IGIC)</TableCell><TableCell className="text-right">{formatCurrency(totalImpuestos)}</TableCell></TableRow>
                
                {/* --- INICIO DE LA CORRECCIÓN --- */}
                {/* Condición explícita para evitar que se renderice el `0` */}
                {(order.monto_descuento ?? 0) > 0 && (
                    <TableRow className="text-green-600">
                        <TableCell colSpan={2} className="text-right font-medium">
                            Descuento ({order.codigo_descuento || 'N/A'})
                            {order.tipo_descuento === 'porcentaje' && ` - ${order.valor_descuento}%`}
                        </TableCell>
                        <TableCell className="text-right font-medium">-{formatCurrency(order.monto_descuento)}</TableCell>
                    </TableRow>
                )}
                {/* --- FIN DE LA CORRECCIÓN --- */}

                <TableRow className="font-bold text-lg"><TableCell colSpan={2} className="text-right">Total Pagado</TableCell><TableCell className="text-right">{formatCurrency(order.total)}</TableCell></TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
      
      <div className="mt-6 flex justify-end">
          <BuyAgainButton items={order.items_pedido} />
      </div>
    </div>
  );
}