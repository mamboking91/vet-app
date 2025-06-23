import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { ProductoCatalogo, ImagenProducto } from '@/app/dashboard/inventario/types';
import ProductImage from '@/components/ui/ProductImage';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Search } from 'lucide-react';
import FiltrosTienda from './FiltrosTienda';

// El tipo ahora incluye el stock para futuras mejoras
type ProductoDeTienda = Pick<ProductoCatalogo, 'id' | 'nombre' | 'precio_venta' | 'imagenes' | 'porcentaje_impuesto' | 'categorias_tienda'> & { stock_total_actual: number | null };

function getPrimaryImage(imagenes: ImagenProducto[] | null, fallbackUrl: string): string {
  if (!imagenes || imagenes.length === 0) return fallbackUrl;
  const primaryImage = imagenes.find(img => img.isPrimary) || imagenes[0];
  return primaryImage.url;
}

function ProductCard({ product, fallbackImageUrl }: { product: ProductoDeTienda, fallbackImageUrl: string }) {
  const primaryImageUrl = getPrimaryImage(product.imagenes, fallbackImageUrl);
  let precioFinalDisplay = 'Consultar';
  if (product.precio_venta !== null && product.porcentaje_impuesto !== null) {
    const precioBase = Number(product.precio_venta);
    const impuesto = Number(product.porcentaje_impuesto);
    const precioFinal = precioBase * (1 + impuesto / 100);
    precioFinalDisplay = `${precioFinal.toFixed(2)} €`;
  }
  return (
    <Link href={`/tienda/${product.id}`} className="group">
      <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
            <ProductImage src={primaryImageUrl} alt={product.nombre} width={600} height={600} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
          </div>
          <div className="p-4 border-t">
            <h3 className="text-md font-semibold text-gray-800 truncate">{product.nombre}</h3>
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

  // --- CORRECCIÓN: Usamos la vista `productos_inventario_con_stock` ---
  let query = supabase
    .from('productos_inventario_con_stock') // <-- VISTA CON STOCK
    .select('id, nombre, precio_venta, porcentaje_impuesto, imagenes, categorias_tienda, stock_total_actual')
    .eq('en_tienda', true)
    .gt('stock_total_actual', 0) // <-- SOLO PRODUCTOS CON STOCK > 0
    .order('nombre', { ascending: true });

  if (searchQuery) {
    query = query.ilike('nombre', `%${searchQuery}%`);
  }

  if (categoryFilter) {
    query = query.contains('categorias_tienda', `[{"nombre":"${categoryFilter}"}]`);
  }

  const [productsResult, clinicResult, allProductsResult] = await Promise.all([
    query,
    supabase.from('datos_clinica').select('logo_url').single(),
    supabase.from('productos_inventario').select('categorias_tienda').eq('en_tienda', true)
  ]);
  
  const { data: products, error: productsError } = productsResult;
  const { data: clinicData } = clinicResult;

  if (productsError) {
    console.error("Error fetching store products:", productsError);
  }

  const allCategories = allProductsResult.data?.flatMap(
    (p: { categorias_tienda: { nombre: string }[] | null }) => 
      p.categorias_tienda?.map((c: { nombre: string }) => c.nombre) || []
  ) || [];
  
  const uniqueCategories = [...new Set(allCategories.filter(Boolean))].sort();

  const logoFallbackUrl = clinicData?.logo_url || "https://placehold.co/600x600/e2e8f0/e2e8f0?text=Gomera+Mascotas";
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Nuestra Tienda</h1>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
          Explora nuestro catálogo completo de productos cuidadosamente seleccionados para tu mascota.
        </p>
      </div>
      
      <FiltrosTienda categorias={uniqueCategories} />

      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product as ProductoDeTienda} 
              fallbackImageUrl={logoFallbackUrl}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg">
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