// src/app/dashboard/inventario/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import ProductosInventarioTable from './ProductosInventarioTable';
import type { ProductoConStock } from './types';

export const dynamic = 'force-dynamic';

export default async function InventarioPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Consulta actualizada a la VISTA 'productos_inventario_con_stock'
  // Seleccionamos todos los campos necesarios para la tabla.
  const { data: productosData, error } = await supabase
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
    )
    .order('nombre', { ascending: true });

  if (error) {
    console.error("Error fetching productos del inventario:", error);
    return (
        <div className="container mx-auto py-10 px-4 md:px-6">
            <p className="text-red-500">Error al cargar el inventario: {error.message}</p>
            <p className="text-xs text-muted-foreground mt-2">Detalles técnicos: {JSON.stringify(error, null, 2)}</p>
        </div>
    );
  }

  // Asegúrate de que el tipo ProductoConStock coincida con los campos seleccionados
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
      <ProductosInventarioTable productos={productos} />
    </div>
  );
}