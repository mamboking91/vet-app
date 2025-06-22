import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { ProductoCatalogo, ImagenProducto } from '@/app/dashboard/inventario/types';
import type { ClinicData } from '@/app/dashboard/configuracion/types';
import ProductImage from '@/components/ui/ProductImage';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag } from 'lucide-react';

// Tipado para los productos que vamos a mostrar, AHORA INCLUYE EL IMPUESTO
type ProductoDeTienda = Pick<
  ProductoCatalogo, 
  'id' | 'nombre' | 'precio_venta' | 'imagenes' | 'porcentaje_impuesto'
>;

function getPrimaryImage(imagenes: ImagenProducto[] | null, fallbackUrl: string): string {
  if (!imagenes || imagenes.length === 0) {
    return fallbackUrl;
  }
  const primaryImage = imagenes.find(img => img.isPrimary);
  return primaryImage ? primaryImage.url : imagenes[0].url;
}

function ProductCard({ product, fallbackImageUrl }: { product: ProductoDeTienda, fallbackImageUrl: string }) {
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

export default async function TiendaPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const [clinicResult, productsResult] = await Promise.all([
    supabase.from('datos_clinica').select('logo_url').single(),
    // CORRECCIÓN: Añadimos 'porcentaje_impuesto' a la consulta
    supabase.from('productos_inventario').select('id, nombre, precio_venta, porcentaje_impuesto, imagenes').eq('en_tienda', true).order('nombre', { ascending: true })
  ]);
  
  const { data: clinicData } = clinicResult;
  const { data: products, error: productsError } = productsResult;

  if (productsError) {
    console.error("Error fetching store products:", productsError);
  }

  const logoFallbackUrl = (clinicData && clinicData.logo_url) 
    ? clinicData.logo_url 
    : "https://placehold.co/600x600/e2e8f0/e2e8f0?text=Gomera+Mascotas";
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Nuestra Tienda</h1>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
          Explora nuestro catálogo completo de productos cuidadosamente seleccionados para tu mascota.
        </p>
      </div>

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
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No hay productos disponibles</h3>
          <p className="mt-1 text-sm text-gray-500">
            Estamos trabajando para añadir nuevos productos. ¡Vuelve pronto!
          </p>
        </div>
      )}
    </div>
  );
}
