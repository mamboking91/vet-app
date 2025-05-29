// app/dashboard/inventario/[productoId]/lotes/[loteId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import EditarLoteForm from './EditarLoteForm';
// Importamos el tipo LoteDeProducto de nuestro archivo centralizado de tipos de inventario
import type { LoteDeProducto as LoteDBRecord } from '../../../../types'; 

// Tipo para los datos que el formulario de edición de lote espera como initialData
export type LoteEditableFormData = {
    numero_lote: string;
    stock_lote: string; // Stock actual del lote, para editarlo como ajuste
    fecha_entrada: string; 
    fecha_caducidad: string; 
};

interface EditarLotePageProps {
  params: {
    productoId: string;
    loteId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function EditarLotePage({ params }: EditarLotePageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { productoId, loteId } = params;

  if (!productoId || !loteId || productoId.length !== 36 || loteId.length !== 36) {
    console.error("[EditarLotePage] IDs de producto o lote inválidos.");
    notFound();
  }

  const { data: loteData, error: loteError } = await supabase
    .from('lotes_producto')
    .select('id, producto_id, numero_lote, stock_lote, fecha_entrada, fecha_caducidad, esta_activo') // Incluimos esta_activo por si acaso
    .eq('id', loteId)
    .eq('producto_id', productoId)
    .single<LoteDBRecord>(); // Usamos LoteDBRecord que debe incluir todos estos campos

  if (loteError || !loteData) {
    console.error(`Error fetching lote con ID ${loteId} para producto ${productoId}:`, loteError);
    notFound();
  }

  // Si el lote está inactivo, quizás no se debería poder editar o mostrar un aviso.
  // Por ahora, permitimos la edición.
  // if (!loteData.esta_activo) {
  //   console.warn(`Intentando editar un lote inactivo: ${loteId}`);
  // }

  const { data: producto, error: productoError } = await supabase
    .from('productos_inventario')
    .select('nombre')
    .eq('id', productoId)
    .single<{ nombre: string }>();

  if (productoError && !producto) {
    console.warn("Producto no encontrado para el contexto del título:", productoError);
  }
  
  const initialDataForForm: LoteEditableFormData = {
    numero_lote: loteData.numero_lote || '',
    fecha_entrada: loteData.fecha_entrada ? new Date(loteData.fecha_entrada).toISOString().split('T')[0] : '',
    fecha_caducidad: loteData.fecha_caducidad ? new Date(loteData.fecha_caducidad).toISOString().split('T')[0] : '',
    stock_lote: loteData.stock_lote?.toString() || '0', // Incluimos el stock_lote
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href={`/dashboard/inventario/${productoId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">Editar Lote</h1>
            {producto && <p className="text-sm text-muted-foreground">Producto: {producto.nombre}</p>}
            <p className="text-sm text-muted-foreground">Lote Nº: {loteData.numero_lote}</p>
        </div>
      </div>
      <EditarLoteForm 
        initialData={initialDataForForm}
        loteId={loteId}
        productoId={productoId}
      />
    </div>
  );
}