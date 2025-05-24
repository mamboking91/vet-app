// app/dashboard/inventario/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import ProductosInventarioTable from './ProductosInventarioTable'; // Importa el nuevo componente

// Este tipo debe coincidir con las columnas de tu VISTA productos_inventario_con_stock
// Y también con lo que espera ProductosInventarioTable.tsx
// Es buena idea moverlo a un archivo types.ts dentro de la carpeta 'inventario'.
export type ProductoConStock = {
  id: string;
  nombre: string;
  descripcion: string | null;
  codigo_producto: string | null;
  unidad: string | null; 
  stock_minimo: number | null;
  precio_venta: number | null;
  requiere_lote: boolean;
  stock_total_actual: number;
  proxima_fecha_caducidad: string | null; 
};

export const dynamic = 'force-dynamic';

export default async function InventarioPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: productosData, error } = await supabase
    .from('productos_inventario_con_stock') 
    .select(`
      id,
      nombre,
      descripcion,
      codigo_producto,
      unidad,
      stock_minimo,
      precio_venta,
      requiere_lote,
      stock_total_actual,
      proxima_fecha_caducidad
    `)
    .order('nombre', { ascending: true });

  if (error) {
    console.error("Error fetching productos del inventario:", error);
    return <p className="text-red-500">Error al cargar el inventario: {error.message}</p>;
  }

  // La vista ya debería devolver los tipos correctos, pero un cast puede ser útil.
  const productos = (productosData || []) as ProductoConStock[];

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Inventario</h1>
        <Button asChild>
          <Link href="/dashboard/inventario/nuevo">
            <PlusCircle className="mr-2 h-5 w-5" />
            Añadir Producto al Catálogo
          </Link>
        </Button>
      </div>
      {/* Usamos el nuevo componente cliente para la tabla */}
      <ProductosInventarioTable productos={productos} />
    </div>
  );
}