import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ProductoCatalogo, ImagenProducto } from '@/app/dashboard/inventario/types';
import { Badge } from '@/components/ui/badge';
import ProductGallery from '@/components/ui/ProductGallery';
import AddToCartButton from './AddToCartButton';
import { PackageCheck, PackageX } from 'lucide-react';

interface ProductoDetallePageProps {
  params: {
    productoId: string;
  };
}

// 1. DEFINIMOS UN TIPO COMPLETO PARA LOS DATOS DEL PRODUCTO
type ProductoConStockCompleto = ProductoCatalogo & {
    stock_total_actual: number | null;
};


export default async function ProductoDetallePage({ params }: ProductoDetallePageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { productoId } = params;

  const { data: product, error: productError } = await supabase
    .from('productos_inventario_con_stock')
    .select('*')
    .eq('id', productoId)
    .eq('en_tienda', true)
    .single<ProductoConStockCompleto>(); // <-- 2. APLICAMOS EL TIPO A LA CONSULTA

  const { data: clinicData } = await supabase.from('datos_clinica').select('logo_url').single();

  if (productError || !product) {
    notFound();
  }
  
  const logoFallbackUrl = clinicData?.logo_url || "https://placehold.co/600x600/e2e8f0/e2e8f0?text=Gomera+Mascotas";
  
  // 3. AÑADIMOS TIPOS EXPLÍCITOS A LOS PARÁMETROS
  const categorias = (Array.isArray(product.categorias_tienda) ? product.categorias_tienda : []) as { nombre: string }[];
  const imagenes = (Array.isArray(product.imagenes) ? product.imagenes.sort((a: ImagenProducto, b: ImagenProducto) => a.order - b.order) : []);
  const primaryImageUrl = imagenes.find((img: ImagenProducto) => img.isPrimary)?.url || imagenes[0]?.url || logoFallbackUrl;
  const stockDisponible = product.stock_total_actual ?? 0;

  let precioFinal = 0;
  let precioFinalDisplay = 'Precio a consultar';
  if (product.precio_venta !== null && product.porcentaje_impuesto !== null) {
    precioFinal = Number(product.precio_venta) * (1 + Number(product.porcentaje_impuesto) / 100);
    precioFinalDisplay = `${precioFinal.toFixed(2)} €`;
  }

  const productForCart = {
    id: product.id,
    nombre: product.nombre,
    precioFinal: precioFinal,
    imagenUrl: primaryImageUrl,
    stock_disponible: stockDisponible,
  };

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <ProductGallery 
              images={imagenes}
              fallbackImageUrl={logoFallbackUrl}
              productName={product.nombre}
            />
          </div>

          <div className="flex flex-col justify-center">
            {categorias.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {/* 4. AÑADIMOS TIPO EXPLÍCITO A 'cat' */}
                {categorias.map((cat: { nombre: string }) => (<Badge key={cat.nombre} variant="secondary">{cat.nombre}</Badge>))}
              </div>
            )}
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">{product.nombre}</h1>
            
            <div className="mt-4 flex items-center justify-between">
              <p className="text-3xl text-gray-900">{precioFinalDisplay}</p>
              {stockDisponible > 0 ? (
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                  <PackageCheck className="h-4 w-4 mr-2" /> {stockDisponible} {stockDisponible === 1 ? 'unidad disponible' : 'unidades disponibles'}
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <PackageX className="h-4 w-4 mr-2" /> Agotado
                </Badge>
              )}
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800">Descripción</h3>
              <div className="mt-2 prose prose-sm text-gray-600 max-w-none" dangerouslySetInnerHTML={{ __html: product.descripcion_publica?.replace(/\n/g, '<br />') || 'No hay descripción disponible.' }} />
            </div>

            <div className="mt-8">
              <AddToCartButton product={productForCart} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}