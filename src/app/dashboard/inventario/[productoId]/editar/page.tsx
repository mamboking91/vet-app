// app/dashboard/inventario/[productoId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ProductoCatalogoForm from '../../nuevo/ProductoCatalogoForm'; // <--- VERIFICA/AÑADE ESTA IMPORTACIÓN
import type { 
  ProductoCatalogoFormData, 
  UnidadMedidaInventarioValue 
} from '../../types'; 

type ProductoCatalogoDB = {
  id: string;
  nombre: string;
  descripcion: string | null;
  codigo_producto: string | null;
  unidad: UnidadMedidaInventarioValue | null;
  stock_minimo: number | null;
  precio_compra: number | null;
  precio_venta: number | null;
  requiere_lote: boolean;
  notas_internas: string | null;
};

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

  if (!productoId || productoId === 'undefined' || productoId.length !== 36) {
    console.error("[EditarProductoCatalogoPage] productoId es inválido:", productoId);
    notFound();
  }

  const { data: producto, error } = await supabase
    .from('productos_inventario')
    .select('id, nombre, descripcion, codigo_producto, unidad, stock_minimo, precio_compra, precio_venta, requiere_lote, notas_internas')
    .eq('id', productoId)
    .single<ProductoCatalogoDB>(); 

  if (error || !producto) {
    console.error(`[EditarProductoCatalogoPage] Error fetching producto con ID ${productoId} o no encontrado:`, error);
    notFound();
  }
  
  const initialDataForForm: Partial<ProductoCatalogoFormData> = {
    nombre: producto.nombre || '', 
    descripcion: producto.descripcion || '',
    codigo_producto: producto.codigo_producto || '',
    unidad: producto.unidad || ('Unidad' as UnidadMedidaInventarioValue), 
    stock_minimo: producto.stock_minimo?.toString() || '0',
    precio_compra: producto.precio_compra?.toString() || '',
    precio_venta: producto.precio_venta?.toString() || '',
    requiere_lote: producto.requiere_lote === undefined ? true : producto.requiere_lote,
    notas_internas: producto.notas_internas || '',
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/inventario">
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