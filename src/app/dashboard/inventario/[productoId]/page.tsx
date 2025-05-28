// app/dashboard/inventario/[productoId]/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, PlusCircle, PackageOpen } from 'lucide-react';
// Importamos los tipos desde el archivo centralizado
import type { ProductoCatalogo, LoteDeProducto, UnidadMedidaInventarioValue } from '../types'; 
import LotesProductoTabla from './LotesProductoTabla';

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
    .select('id, nombre, descripcion, codigo_producto, unidad, stock_minimo, precio_venta, precio_compra, requiere_lote, notas_internas')
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
      .select('id, producto_id, numero_lote, stock_lote, fecha_caducidad, fecha_entrada')
      .eq('producto_id', productoId)
      .order('fecha_caducidad', { ascending: true, nullsFirst: false })
      .order('fecha_entrada', { ascending: true });
    
    lotesError = err;
    lotes = (lotesData || []) as LoteDeProducto[]; // Cast a LoteDeProducto[]
    if (lotesError) {
        console.error("Error fetching lotes del producto:", lotesError);
    }
  }
  
  const stockTotalCalculado = producto.requiere_lote 
    ? lotes.reduce((sum, lote) => sum + lote.stock_lote, 0)
    : null; 

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
          
          <LotesProductoTabla 
            lotes={lotes} 
            productoId={producto.id} 
            nombreProducto={producto.nombre}
            unidadProducto={producto.unidad} 
          />
        </>
      )}
    </div>
  );
}