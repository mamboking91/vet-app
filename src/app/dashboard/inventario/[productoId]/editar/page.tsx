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
  ProductoCatalogo as ProductoCatalogoDB,
  ProductoVariante
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

  // 1. Obtener los datos del producto principal desde 'productos_catalogo'
  const { data: producto, error: productoDbError } = await supabase
    .from('productos_catalogo')
    .select('*')
    .eq('id', productoId)
    .single<ProductoCatalogoDB>();

  if (productoDbError || !producto) {
    console.error(`[EditarProductoCatalogoPage] Error fetching producto con ID ${productoId} o no encontrado:`, productoDbError);
    notFound();
  }
  
  let variantePorDefecto: ProductoVariante | null = null;
  // Si el producto es simple, obtenemos su única variante para rellenar los campos de precio, SKU, etc.
  if (producto.tipo === 'simple') {
    const { data: varianteData, error: varianteError } = await supabase
      .from('producto_variantes')
      .select('*')
      .eq('producto_id', producto.id)
      .maybeSingle<ProductoVariante>();
    
    if (varianteError) {
      console.error(`[EditarProductoCatalogoPage] Error fetching variante para producto simple ${productoId}:`, varianteError.message);
    }
    variantePorDefecto = varianteData;
  }
  
  // 3. Preparamos initialData para el formulario, combinando datos del catálogo y de la variante por defecto
  const initialDataForForm: Partial<ProductoCatalogoFormData> = {
    // Datos del catálogo
    nombre: producto.nombre,
    tipo: producto.tipo,
    requiere_lote: producto.requiere_lote,
    en_tienda: producto.en_tienda,
    destacado: producto.destacado,
    descripcion_publica: producto.descripcion_publica ?? '',
    imagenes: producto.imagenes || [],
    categorias_tienda: producto.categorias_tienda || [],
    porcentaje_impuesto: producto.porcentaje_impuesto?.toString(),

    // Datos de la variante por defecto (solo para productos simples)
    codigo_producto: variantePorDefecto?.sku ?? '',
    precio_venta: variantePorDefecto?.precio_venta?.toString() || '',
    stock_no_lote_valor: !producto.requiere_lote ? variantePorDefecto?.stock_actual?.toString() : undefined,
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href={`/dashboard/inventario/${productoId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Editar Producto: {producto.nombre}</h1>
      </div>
      <ProductoCatalogoForm 
        initialData={initialDataForForm}
        productoId={producto.id}
      />
    </div>
  );
}
