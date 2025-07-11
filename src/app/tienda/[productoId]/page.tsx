// src/app/tienda/[productoId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ProductoCatalogo, ProductoConStock } from '@/app/dashboard/inventario/types';
import ProductDisplay from './ProductDisplay';

interface ProductoDetallePageProps {
  params: {
    productoId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function ProductoDetallePage({ params }: ProductoDetallePageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { productoId } = params;

  // Se obtiene el producto principal (catálogo)
  const { data: producto, error: productoError } = await supabase
    .from('productos_catalogo')
    .select('*')
    .eq('id', productoId)
    .eq('en_tienda', true)
    .single<ProductoCatalogo>();
  
  if (productoError || !producto) {
    notFound();
  }

  // --- INICIO DE LA CORRECCIÓN ---
  // 1. Obtener datos principales y de stock desde la vista.
  const { data: variantesConStock, error: variantesError } = await supabase
    .from('productos_inventario_con_stock')
    .select('*')
    .eq('producto_padre_id', productoId);

  // 2. Obtener los atributos directamente de la tabla de variantes.
  const { data: variantesConAtributos, error: atributosError } = await supabase
    .from('producto_variantes')
    .select('id, atributos')
    .eq('producto_id', productoId);
    
  if (variantesError || atributosError) {
    console.error("Error fetching product variants data:", variantesError || atributosError);
  }

  // 3. Unir los dos resultados.
  const variantesFinales = (variantesConStock || []).map(variante => {
    const atributosInfo = variantesConAtributos?.find(v => v.id === variante.id);
    return {
      ...variante,
      atributos: atributosInfo?.atributos || null,
    };
  });
  // --- FIN DE LA CORRECCIÓN ---

  const { data: clinicData } = await supabase.from('datos_clinica').select('logo_url').single();
  const logoFallbackUrl = clinicData?.logo_url || "https://placehold.co/600x600/e2e8f0/e2e8f0.png?text=Gomera+Mascotas";

  return (
    <ProductDisplay 
      producto={producto} 
      variantes={variantesFinales as ProductoConStock[] || []} 
      fallbackImageUrl={logoFallbackUrl}
    />
  );
}