// app/dashboard/inventario/[productoId]/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, PlusCircle, PackageOpen, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
// Importamos todos los tipos necesarios desde el archivo centralizado
import type { 
  ProductoCatalogo, 
  LoteDeProducto, 
  UnidadMedidaInventarioValue,
  MovimientoInventario // Importa el tipo base MovimientoInventario
} from '../types'; 
import LotesProductoTabla from './LotesProductoTabla';
import MovimientosInventarioTable from './MovimientosInventarioTable';

// Tipo para la estructura que devuelve Supabase para movimientos (con lotes_producto como array)
type MovimientoCrudoDesdeSupabase = MovimientoInventario & {
  lotes_producto: { numero_lote: string; }[] | null; // 'lotes_producto' es un array o null
};

// Tipo final que usará MovimientosInventarioTable (con numero_lote aplanado)
export type MovimientoInventarioConDetallesVista = MovimientoInventario & {
  numero_lote_display: string; // Nombre del lote aplanado
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

  if (!productoId || productoId.length !== 36) { notFound(); }

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

  // 2. Obtener los lotes asociados (activos e inactivos)
  let lotes: LoteDeProducto[] = [];
  let lotesError = null;
  if (producto.requiere_lote) {
    const { data: lotesData, error: errLotes } = await supabase
      .from('lotes_producto')
      .select('id, producto_id, numero_lote, stock_lote, fecha_caducidad, fecha_entrada, esta_activo')
      .eq('producto_id', productoId)
      .order('esta_activo', { ascending: false })
      .order('fecha_caducidad', { ascending: true, nullsFirst: true })
      .order('fecha_entrada', { ascending: false });
    lotesError = errLotes;
    lotes = (lotesData || []) as LoteDeProducto[];
    if (lotesError) console.error(`Error fetching lotes para producto ${productoId}:`, lotesError);
  }
  
  // 3. Obtener el stock total calculado
  const { data: productoConStockCalculado, error: stockError } = await supabase
    .from('productos_inventario_con_stock')
    .select('stock_total_actual')
    .eq('id', productoId)
    .single();
  if (stockError) console.error(`Error fetching stock total para producto ${productoId}:`, stockError);
  const stockTotalActivo = productoConStockCalculado?.stock_total_actual ?? 0;

  // 4. Obtener los movimientos de inventario para este producto
  const { data: movimientosData, error: movimientosError } = await supabase
    .from('movimientos_inventario')
    .select(`
      id, 
      lote_id, 
      producto_id, 
      tipo_movimiento, 
      cantidad, 
      fecha_movimiento, 
      cita_id, 
      notas,
      lotes_producto (numero_lote) 
    `)
    .eq('producto_id', productoId)
    .order('fecha_movimiento', { ascending: false }); 

  if (movimientosError) {
    console.error(`Error fetching movimientos para producto ${productoId}:`, movimientosError);
  }

  // Hacemos un cast al tipo que refleja la estructura de Supabase
  const movimientosCrudos = (movimientosData || []) as MovimientoCrudoDesdeSupabase[];

  // Transformamos los datos para aplanar el numero_lote
  const movimientos: MovimientoInventarioConDetallesVista[] = movimientosCrudos.map(m => ({
    ...m, // Mantiene todos los campos de MovimientoInventario
    // Aplanar el numero_lote
    numero_lote_display: (m.lotes_producto && m.lotes_producto.length > 0 && m.lotes_producto[0]) 
                         ? m.lotes_producto[0].numero_lote 
                         : 'N/A',
  }));

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      {/* ... (Título y Botones de Acción de la Página) ... */}
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
        {/* ... (contenido como antes) ... */}
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
            <div><strong>Stock Total Activo:</strong> {stockTotalActivo}</div>
            {producto.notas_internas && <div className="md:col-span-full"><strong>Notas Internas:</strong> {producto.notas_internas}</div>}
        </CardContent>
      </Card>

      {/* Sección de Lotes */}
      {producto.requiere_lote && (
        <div className="mb-8">
          {/* ... (título y botón para añadir lote) ... */}
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
        </div>
      )}

      {/* Sección de Movimientos de Inventario */}
      <div className="mt-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-semibold">
            <History className="inline-block h-6 w-6 mr-2 align-text-bottom" />
            Historial de Movimientos de Stock
          </h2>
        </div>
        {movimientosError && <p className="text-red-500">Error al cargar los movimientos: {movimientosError.message}</p>}
        <MovimientosInventarioTable movimientos={movimientos} /> {/* Pasamos los movimientos transformados */}
      </div>
    </div>
  );
}