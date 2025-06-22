import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { ProductoCatalogo, ImagenProducto } from '@/app/dashboard/inventario/types';
import type { ClinicData } from '@/app/dashboard/configuracion/types';
import ProductImage from '@/components/ui/ProductImage';

// Tipado para los productos que vamos a mostrar, AHORA INCLUYE EL IMPUESTO
type ProductoDestacado = Pick<
  ProductoCatalogo, 
  'id' | 'nombre' | 'precio_venta' | 'imagenes' | 'porcentaje_impuesto'
>;

// Función para obtener la imagen principal de un producto
function getPrimaryImage(imagenes: ImagenProducto[] | null, fallbackUrl: string): string {
  if (!imagenes || imagenes.length === 0) {
    return fallbackUrl;
  }
  const primaryImage = imagenes.find(img => img.isPrimary);
  return primaryImage ? primaryImage.url : imagenes[0].url;
}

// --- Componente para la tarjeta de producto ---
function ProductCard({ product, fallbackImageUrl }: { product: ProductoDestacado, fallbackImageUrl: string }) {
  const primaryImageUrl = getPrimaryImage(product.imagenes, fallbackImageUrl);
  
  // --- CÁLCULO DEL PRECIO FINAL ---
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
            <ProductImage
              src={primaryImageUrl}
              alt={product.nombre}
              width={600}
              height={600}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="p-4 border-t">
            <h3 className="text-md font-semibold text-gray-800 truncate">{product.nombre}</h3>
            <p className="text-lg font-bold text-blue-600 mt-2">
              {precioFinalDisplay}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}


// --- Página principal ---
export default async function HomePage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Hacemos dos consultas en paralelo para mejorar el rendimiento
  const [clinicResult, featuredProductsResult] = await Promise.all([
    supabase.from('datos_clinica').select('logo_url').single(),
    // CORRECCIÓN: Añadimos 'porcentaje_impuesto' a la consulta
    supabase.from('productos_inventario')
      .select('id, nombre, precio_venta, porcentaje_impuesto, imagenes')
      .eq('en_tienda', true)
      .eq('destacado', true)
      .limit(4)
  ]);

  const { data: clinicData } = clinicResult;
  const { data: featuredProducts, error: productsError } = featuredProductsResult;

  if (productsError) {
    console.error("Error fetching featured products:", productsError);
  }

  const logoFallbackUrl = (clinicData && clinicData.logo_url) 
    ? clinicData.logo_url 
    : "https://placehold.co/600x600/e2e8f0/e2e8f0?text=Gomera+Mascotas";

  return (
    <div>
      {/* Sección Héroe */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800">
            El mejor cuidado para tu mejor amigo
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
            Descubre nuestra selección de productos de alta calidad, elegidos por expertos para garantizar la felicidad y salud de tu mascota.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
              <Link href="/tienda">
                Ir a la Tienda <ShoppingBag className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contacto">
                Contactar <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Sección de Productos Destacados */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
              Productos Destacados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product as ProductoDestacado}
                  fallbackImageUrl={logoFallbackUrl}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
