// app/dashboard/inventario/[productoId]/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { ChevronLeft, PlusCircle, PackageOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
// Asumimos que tienes tipos definidos en types.ts
import type { UnidadMedidaInventarioValue } from '../types'; 

// Tipo para un producto del catálogo (datos base)
type ProductoCatalogo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  codigo_producto: string | null;
  unidad: UnidadMedidaInventarioValue | null;
  stock_minimo: number | null;
  precio_venta: number | null;
  requiere_lote: boolean;
  notas_internas: string | null;
};

// Tipo para un lote de producto
type LoteDeProducto = {
  id: string;
  numero_lote: string;
  stock_lote: number;
  fecha_caducidad: string | null; // Viene como string ISO de la BD
  fecha_entrada: string; // Viene como string ISO de la BD
};

interface DetalleProductoPageProps {
  params: {
    productoId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function DetalleProductoPage({ params }: DetalleProductoPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { productoId } = params;

  if (!productoId || productoId.length !== 36) { // Simple validación de UUID
    notFound();
  }

  // 1. Obtener datos del producto del catálogo
  const { data: productoData, error: productoError } = await supabase
    .from('productos_inventario')
    .select('id, nombre, descripcion, codigo_producto, unidad, stock_minimo, precio_venta, requiere_lote, notas_internas')
    .eq('id', productoId)
    .single<ProductoCatalogo>();

  if (productoError || !productoData) {
    console.error("Error fetching producto catalog details or not found:", productoError);
    notFound();
  }
  const producto = productoData;

  // 2. Obtener los lotes asociados a este producto
  let lotes: LoteDeProducto[] = [];
  let lotesError = null;
  if (producto.requiere_lote) {
    const { data: lotesData, error: err } = await supabase
      .from('lotes_producto')
      .select('id, numero_lote, stock_lote, fecha_caducidad, fecha_entrada')
      .eq('producto_id', productoId)
      .order('fecha_caducidad', { ascending: true, nullsFirst: false }) // Lotes más próximos a caducar primero
      .order('fecha_entrada', { ascending: true });

    lotesError = err;
    lotes = (lotesData || []) as LoteDeProducto[];
    if (lotesError) {
        console.error("Error fetching lotes del producto:", lotesError);
        // No hacemos notFound(), la página del producto puede mostrarse sin lotes o con un error
    }
  }

  const stockTotalCalculado = producto.requiere_lote 
    ? lotes.reduce((sum, lote) => sum + lote.stock_lote, 0)
    : null; // O podrías tener un campo 'stock_no_loteado' en productos_inventario

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/inventario">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold truncate" title={producto.nombre}>
          Detalle Producto: {producto.nombre}
        </h1>
        <Button asChild className="ml-auto">
          <Link href={`/dashboard/inventario/${productoId}/editar`}>
            Editar Catálogo
          </Link>
        </Button>
      </div>

      {/* Tarjeta de Información General del Producto */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Información del Catálogo</CardTitle>
          <CardDescription>{producto.codigo_producto || 'Sin código'}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div><strong>Descripción:</strong> {producto.descripcion || 'N/A'}</div>
          <div><strong>Unidad:</strong> {producto.unidad || 'N/A'}</div>
          <div><strong>Precio Venta:</strong> {producto.precio_venta ? `${Number(producto.precio_venta).toFixed(2)} €` : 'N/A'}</div>
          <div><strong>Stock Mínimo:</strong> {producto.stock_minimo ?? 'N/A'}</div>
          <div><strong>Requiere Lote:</strong> {producto.requiere_lote ? 'Sí' : 'No'}</div>
          {stockTotalCalculado !== null && (
             <div><strong>Stock Total (Lotes):</strong> {stockTotalCalculado}</div>
          )}
          {producto.notas_internas && <div className="md:col-span-full"><strong>Notas Internas:</strong> {producto.notas_internas}</div>}
        </CardContent>
      </Card>

      {/* Sección de Lotes (solo si el producto requiere lote) */}
      {producto.requiere_lote && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-semibold">Lotes del Producto</h2>
            <Button asChild>
              <Link href={`/dashboard/inventario/${productoId}/lotes/nuevo`}> 
                <PlusCircle className="mr-2 h-4 w-4" /> Registrar Entrada de Lote
              </Link>
            </Button>
          </div>

          {lotesError && <p className="text-red-500">Error al cargar los lotes: {lotesError.message}</p>}

          {lotes.length === 0 && !lotesError && (
            <Card className="flex flex-col items-center justify-center p-6 border-dashed">
                <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Este producto no tiene lotes registrados.</p>
                <p className="text-xs text-muted-foreground mb-4">Registra una entrada para empezar a controlar el stock por lotes.</p>
                 <Button asChild size="sm">
                    <Link href={`/dashboard/inventario/${productoId}/lotes/nuevo`}> 
                        Registrar Primer Lote
                    </Link>
                </Button>
            </Card>
          )}

          {lotes.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableCaption className="mt-4 py-4">Lotes disponibles para {producto.nombre}.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Lote</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead>Fecha Entrada</TableHead>
                      <TableHead>Fecha Caducidad</TableHead>
                      {/* <TableHead className="text-right">Acciones</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotes.map((lote) => (
                      <TableRow key={lote.id}>
                        <TableCell className="font-medium">{lote.numero_lote}</TableCell>
                        <TableCell className="text-center">{lote.stock_lote}</TableCell>
                        <TableCell>{format(parseISO(lote.fecha_entrada), 'PPP', { locale: es })}</TableCell>
                        <TableCell>
                          {lote.fecha_caducidad 
                            ? format(parseISO(lote.fecha_caducidad), 'PPP', { locale: es }) 
                            : '-'}
                        </TableCell>
                        {/* <TableCell className="text-right">
                          <Button variant="outline" size="sm">Ajustar</Button>
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}