// app/dashboard/inventario/[productoId]/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, PlusCircle, PackageOpen, History, Package, Edit3, BarChart2, Euro, Tag, FileText, Layers, Activity, Store, Star, ImageIcon } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { 
  ProductoCatalogo, 
  LoteDeProducto,
  MovimientoInventario
} from '../types'; 
import LotesProductoTabla from './LotesProductoTabla';
import MovimientosInventarioTable from './MovimientosInventarioTable';

type MovimientoCrudoDesdeSupabase = MovimientoInventario & {
  lotes_producto: { numero_lote: string; }[] | null;
};

export type MovimientoInventarioConDetallesVista = MovimientoInventario & {
  numero_lote_display: string;
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

  // 1. Obtener datos del producto del catálogo, incluyendo los nuevos campos de e-commerce
  const { data: productoData, error: productoError } = await supabase
    .from('productos_inventario')
    .select('*')
    .eq('id', productoId)
    .single<ProductoCatalogo>();

  if (productoError || !productoData) {
    console.error("Error fetching producto catalog details or not found:", productoError);
    notFound();
  }
  const producto = productoData;

  // 2. Obtener los lotes asociados
  let lotes: LoteDeProducto[] = [];
  let lotesError = null;
  if (producto.requiere_lote) {
    const { data: lotesData, error: errLotes } = await supabase
      .from('lotes_producto')
      .select('id, producto_id, numero_lote, stock_lote, fecha_caducidad, fecha_entrada, esta_activo')
      .eq('producto_id', productoId)
      .order('esta_activo', { ascending: false })
      .order('fecha_caducidad', { ascending: true, nullsFirst: true });
    lotesError = errLotes;
    lotes = (lotesData || []) as LoteDeProducto[];
  }
  
  // 3. Obtener el stock total calculado
  const { data: productoConStockCalculado, error: stockError } = await supabase
    .from('productos_inventario_con_stock')
    .select('stock_total_actual')
    .eq('id', productoId)
    .single();
  const stockTotalActivo = productoConStockCalculado?.stock_total_actual ?? 0;

  // 4. Obtener los movimientos de inventario
  const { data: movimientosData, error: movimientosError } = await supabase
    .from('movimientos_inventario')
    .select(`*, lotes_producto (numero_lote)`)
    .eq('producto_id', productoId)
    .order('fecha_movimiento', { ascending: false }); 

  const movimientosCrudos = (movimientosData || []) as MovimientoCrudoDesdeSupabase[];
  const movimientos: MovimientoInventarioConDetallesVista[] = movimientosCrudos.map(m => ({
    ...m,
    numero_lote_display: (m.lotes_producto && m.lotes_producto.length > 0 && m.lotes_producto[0]) 
                         ? m.lotes_producto[0].numero_lote 
                         : 'N/A',
  }));

  const categorias = (Array.isArray(producto.categorias_tienda) ? producto.categorias_tienda : []) as { nombre: string }[];
  const imagenes = (Array.isArray(producto.imagenes) ? producto.imagenes.sort((a, b) => a.order - b.order) : []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" asChild className="text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200 rounded-lg">
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
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Link href={`/dashboard/inventario/${productoId}/editar`}>
                <Edit3 className="mr-2 h-4 w-4" />
                Editar Catálogo
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg py-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold"><Package className="h-5 w-5" />Información del Catálogo</CardTitle>
                    <CardDescription className="text-blue-100">{producto.codigo_producto || 'Sin código asignado'}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><FileText className="h-4 w-4 text-green-600" />Descripción Interna</div><p className="text-gray-900">{producto.descripcion || 'Sin descripción'}</p></div>
                        <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Tag className="h-4 w-4 text-purple-600" />Unidad de Medida</div><p className="text-gray-900">{producto.unidad || 'No especificada'}</p></div>
                        <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Euro className="h-4 w-4 text-green-600" />Precio de Venta</div><p className="text-gray-900 font-semibold">{producto.precio_venta ? `${Number(producto.precio_venta).toFixed(2)} €` : 'No definido'}</p></div>
                        <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><BarChart2 className="h-4 w-4 text-red-600" />Stock Mínimo</div><p className="text-gray-900">{producto.stock_minimo ?? 'No definido'}</p></div>
                        {producto.notas_internas && (<div className="md:col-span-full space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><FileText className="h-4 w-4 text-amber-600" />Notas Internas</div><div className="bg-amber-50 p-3 rounded-lg border border-amber-200"><p className="text-gray-900">{producto.notas_internas}</p></div></div>)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-t-lg py-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold"><Store className="h-5 w-5" />Datos de la Tienda Online</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Star className="h-4 w-4 text-yellow-500" />Producto Destacado</div><p className="text-gray-900">{producto.destacado ? 'Sí' : 'No'}</p></div>
                        <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Tag className="h-4 w-4 text-cyan-600" />Categorías</div><div className="flex flex-wrap gap-2">{categorias.length > 0 ? categorias.map(cat => <Badge key={cat.nombre} variant="secondary">{cat.nombre}</Badge>) : <p className="text-gray-500">Ninguna</p>}</div></div>
                        <div className="md:col-span-2 space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><FileText className="h-4 w-4 text-pink-600" />Descripción Pública</div><p className="text-gray-900 whitespace-pre-wrap">{producto.descripcion_publica || 'Sin descripción pública'}</p></div>
                        <div className="md:col-span-2 space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><ImageIcon className="h-4 w-4 text-indigo-600" />Imágenes</div><div className="flex flex-wrap gap-4">{imagenes.length > 0 ? imagenes.map(img => <a href={img.url} key={img.url} target="_blank" rel="noopener noreferrer"><Image src={img.url} alt="Imagen de producto" width={100} height={100} className="rounded-md border object-cover hover:scale-105 transition-transform" /></a>) : <p className="text-gray-500">Sin imágenes</p>}</div></div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-8">
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg py-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold"><BarChart2 className="h-5 w-5" />Resumen de Stock</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-600">Stock Total Activo:</span><span className="text-2xl font-bold text-blue-700">{stockTotalActivo}</span></div>
                        <div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-600">Unidad:</span><Badge variant="outline">{producto.unidad || 'N/A'}</Badge></div>
                        <div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-600">Gestión por Lotes:</span><Badge variant={producto.requiere_lote ? "default" : "secondary"}>{producto.requiere_lote ? 'Sí' : 'No'}</Badge></div>
                        <div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-600">Visibilidad en Tienda:</span><Badge variant={producto.en_tienda ? "default" : "destructive"}>{producto.en_tienda ? 'Visible' : 'Oculto'}</Badge></div>
                    </CardContent>
                </Card>

                {producto.requiere_lote && (
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg py-4">
                          <div className="flex justify-between items-center"><CardTitle className="flex items-center gap-2 text-lg font-semibold"><Layers className="h-5 w-5" />Lotes del Producto</CardTitle><Button asChild size="sm" className="bg-white/20 hover:bg-white/30 text-white" variant="outline"><Link href={`/dashboard/inventario/${productoId}/lotes/nuevo`}><PlusCircle className="mr-2 h-4 w-4" />Nuevo Lote</Link></Button></div>
                      </CardHeader>
                      <CardContent className="p-0">
                          {lotesError ? <p className="p-4 text-red-500 text-sm">Error al cargar lotes.</p> : <LotesProductoTabla lotes={lotes} productoId={producto.id} nombreProducto={producto.nombre} unidadProducto={producto.unidad} />}
                      </CardContent>
                    </Card>
                )}
            </div>
        </div>

        <div className="mt-8">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg py-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold"><History className="h-5 w-5" />Historial de Movimientos</CardTitle>
                <CardDescription className="text-emerald-100">Registro completo de entradas, salidas y ajustes</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                  {movimientosError ? <p className="p-4 text-red-500 text-sm">Error al cargar movimientos.</p> : <MovimientosInventarioTable movimientos={movimientos} />}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
