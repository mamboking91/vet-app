import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ProductoCatalogo, ProductoConStock } from '@/app/dashboard/inventario/types';
import ProductDisplay from './ProductDisplay'; // Crearemos este componente en el mismo archivo

interface ProductoDetallePageProps {
  params: {
    productoId: string;
  };
}

export const dynamic = 'force-dynamic';

// --- Componente del Servidor: Obtiene los datos ---
export default async function ProductoDetallePage({ params }: ProductoDetallePageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { productoId } = params;

  // 1. Obtener el producto principal del catálogo
  const { data: producto, error: productoError } = await supabase
    .from('productos_catalogo')
    .select('*')
    .eq('id', productoId)
    .eq('en_tienda', true)
    .single<ProductoCatalogo>();
  
  if (productoError || !producto) {
    notFound();
  }

  // 2. Obtener todas sus variantes con stock desde la vista
  const { data: variantes, error: variantesError } = await supabase
    .from('productos_inventario_con_stock')
    .select('*')
    .eq('producto_padre_id', productoId)
    .gt('stock_total_actual', 0); // Solo variantes con stock

  if (variantesError) {
    console.error("Error fetching product variants:", variantesError);
    // Puedes optar por mostrar un error o simplemente no mostrar variantes
  }
  
  if (!variantes || variantes.length === 0) {
    // Si no hay variantes con stock, podrías mostrar un mensaje de "Agotado"
    // o redirigir. Por ahora, mostraremos la página pero sin opciones de compra.
  }

  const { data: clinicData } = await supabase.from('datos_clinica').select('logo_url').single();
  const logoFallbackUrl = clinicData?.logo_url || "https://placehold.co/600x600/e2e8f0/e2e8f0.png?text=Gomera+Mascotas";

  return (
    <ProductDisplay 
      producto={producto} 
      variantes={variantes as ProductoConStock[] || []} 
      fallbackImageUrl={logoFallbackUrl}
    />
  );
}
