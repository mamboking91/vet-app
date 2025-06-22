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
  ProductoCatalogo as ProductoCatalogoDB
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

  // 1. Obtener todos los datos del producto del catálogo
  const { data: producto, error: productoDbError } = await supabase
    .from('productos_inventario')
    .select('*') // Usamos '*' para asegurar que traemos todos los campos
    .eq('id', productoId)
    .single<ProductoCatalogoDB>();

  if (productoDbError || !producto) {
    console.error(`[EditarProductoCatalogoPage] Error fetching producto con ID ${productoId} o no encontrado:`, productoDbError);
    notFound();
  }
  
  let stockDelLoteGenerico = '0';

  // 2. Si el producto NO requiere lote, obtener el stock de su lote genérico
  if (producto.requiere_lote === false) {
    const numeroLoteGenerico = `STOCK_UNICO_${producto.id.substring(0, 8)}`;
    const { data: loteGenerico, error: loteError } = await supabase
      .from('lotes_producto')
      .select('stock_lote')
      .eq('producto_id', producto.id)
      .eq('numero_lote', numeroLoteGenerico)
      .maybeSingle();

    if (loteError) {
      console.warn(`[EditarProductoCatalogoPage] Error fetching lote genérico para producto ${productoId}:`, loteError.message);
    }
    if (loteGenerico && loteGenerico.stock_lote !== null) {
      stockDelLoteGenerico = loteGenerico.stock_lote.toString();
    }
  }
  
  // 3. Preparamos initialData para ProductoCatalogoForm
  // CORRECCIÓN: Convertimos explícitamente TODOS los campos que pueden ser `null` a un valor por defecto.
  const initialDataForForm: Partial<ProductoCatalogoFormData> = {
    ...producto,
    // --- Conversiones para evitar error de tipo `null` ---
    descripcion: producto.descripcion ?? '',
    codigo_producto: producto.codigo_producto ?? '',
    notas_internas: producto.notas_internas ?? '',
    descripcion_publica: producto.descripcion_publica ?? '',
    unidad: producto.unidad ?? '', // Corregido: `null` se convierte en `''`
    
    // --- Conversiones para campos numéricos a string ---
    stock_minimo: producto.stock_minimo?.toString() || '0',
    precio_compra: producto.precio_compra?.toString() || '',
    precio_venta: producto.precio_venta?.toString() || '',
    porcentaje_impuesto: producto.porcentaje_impuesto?.toString(),
    stock_no_lote_valor: !producto.requiere_lote ? stockDelLoteGenerico : undefined,

    // Aseguramos que los campos de array sean arrays vacíos si son null en la DB
    imagenes: producto.imagenes || [],
    categorias_tienda: producto.categorias_tienda || [],
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
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

