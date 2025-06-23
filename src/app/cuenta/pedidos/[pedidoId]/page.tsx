import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import type { Pedido } from '@/app/dashboard/pedidos/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Tipos actualizados para el desglose de precios
type ItemPedido = {
  cantidad: number;
  precio_unitario: number; // Precio final
  productos_inventario: {
    nombre: string;
    imagenes: { url: string }[] | null;
    precio_venta: number | null; // Precio base
    porcentaje_impuesto: number | null;
  } | null;
};

type PedidoCompleto = Pedido & { items_pedido: ItemPedido[] };

interface DetallePedidoClienteProps {
  params: { pedidoId: string };
}

export default async function DetallePedidoClientePage({ params }: DetallePedidoClienteProps) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select(`*, items_pedido (*, productos_inventario (nombre, imagenes, precio_venta, porcentaje_impuesto))`)
    .eq('id', params.pedidoId)
    .eq('propietario_id', user.id)
    .single<PedidoCompleto>();

  if (error || !pedido) {
    notFound();
  }

  const direccion = pedido.direccion_envio;

  // --- CÁLCULO EXACTO DE SUBTOTAL E IMPUESTOS ---
  let orderSubtotal = 0;
  let orderTotalTax = 0;

  for (const item of pedido.items_pedido) {
    // Si no tenemos la info del producto, no podemos calcular, así que lo saltamos
    if (!item.productos_inventario || item.productos_inventario.precio_venta === null) {
        continue;
    }
    const basePrice = item.productos_inventario.precio_venta;
    const taxRate = item.productos_inventario.porcentaje_impuesto ?? 0;
    const itemSubtotal = item.cantidad * basePrice;
    const itemTax = itemSubtotal * (taxRate / 100);
    
    orderSubtotal += itemSubtotal;
    orderTotalTax += itemTax;
  }
  // --- FIN DEL CÁLCULO ---

  return (
    <div>
      <Button asChild variant="ghost" className="mb-4 -ml-4">
        <Link href="/cuenta/pedidos"><ChevronLeft className="mr-2 h-4 w-4"/> Volver a mis pedidos</Link>
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Detalles del Pedido #{pedido.id.substring(0, 8)}</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Realizado el {format(new Date(pedido.created_at), "dd 'de' MMMM 'de' LLLL", { locale: es })}
                </p>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-center">Cant.</TableHead>
                            <TableHead className="text-right">Precio Base</TableHead>
                            <TableHead className="text-right">% IGIC</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {pedido.items_pedido.map((item, index) => {
                        const producto = item.productos_inventario;
                        if (!producto) return null;

                        const precioBase = producto.precio_venta ?? 0;
                        const impuesto = producto.porcentaje_impuesto ?? 0;
                        const totalItem = item.cantidad * item.precio_unitario;

                        return (
                        <TableRow key={index}>
                            <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0">
                                {producto.imagenes?.[0] && <Image src={producto.imagenes[0].url} alt={producto.nombre} width={48} height={48} className="object-cover rounded-md"/>}
                                </div>
                                <span className="font-semibold text-gray-800">{producto.nombre}</span>
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

        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle>Resumen del Total</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {/* --- CÁLCULOS AHORA EXACTOS --- */}
                    <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>{formatCurrency(orderSubtotal)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-600">Impuestos (IGIC):</span>
                        <span>{formatCurrency(orderTotalTax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t mt-2">
                        <span>Total Pagado:</span>
                        <span>{formatCurrency(pedido.total)}</span>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Enviado a</CardTitle></CardHeader>
                <CardContent>
                    <address className="not-italic text-sm text-gray-600">
                        <p className="font-semibold text-gray-800">{direccion.nombre_completo}</p>
                        <p>{direccion.direccion}</p>
                        <p>{direccion.codigo_postal} {direccion.localidad}, {direccion.provincia}</p>
                    </address>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}