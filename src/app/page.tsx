import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { BloquePagina, ContenidoHeroe, ContenidoCaracteristicas, ContenidoProductosDestacados, ContenidoTextoConImagen, ContenidoCTA } from '@/app/dashboard/configuracion/contenido/types';
import ProductImage from '@/components/ui/ProductImage';
import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, ShoppingBag, HeartPulse, Stethoscope, Siren, Sparkles, LucideProps } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const iconMap: { [key: string]: React.FC<LucideProps> } = { Stethoscope, HeartPulse, Siren, Sparkles };

function HeroBlock({ contenido }: { contenido: ContenidoHeroe }) {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-blue-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white">{contenido.titulo || "El mejor cuidado para tu mejor amigo"}</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">{contenido.subtitulo || "Descubre nuestra selección de productos de alta calidad."}</p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"><Link href={contenido.boton_principal?.enlace || '/tienda'}>{contenido.boton_principal?.texto || 'Ir a la Tienda'}<ShoppingBag className="ml-2 h-5 w-5" /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link href={contenido.boton_secundario?.enlace || '/servicios/solicitar-cita'}>{contenido.boton_secundario?.texto || 'Pedir Cita'}<ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
        </div>
      </div>
    </section>
  );
}

function FeaturesBlock({ contenido }: { contenido: ContenidoCaracteristicas }) {
  if (!contenido.items || contenido.items.length === 0) return null;
  return (
    <section className="bg-white dark:bg-slate-800/50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {contenido.items.map(item => {
            const IconComponent = iconMap[item.icono] || Sparkles;
            return (
              <div key={item.id} className="text-center p-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mx-auto mb-4">
                  <IconComponent className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{item.titulo}</h3>
                <div className="mt-2 text-gray-600 dark:text-gray-300 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.descripcion }} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  );
}

async function FeaturedProductsBlock({ contenido }: { contenido: ContenidoProductosDestacados }) {
  const supabase = createServerComponentClient({ cookies: () => cookies() });
  
  const { data: clinicData } = await supabase.from('datos_clinica').select('logo_url').single();
  const logoFallbackUrl = clinicData?.logo_url || "https://placehold.co/600x600/e2e8f0/e2e8f0.png?text=Gomera+Mascotas";

  const { data: featuredProducts } = await supabase
    .from('productos_inventario_con_stock')
    .select('producto_padre_id, nombre, precio_venta, porcentaje_impuesto, imagen_producto_principal')
    .eq('en_tienda', true)
    .eq('destacado', true)
    .gt('stock_total_actual', 0)
    .limit(8);

  if (!featuredProducts || featuredProducts.length === 0) {
    return null;
  }

  const uniqueProducts = Array.from(
    new Map(featuredProducts.map(item => [item.producto_padre_id, item])).values()
  );

  return (
    <section className="py-16 bg-gray-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-10">{contenido.titulo}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {uniqueProducts.slice(0, 4).map(product => (
            <ProductCard key={product.producto_padre_id} product={product} fallbackImageUrl={logoFallbackUrl} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TextWithImageBlock({ contenido }: { contenido: ContenidoTextoConImagen }) {
  return (
    <section className="py-16 bg-white dark:bg-slate-800/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-12 items-center", contenido.posicionImagen === 'izquierda' && 'md:grid-flow-row-dense')}>
          <div className={cn("prose dark:prose-invert max-w-none lg:prose-lg", contenido.posicionImagen === 'izquierda' && 'md:col-start-2')}>
            <h2 className="text-3xl font-bold">{contenido.titulo}</h2>
            <div dangerouslySetInnerHTML={{ __html: contenido.texto }} />
            {contenido.boton?.texto && contenido.boton?.enlace && (
              <Button asChild className="mt-6 no-underline"><Link href={contenido.boton.enlace}>{contenido.boton.texto}</Link></Button>
            )}
          </div>
          <div className={cn(contenido.posicionImagen === 'izquierda' && 'md:col-start-1')}>
            <ProductImage src={contenido.imagenUrl} alt={contenido.titulo} width={800} height={600} className="rounded-lg shadow-xl object-cover aspect-[4/3]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaBlock({ contenido }: { contenido: ContenidoCTA }) {
  return (
    <section className="bg-blue-600 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="prose prose-invert max-w-none text-center" dangerouslySetInnerHTML={{ __html: contenido.titulo }}/>
        {contenido.boton?.texto && contenido.boton?.enlace && (
          <Button asChild size="lg" variant="secondary" className="mt-8"><Link href={contenido.boton.enlace}>{contenido.boton.texto}</Link></Button>
        )}
      </div>
    </section>
  );
}

// --- Componente ProductCard con la corrección aplicada ---
function ProductCard({ product, fallbackImageUrl }: { product: any, fallbackImageUrl: string }) {
    const primaryImageUrl = product.imagen_producto_principal || fallbackImageUrl;
    
    let precioFinalDisplay = 'Consultar';
    if (product.precio_venta !== null && product.porcentaje_impuesto !== null) {
      const precioFinal = Number(product.precio_venta) * (1 + Number(product.porcentaje_impuesto) / 100);
      precioFinalDisplay = formatCurrency(precioFinal);
    }
    
    return (
      <Link href={`/tienda/${product.producto_padre_id}`} className="group">
        <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-800">
          <CardContent className="p-0">
            {/* --- INICIO DE LA CORRECCIÓN --- */}
            {/* Se elimina el fondo gris y el padding del contenedor de la imagen */}
            <div className="aspect-square overflow-hidden flex items-center justify-center">
              <ProductImage 
                src={primaryImageUrl} 
                alt={product.nombre} 
                width={600} 
                height={600} 
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {/* --- FIN DE LA CORRECCIÓN --- */}
            <div className="p-4 border-t dark:border-slate-700">
              <h3 className="text-md font-semibold text-gray-800 dark:text-white truncate">{product.nombre.split(' - ')[0]}</h3>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">{precioFinalDisplay}</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
}

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies: () => cookies() });
  const { data: bloques, error } = await supabase.from('bloques_pagina').select('*').eq('pagina', 'inicio').order('orden', { ascending: true });
  if (error) console.error("Error al cargar los bloques de la página de inicio:", error);

  const renderBlock = (bloque: BloquePagina) => {
    switch (bloque.tipo_bloque) {
      case 'heroe': return <HeroBlock key={bloque.id} contenido={bloque.contenido} />;
      case 'caracteristicas': return <FeaturesBlock key={bloque.id} contenido={bloque.contenido} />;
      case 'productos_destacados': return <FeaturedProductsBlock key={bloque.id} contenido={bloque.contenido} />;
      case 'texto_con_imagen': return <TextWithImageBlock key={bloque.id} contenido={bloque.contenido} />;
      case 'cta': return <CtaBlock key={bloque.id} contenido={bloque.contenido} />;
      default: return null;
    }
  };

  return (
    <div>
        {(bloques && bloques.length > 0) ? (
            bloques.map(bloque => renderBlock(bloque))
        ) : (
            <HeroBlock contenido={{titulo: "Bienvenido", subtitulo: "Contenido por defecto.", boton_principal: {texto: 'Tienda', enlace: '/tienda'}, boton_secundario: {texto: 'Citas', enlace: '/servicios/solicitar-cita'}}}/>
        )}
    </div>
  );
}