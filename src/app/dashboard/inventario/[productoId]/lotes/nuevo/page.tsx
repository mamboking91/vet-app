// app/dashboard/inventario/[productoId]/lotes/nuevo/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import EntradaLoteForm from './EntradaLoteForm'; // Crearemos este componente a continuación

interface NuevaEntradaLotePageProps {
  params: {
    productoId: string; // ID del producto al que pertenece este lote
  };
}

export const dynamic = 'force-dynamic';

export default async function NuevaEntradaLotePage({ params }: NuevaEntradaLotePageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { productoId } = params;

  if (!productoId || productoId.length !== 36) { // Simple validación de UUID
    notFound();
  }

  // Obtener el nombre del producto para dar contexto
  const { data: producto, error: productoError } = await supabase
    .from('productos_inventario')
    .select('id, nombre')
    .eq('id', productoId)
    .single();

  if (productoError || !producto) {
    console.error(`Error fetching producto con ID ${productoId} para la página de nuevo lote:`, productoError);
    notFound(); // Si el producto base no existe, no podemos añadirle un lote
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          {/* Enlaza de vuelta a la página de detalle del producto */}
          <Link href={`/dashboard/inventario/${productoId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Registrar Nueva Entrada de Lote</h1>
          <p className="text-muted-foreground">Para el producto: {producto.nombre}</p>
        </div>
      </div>
      {/* Pasamos el productoId al formulario para que sepa a qué producto añadir el lote */}
      <EntradaLoteForm productoId={producto.id} />
    </div>
  );
}