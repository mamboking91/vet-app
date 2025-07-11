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

const GRUPOS_CATEGORIAS: { [key: string]: string[] } = {
  'Alimentación': ['pienso', 'comida', 'húmeda', 'snack', 'premio', 'alimento', 'nutrición', 'lenda'],
  'Salud y Bienestar': ['salud', 'antiparasitario', 'suplemento', 'vitamina', 'dental', 'medicamento'],
  'Paseo': ['arnés', 'arnes', 'collar', 'correa'],
  'Descanso': ['cama', 'colchón', 'cesta'],
  'Juguetes': ['juguete', 'pelota', 'mordedor', 'rascador', 'interactivo'],
  'Accesorios': ['accesorio', 'comedero', 'bebedero', 'transportín', 'ropa'],
  'Higiene': ['higiene', 'arena', 'champú', 'cepillo', 'toallita', 'limpieza', 'arenero', 'empapador'],
};

const getGrupoPrincipal = (nombreProducto: string): string => {
  const nombreLower = nombreProducto.toLowerCase();
  for (const grupo in GRUPOS_CATEGORIAS) {
    if (GRUPOS_CATEGORIAS[grupo].some(keyword => nombreLower.includes(keyword))) {
      return grupo;
    }
  }
  return 'Otros';
};

function ProductCard({ product }: { product: any }) {
  const precioFinalDisplay = product.precio_venta != null ? formatCurrency(product.precio_venta * (1 + product.porcentaje_impuesto / 100)) : 'Consultar';
  const nombreProducto = product.nombre.split(' - ')[0];

  return (
    <Link href={`/tienda/${product.producto_padre_id}`} className="group">
      <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="aspect-square overflow-hidden flex items-center justify-center">
            <Image
              src={product.imagen_producto_principal || '/placeholder.svg'}
              alt={product.nombre}
              width={600}
              height={600}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="p-4 border-t">
            <h3 className="text-md font-semibold text-gray-800 truncate" title={nombreProducto}>
              {nombreProducto}
            </h3>
            <p className="text-lg font-bold text-blue-600 mt-2">{precioFinalDisplay}</p>
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

  // --- INICIO DE LA CORRECCIÓN ---
  const { data: allProducts, error: allProductsError } = await supabase
    .from('productos_inventario_con_stock')
    .select('*')
    .eq('en_tienda', true)
    .order('nombre', { ascending: true });

  if (allProductsError) {
    console.error("Error fetching all store products:", allProductsError);
  }

  // 1. Clasificar cada producto y crear la lista de grupos existentes.
  const gruposExistentes = new Set<string>();
  const productosClasificados = (allProducts || []).map(product => {
    const grupo = getGrupoPrincipal(product.nombre);
    gruposExistentes.add(grupo);
    return { ...product, grupo };
  });

  // 2. Filtrar los productos según los parámetros de la URL.
  let filteredProducts = productosClasificados;

  if (searchQuery) {
    filteredProducts = filteredProducts.filter(p => p.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  if (categoryFilter) {
    filteredProducts = filteredProducts.filter(p => p.grupo === categoryFilter);
  }

  const uniqueProducts = Array.from(
    new Map(filteredProducts.map(variant => [variant.producto_padre_id, variant])).values()
  );
  // --- FIN DE LA CORRECCIÓN ---

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Nuestra Tienda</h1>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
          Explora nuestro catálogo completo de productos cuidadosamente seleccionados para tu mascota.
        </p>
      </div>
      
      <FiltrosTienda categorias={[...gruposExistentes].sort()} />

      {uniqueProducts && uniqueProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mt-10">
          {uniqueProducts.map(product => (
            <ProductCard 
              key={(product as any).producto_padre_id}
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