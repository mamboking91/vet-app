// src/app/tienda/page.tsx
import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { ProductoConStock } from '@/app/dashboard/inventario/types';
import FiltrosTienda from './FiltrosTienda';

function ProductCard({ product }: { product: any }) {
  const precioFinalDisplay = product.precio_venta != null ? formatCurrency(product.precio_venta * (1 + product.porcentaje_impuesto / 100)) : 'Consultar';
  const nombreProducto = product.nombre.split(' - ')[0];

  return (
    <Link href={`/tienda/${product.producto_padre_id}`} className="group">
      <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardContent className="p-0">
          {/* --- INICIO DE LA CORRECCIÓN --- */}
          {/* Se elimina el fondo gris y el padding del contenedor de la imagen */}
          <div className="aspect-square overflow-hidden flex items-center justify-center">
            <Image
              src={product.imagen_producto_principal || '/placeholder.svg'}
              alt={product.nombre}
              width={600}
              height={600}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          {/* --- FIN DE LA CORRECCIÓN --- */}
          <div className="p-4 border-t">
            <h3 className="text-md font-semibold text-gray-800 truncate" title={nombreProducto}>
              {nombreProducto}
            </h3>
            <p className="text-lg font-bold text-blue-600 mt-2">{precioFinalDisplay}</p>
            <div className="mt-2">
              {product.stock_total_actual > 0 && product.stock_total_actual < 10 && (
                <Badge variant="destructive">¡Últimas unidades!</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface TiendaPageProps {
    searchParams?: {
        q?: string;
        categoria?: string;
    }
}

export default async function TiendaPage({ searchParams }: TiendaPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const searchQuery = searchParams?.q;
  const categoryFilter = searchParams?.categoria;

  let query = supabase
    .from('productos_inventario_con_stock')
    .select('*') 
    .eq('en_tienda', true)
    .gt('stock_total_actual', 0)
    .order('nombre', { ascending: true });

  if (searchQuery) {
    query = query.ilike('nombre', `%${searchQuery}%`);
  }

  if (categoryFilter) {
    query = query.contains('categorias_tienda', [{ nombre: categoryFilter }]);
  }

  const { data: allVariants, error: productsError } = await query;

  if (productsError) {
    console.error("Error fetching store products:", productsError);
  }

  const uniqueProducts = Array.from(
    new Map(allVariants?.map(variant => [variant.producto_padre_id, variant])).values()
  );

  const { data: allProductsResult } = await supabase
    .from('productos_catalogo')
    .select('categorias_tienda')
    .eq('en_tienda', true);
  
  const allCategories = allProductsResult?.flatMap(
    (p: { categorias_tienda: { nombre: string }[] | null }) => 
      p.categorias_tienda?.map((c: { nombre: string }) => c.nombre) || []
  ) || [];
  
  const uniqueCategories = [...new Set(allCategories.filter(Boolean))].sort();
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Nuestra Tienda</h1>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
          Explora nuestro catálogo completo de productos cuidadosamente seleccionados para tu mascota.
        </p>
      </div>
      
      <FiltrosTienda categorias={uniqueCategories} />

      {uniqueProducts && uniqueProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-10">
          {uniqueProducts.map(product => (
            <ProductCard 
              key={(product as any).id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg mt-10">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No se encontraron productos</h3>
          <p className="mt-2 text-sm text-gray-500">
            Intenta ajustar tu búsqueda o limpiar los filtros para ver todos nuestros productos.
          </p>
        </div>
      )}
    </div>
  );
}