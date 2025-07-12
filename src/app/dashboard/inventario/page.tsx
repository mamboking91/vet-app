// src/app/dashboard/inventario/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import ProductosInventarioTable from './ProductosInventarioTable';
import type { ProductoConStock } from './types';
import SearchInput from '@/components/ui/SearchInput'; // 1. Importar el buscador

export const dynamic = 'force-dynamic';

// 2. Añadir searchParams a las props de la página
interface InventarioPageProps {
  searchParams?: {
    q?: string;
  };
}

export default async function InventarioPage({ searchParams }: InventarioPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 3. Lógica de búsqueda
  const searchQuery = searchParams?.q?.trim();

  // La consulta base ahora es una variable que se puede modificar.
  let query = supabase
    .from('productos_inventario_con_stock')
    .select(
      `
        id,
        producto_padre_id,
        nombre,
        descripcion,
        codigo_producto,
        precio_venta,
        porcentaje_impuesto,
        requiere_lote,
        en_tienda,
        destacado,
        stock_total_actual,
        proxima_fecha_caducidad,
        imagenes
      `
    );

  // Si hay un término de búsqueda, añadimos el filtro.
  if (searchQuery) {
    // Buscamos en la columna 'nombre' O en la columna 'codigo_producto' (SKU) de la vista.
    query = query.or(`nombre.ilike.%${searchQuery}%,codigo_producto.ilike.%${searchQuery}%`);
  }

  // Añadimos el ordenamiento al final y ejecutamos la consulta.
  const { data: productosData, error } = await query.order('nombre', { ascending: true });

  if (error) {
    console.error("Error fetching productos del inventario:", error);
    return (
        <div className="container mx-auto py-10 px-4 md:px-6">
            <p className="text-red-500">Error al cargar el inventario: {error.message}</p>
            <p className="text-xs text-muted-foreground mt-2">Detalles técnicos: {JSON.stringify(error, null, 2)}</p>
        </div>
    );
  }

  const productos = (productosData || []) as ProductoConStock[];

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Inventario</h1>
        <Button asChild>
          <Link href="/dashboard/inventario/nuevo">
            <PlusCircle className="mr-2 h-5 w-5" />
            Añadir Producto
          </Link>
        </Button>
      </div>
      
      {/* 4. Añadir el componente de búsqueda a la UI */}
      <div className="mb-6">
        <SearchInput
          placeholder="Buscar por nombre o SKU..."
          initialQuery={searchQuery || ''}
          queryParamName="q"
        />
      </div>
      
      {searchQuery && productos.length === 0 && (
        <p className="text-muted-foreground text-center my-4">
          No se encontraron productos que coincidan con &quot;{searchQuery}&quot;.
        </p>
      )}
      
      <ProductosInventarioTable productos={productos} />
    </div>
  );
}