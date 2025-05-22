// app/dashboard/procedimientos/[procedimientoId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ProcedimientoForm from '../../nuevo/ProcedimientoForm'; 
import type { Procedimiento as ProcedimientoDBType } from '../../page'; 

interface EditarProcedimientoPageProps {
  params: {
    procedimientoId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function EditarProcedimientoPage({ params }: EditarProcedimientoPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { procedimientoId } = params;

  if (!procedimientoId || procedimientoId === 'undefined') {
    console.error("[EditarProcedimientoPage] procedimientoId es inválido o 'undefined' en params.");
    notFound();
  }

  const { data: procedimiento, error } = await supabase
    .from('procedimientos')
    .select('id, nombre, descripcion, duracion_estimada_minutos, precio, categoria, notas_internas')
    .eq('id', procedimientoId)
    .single<ProcedimientoDBType>(); 

  if (error || !procedimiento) {
    console.error(`[EditarProcedimientoPage] Error fetching procedimiento con ID ${procedimientoId} o no encontrado:`, error);
    notFound();
  }
  
  const initialDataForForm = {
    nombre: procedimiento.nombre || '', // nombre es NOT NULL en DB, pero por si acaso
    descripcion: procedimiento.descripcion || '',
    duracion_estimada_minutos: procedimiento.duracion_estimada_minutos?.toString() || '',
    precio: procedimiento.precio?.toString() || '', // precio es NOT NULL, pero toString() por seguridad
    categoria: procedimiento.categoria || '',
    notas_internas: procedimiento.notas_internas || '',
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/procedimientos">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Editar Procedimiento: {procedimiento.nombre}</h1>
      </div>
      <ProcedimientoForm 
        initialData={initialDataForForm} 
        procedimientoId={procedimiento.id}
      />
    </div>
  );
}