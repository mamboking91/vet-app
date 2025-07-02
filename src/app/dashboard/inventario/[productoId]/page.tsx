// app/dashboard/inventario/[productoId]/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, PlusCircle, Package, Edit3, FileText, Activity, Store, Star, ImageIcon, Layers, Info, Palette, Tag } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import type { 
  ProductoCatalogo, 
  ProductoVariante,
  MovimientoInventario
} from '../types'; 
import VariantesProductoTabla from './VariantesProductoTabla';
import MovimientosInventarioTable from './MovimientosInventarioTable';

// Tipo para los datos brutos que vienen de Supabase, incluyendo relaciones
type MovimientoCrudoDesdeSupabase = MovimientoInventario & {
  producto_variantes: { sku: string; atributos: Record<string, any> } | null;
  lotes_producto: { numero_lote: string } | null; // <-- CORRECCIÓN: Se añade la relación con lotes
};

// CORRECCIÓN: El tipo que pasamos al componente de la tabla ahora incluye ambas propiedades
export type MovimientoInventarioConDetallesVista = MovimientoInventario & {
  variante_display: string;
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

  const { data: producto, error: productoError } = await supabase
    .from('productos_catalogo')
    .select('*')
    .eq('id', productoId)
    .single<ProductoCatalogo>();

  if (productoError || !producto) {
    console.error("Error fetching producto catalog details or not found:", productoError);
    notFound();
  }

  const { data: variantes, error: variantesError } = await supabase
    .from('producto_variantes')
    .select('*')
    .eq('producto_id', productoId)
    .order('created_at', { ascending: true });
    
  // CORRECCIÓN: La consulta ahora también pide los detalles del lote
  const { data: movimientosData, error: movimientosError } = await supabase
    .from('movimientos_inventario')
    .select(`*, producto_variantes (sku, atributos), lotes_producto (numero_lote)`)
    .eq('producto_id', productoId)
    .order('fecha_movimiento', { ascending: false }); 

  const movimientosCrudos = (movimientosData || []) as MovimientoCrudoDesdeSupabase[];
  
  // CORRECCIÓN: El mapeo ahora crea ambas propiedades de display
  const movimientos: MovimientoInventarioConDetallesVista[] = movimientosCrudos.map(m => {
    let varianteDisplay = 'Variante eliminada';
    if (m.producto_variantes) {
        const atributos = m.producto_variantes.atributos;
        if (atributos && atributos.default !== 'default') {
            varianteDisplay = Object.values(atributos).join(' / ');
        } else {
            varianteDisplay = 'Variante única';
        }
    }

    const numeroLoteDisplay = m.lotes_producto?.numero_lote || 'Stock General';

    return {
        ...m,
        variante_display: varianteDisplay,
        numero_lote_display: numeroLoteDisplay,
    };
  });

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
              <p className="text-gray-600 mt-1">Gestión de producto y sus variantes</p>
            </div>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Link href={`/dashboard/inventario/${productoId}/editar`}>
                <Edit3 className="mr-2 h-4 w-4" />
                Editar Producto
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg py-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold"><Info className="h-5 w-5" />Información General del Producto</CardTitle>
                    <CardDescription className="text-blue-100">Datos principales del catálogo.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Package className="h-4 w-4 text-blue-600" />Tipo de Producto</div>
                            <p className="text-gray-900 font-semibold capitalize">{producto.tipo}</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Layers className="h-4 w-4 text-purple-600" />Gestión de Lotes</div>
                            <p className="text-gray-900">{producto.requiere_lote ? 'Sí, requiere lotes' : 'No, stock general'}</p>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><FileText className="h-4 w-4 text-green-600" />Descripción Pública</div>
                            <p className="text-gray-800 whitespace-pre-wrap">{producto.descripcion_publica || 'Sin descripción pública.'}</p>
                        </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-t-lg py-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold"><Store className="h-5 w-5" />Datos de la Tienda Online</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Store className="h-4 w-4 text-pink-500" />Visible en Tienda</div><p className="text-gray-900">{producto.en_tienda ? 'Sí' : 'No'}</p></div>
                        <div className="space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Star className="h-4 w-4 text-yellow-500" />Producto Destacado</div><p className="text-gray-900">{producto.destacado ? 'Sí' : 'No'}</p></div>
                        <div className="md:col-span-2 space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Tag className="h-4 w-4 text-cyan-600" />Categorías</div><div className="flex flex-wrap gap-2">{categorias.length > 0 ? categorias.map(cat => <Badge key={cat.nombre} variant="secondary">{cat.nombre}</Badge>) : <p className="text-gray-500">Ninguna</p>}</div></div>
                        <div className="md:col-span-2 space-y-2"><div className="flex items-center gap-2 text-sm font-medium text-gray-600"><ImageIcon className="h-4 w-4 text-indigo-600" />Imágenes</div><div className="flex flex-wrap gap-4">{imagenes.length > 0 ? imagenes.map(img => <a href={img.url} key={img.url} target="_blank" rel="noopener noreferrer"><Image src={img.url} alt="Imagen de producto" width={100} height={100} className="rounded-md border object-cover hover:scale-105 transition-transform" /></a>) : <p className="text-gray-500">Sin imágenes</p>}</div></div>
                    </div>
                  </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
                {/* Esta columna puede usarse para un resumen o acciones rápidas en el futuro */}
            </div>
        </div>

        {/* Nueva sección para Variantes */}
        <div className="mt-8">
             <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold"><Palette className="h-5 w-5" />Variantes del Producto</CardTitle>
                    {producto.tipo === 'variable' && (
                      <Button asChild size="sm" className="bg-white/20 hover:bg-white/30 text-white" variant="outline">
                        <Link href={`/dashboard/inventario/${productoId}/variantes/nueva`}>
                          <PlusCircle className="mr-2 h-4 w-4" />Añadir Variante
                        </Link>
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-purple-100">
                    {producto.tipo === 'simple' 
                      ? 'Este es un producto simple con una única variante por defecto.'
                      : 'Gestiona aquí las diferentes versiones de este producto.'}
                  </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                  {variantesError ? <p className="p-4 text-red-500 text-sm">Error al cargar las variantes.</p> : <VariantesProductoTabla variantes={variantes || []} productoPadre={producto} />}
              </CardContent>
            </Card>
        </div>

        <div className="mt-8">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg py-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold"><Activity className="h-5 w-5" />Historial de Movimientos</CardTitle>
                <CardDescription className="text-emerald-100">Registro de todos los movimientos para este producto y sus variantes.</CardDescription>
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
