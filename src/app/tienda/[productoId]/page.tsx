import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ProductoCatalogo, ImagenProducto } from '@/app/dashboard/inventario/types';
import type { ClinicData } from '@/app/dashboard/configuracion/types';
import { ShoppingCart, CheckCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProductGallery from '@/components/ui/ProductGallery';
import AddToCartButton from './AddToCartButton'; // <-- 1. IMPORTAMOS EL NUEVO BOTÓN

interface ProductoDetallePageProps {
  params: {
    productoId: string;
  };
}

// Función auxiliar para obtener la imagen principal
function getPrimaryImage(imagenes: ImagenProducto[] | null, fallbackUrl: string): string {
  if (!imagenes || imagenes.length === 0) return fallbackUrl;
  const primaryImage = imagenes.find(img => img.isPrimary) || imagenes[0];
  return primaryImage.url;
}

export default async function ProductoDetallePage({ params }: ProductoDetallePageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { productoId } = params;

  const [productResult, clinicResult] = await Promise.all([
    supabase.from('productos_inventario').select('*').eq('id', productoId).eq('en_tienda', true).single<ProductoCatalogo>(),
    supabase.from('datos_clinica').select('logo_url').single<ClinicData>()
  ]);

  const { data: product, error: productError } = productResult;
  const { data: clinicData } = clinicResult;

  if (productError || !product) {
    notFound();
  }
  
  const logoFallbackUrl = clinicData?.logo_url || "https://placehold.co/600x600/e2e8f0/e2e8f0?text=Gomera+Mascotas";
  const categorias = (Array.isArray(product.categorias_tienda) ? product.categorias_tienda : []) as { nombre: string }[];
  const primaryImageUrl = getPrimaryImage(product.imagenes, logoFallbackUrl);

  let precioFinal = 0;
  let precioFinalDisplay = 'Precio a consultar';
  if (product.precio_venta !== null && product.porcentaje_impuesto !== null) {
    const precioBase = Number(product.precio_venta);
    const impuesto = Number(product.porcentaje_impuesto);
    precioFinal = precioBase * (1 + impuesto / 100);
    precioFinalDisplay = `${precioFinal.toFixed(2)} €`;
  }

  // 2. Preparamos los datos del producto para el botón
  const productForCart = {
    id: product.id,
    nombre: product.nombre,
    precioFinal: precioFinal,
    imagenUrl: primaryImageUrl,
  };

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <ProductGallery 
              images={product.imagenes || []}
              fallbackImageUrl={logoFallbackUrl}
              productName={product.nombre}
            />
          </div>

          <div className="flex flex-col justify-center">
            {categorias.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {categorias.map(cat => (
                  <Badge key={cat.nombre} variant="secondary">{cat.nombre}</Badge>
                ))}
              </div>
            )}
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">{product.nombre}</h1>
            <div className="mt-4">
              <p className="text-3xl text-gray-900">{precioFinalDisplay}</p>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800">Descripción</h3>
              <div 
                className="mt-2 prose prose-sm text-gray-600 max-w-none"
                dangerouslySetInnerHTML={{ __html: product.descripcion_publica?.replace(/\n/g, '<br />') || 'No hay descripción disponible.' }}
              />
            </div>

            <div className="mt-8">
              {/* 3. Reemplazamos el botón estático por nuestro componente interactivo */}
              <AddToCartButton product={productForCart} />
            </div>

            <div className="mt-6 flex flex-col gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Producto de alta calidad, recomendado por veterinarios.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span>Compra segura y con garantía.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
