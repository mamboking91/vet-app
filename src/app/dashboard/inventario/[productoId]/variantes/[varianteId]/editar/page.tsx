import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Palette } from 'lucide-react';
import EditarVarianteForm from './EditarVarianteForm'; // Crearemos este componente a continuación
import type { ProductoCatalogo, ProductoVariante } from '../../../../types';

interface EditarVariantePageProps {
  params: {
    productoId: string;
    varianteId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function EditarVariantePage({ params }: EditarVariantePageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { productoId, varianteId } = params;

  // 1. Obtener los datos del producto padre
  const { data: productoPadre, error: productoError } = await supabase
    .from('productos_catalogo')
    .select('*')
    .eq('id', productoId)
    .single<ProductoCatalogo>();

  if (productoError || !productoPadre) {
    console.error(`Error fetching parent product ${productoId}:`, productoError);
    notFound();
  }

  // 2. Obtener los datos de la variante específica que se va a editar
  const { data: variante, error: varianteError } = await supabase
    .from('producto_variantes')
    .select('*')
    .eq('id', varianteId)
    .single<ProductoVariante>();

  if (varianteError || !variante) {
    console.error(`Error fetching variant ${varianteId}:`, varianteError);
    notFound();
  }

  // Formatear los atributos para mostrarlos en el título
  const atributosDisplay = variante.atributos && variante.atributos.default !== 'default'
    ? Object.values(variante.atributos).join(' / ')
    : 'Variante por defecto';

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href={`/dashboard/inventario/${productoId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
            <h1 className="text-2xl md:text-3xl font-bold">Editar Variante</h1>
            <p className="text-muted-foreground">{productoPadre.nombre} - {atributosDisplay}</p>
        </div>
      </div>
      
      {/* El formulario recibirá los datos necesarios para la edición */}
      <EditarVarianteForm 
        productoPadre={productoPadre}
        variante={variante}
      />
    </div>
  );
}