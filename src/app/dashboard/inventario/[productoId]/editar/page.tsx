// app/dashboard/inventario/[productoId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ProductoCatalogoForm from '../../nuevo/ProductoCatalogoForm'; 
import type { 
  ProductoCatalogoFormData, 
  UnidadMedidaInventarioValue,
  ImpuestoItemValue,
  ProductoCatalogo as ProductoCatalogoDB // Tipo para datos de la BD
} from '../../types';

interface EditarProductoCatalogoPageProps {
  params: {
    productoId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function EditarProductoCatalogoPage({ params }: EditarProductoCatalogoPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { productoId } = params;

  if (!productoId || productoId.length !== 36) {
    console.error("[EditarProductoCatalogoPage] productoId es inválido:", productoId);
    notFound();
  }

  // 1. Obtener datos del producto del catálogo
  const { data: producto, error: productoDbError } = await supabase
    .from('productos_inventario')
    .select('id, nombre, descripcion, codigo_producto, unidad, stock_minimo, precio_compra, precio_venta, porcentaje_impuesto, requiere_lote, notas_internas')
    .eq('id', productoId)
    .single<ProductoCatalogoDB>(); // Usamos el tipo que refleja la tabla

  if (productoDbError || !producto) {
    console.error(`[EditarProductoCatalogoPage] Error fetching producto con ID ${productoId} o no encontrado:`, productoDbError);
    notFound();
  }
  
  let stockDelLoteGenerico = '0'; // Default como string para el formulario

  // 2. Si el producto NO requiere lote, obtener el stock de su lote genérico
  if (producto.requiere_lote === false) {
    const numeroLoteGenerico = `STOCK_UNICO_${producto.id.substring(0, 8)}`; // Debe coincidir con la acción
    const { data: loteGenerico, error: loteError } = await supabase
      .from('lotes_producto')
      .select('stock_lote')
      .eq('producto_id', producto.id)
      .eq('numero_lote', numeroLoteGenerico)
      .maybeSingle(); // Usamos maybeSingle ya que podría no existir si se creó antes de esta lógica

    if (loteError) {
      console.warn(`[EditarProductoCatalogoPage] Error fetching lote genérico para producto ${productoId}:`, loteError.message);
      // No hacemos notFound(), el formulario puede mostrar 0 si no se encuentra el lote genérico
    }
    if (loteGenerico && loteGenerico.stock_lote !== null) {
      stockDelLoteGenerico = loteGenerico.stock_lote.toString();
    }
  }
  
  // Preparamos initialData para ProductoCatalogoForm
  const initialDataForForm: Partial<ProductoCatalogoFormData> = {
    nombre: producto.nombre || '', 
    descripcion: producto.descripcion || '',
    codigo_producto: producto.codigo_producto || '',
    unidad: producto.unidad || 'Unidad', 
    stock_minimo: producto.stock_minimo?.toString() || '0',
    precio_compra: producto.precio_compra?.toString() || '',
    precio_venta: producto.precio_venta?.toString() || '', // Precio Base
    porcentaje_impuesto: producto.porcentaje_impuesto?.toString() as ImpuestoItemValue || "0",
    requiere_lote: producto.requiere_lote,
    notas_internas: producto.notas_internas || '',
    // Añadimos el stock del lote genérico a initialData si el producto no requiere lote
    stock_no_lote_valor: !producto.requiere_lote ? stockDelLoteGenerico : undefined,
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          {/* Enlaza de vuelta a la página de detalle del producto */}
          <Link href={`/dashboard/inventario/${productoId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Editar Producto del Catálogo: {producto.nombre}</h1>
      </div>
      <ProductoCatalogoForm 
        initialData={initialDataForForm}
        productoId={producto.id}
      />
    </div>
  );
}