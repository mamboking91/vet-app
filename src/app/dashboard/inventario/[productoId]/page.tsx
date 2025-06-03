// app/dashboard/inventario/[productoId]/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, PlusCircle, PackageOpen, History, Package, Edit3, BarChart2, Euro, Tag, FileText, Layers, Activity } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header con navegación */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200 rounded-lg"
            >
              <Link href="/dashboard/inventario">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {producto.nombre}
              </h1>
              <p className="text-gray-600 mt-1">Detalle del producto en inventario</p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Link href={`/dashboard/inventario/${productoId}/editar`}>
                <Edit3 className="mr-2 h-4 w-4" />
                Editar Catálogo
              </Link>
            </Button>
          </div>
        </div>

        {/* Tarjeta de Información General del Producto */}
        <Card className="mb-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg py-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Package className="h-5 w-5" />
              Información del Catálogo
            </CardTitle>
            <CardDescription className="text-blue-100">
              {producto.codigo_producto || 'Sin código asignado'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <FileText className="h-4 w-4 text-green-600" />
                  Descripción
                </div>
                <p className="text-gray-900">{producto.descripcion || 'Sin descripción'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Tag className="h-4 w-4 text-purple-600" />
                  Unidad de Medida
                </div>
                <p className="text-gray-900">{producto.unidad || 'No especificada'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Euro className="h-4 w-4 text-green-600" />
                  Precio de Venta
                </div>
                <p className="text-gray-900 font-semibold">
                  {producto.precio_venta ? `${Number(producto.precio_venta).toFixed(2)} €` : 'No definido'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <BarChart2 className="h-4 w-4 text-red-600" />
                  Stock Mínimo
                </div>
                <p className="text-gray-900">{producto.stock_minimo ?? 'No definido'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Layers className="h-4 w-4 text-amber-600" />
                  Gestión por Lotes
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${producto.requiere_lote ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <p className="text-gray-900">{producto.requiere_lote ? 'Sí' : 'No'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                  Stock Total Activo
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-blue-700">{stockTotalActivo}</p>
                  <span className="text-sm text-gray-500">({producto.unidad || 'u'})</span>
                </div>
              </div>

              {producto.notas_internas && (
                <div className="md:col-span-full space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <FileText className="h-4 w-4 text-amber-600" />
                    Notas Internas
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <p className="text-gray-900">{producto.notas_internas}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección de Lotes */}
        {producto.requiere_lote && (
          <div className="mb-8">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg py-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Layers className="h-5 w-5" />
                    Lotes del Producto
                  </CardTitle>
                  <Button
                    asChild
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 transition-all duration-200"
                    variant="outline"
                  >
                    <Link href={`/dashboard/inventario/${productoId}/lotes/nuevo`}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Registrar Entrada de Lote
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {lotesError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <PackageOpen className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-800 font-medium">Error al cargar los lotes</h4>
                      <p className="text-red-700 text-sm mt-1">{lotesError.message}</p>
                    </div>
                  </div>
                )}
                <LotesProductoTabla 
                  lotes={lotes} 
                  productoId={producto.id} 
                  nombreProducto={producto.nombre}
                  unidadProducto={producto.unidad}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sección de Movimientos de Inventario */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg py-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <History className="h-5 w-5" />
              Historial de Movimientos de Stock
            </CardTitle>
            <CardDescription className="text-emerald-100">
              Registro completo de entradas, salidas y ajustes de inventario
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {movimientosError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <Activity className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-800 font-medium">Error al cargar los movimientos</h4>
                  <p className="text-red-700 text-sm mt-1">{movimientosError.message}</p>
                </div>
              </div>
            )}
            <MovimientosInventarioTable movimientos={movimientos} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}