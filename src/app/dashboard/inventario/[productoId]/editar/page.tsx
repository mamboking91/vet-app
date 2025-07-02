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

  // --- INICIO DE LA CORRECCIÓN ---
  // Se obtienen el producto y sus variantes en paralelo
  const [productoResult, variantesResult] = await Promise.all([
    supabase
      .from('productos_catalogo')
      .select('*')
      .eq('id', productoId)
      .single<ProductoCatalogoDB>(),
    supabase
      .from('producto_variantes')
      .select('*')
      .eq('producto_id', productoId)
  ]);
  
  const { data: producto, error: productoDbError } = productoResult;
  const { data: variantes, error: variantesError } = variantesResult;

  if (productoDbError || !producto) {
    console.error(`[EditarProductoCatalogoPage] Error fetching producto con ID ${productoId}:`, productoDbError);
    notFound();
  }
  
  if (variantesError) {
      console.error(`[EditarProductoCatalogoPage] Error fetching variantes para producto ${productoId}:`, variantesError.message);
  }

  // Se prepara initialData combinando los datos del catálogo y sus variantes
  const initialDataForForm: Partial<ProductoCatalogoFormData> & { variantes?: ProductoVariante[] } = {
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
    // Datos de las variantes
    variantes: (variantes || []) as ProductoVariante[],
    // Datos de la primera variante para productos simples
    codigo_producto: producto.tipo === 'simple' && variantes?.[0]?.sku ? variantes[0].sku : '',
    precio_venta: producto.tipo === 'simple' && variantes?.[0]?.precio_venta ? variantes[0].precio_venta.toString() : '',
    stock_no_lote_valor: producto.tipo === 'simple' && !producto.requiere_lote && variantes?.[0]?.stock_actual ? variantes[0].stock_actual.toString() : '',
  };
  // --- FIN DE LA CORRECCIÓN ---

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