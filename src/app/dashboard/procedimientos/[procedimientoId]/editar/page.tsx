// app/dashboard/procedimientos/[procedimientoId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ProcedimientoForm from '../../nuevo/ProcedimientoForm'; 
// Importamos el tipo Procedimiento desde la página de listado, donde está la definición "maestra".
import type { Procedimiento as ProcedimientoType } from '../../page'; 

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

  // La consulta ya seleccionaba 'notas_internas'.
  // Usamos ProcedimientoType para tipar la respuesta de Supabase.
  const { data: procedimiento, error } = await supabase
    .from('procedimientos')
    .select('id, nombre, descripcion, duracion_estimada_minutos, precio, categoria, notas_internas')
    .eq('id', procedimientoId)
    .single<ProcedimientoType>(); // Tipamos la respuesta con el tipo importado

  if (error || !procedimiento) {
    console.error(`[EditarProcedimientoPage] Error fetching procedimiento con ID ${procedimientoId} o no encontrado:`, error);
    notFound();
  }
  
  // Preparamos los datos para el formulario.
  // El tipo `ProcedimientoFormData` dentro de ProcedimientoForm espera strings.
  const initialDataForForm = {
    nombre: procedimiento.nombre || '', 
    descripcion: procedimiento.descripcion || '',
    duracion_estimada_minutos: procedimiento.duracion_estimada_minutos?.toString() || '',
    precio: procedimiento.precio?.toString() || '', 
    categoria: procedimiento.categoria || '',
    notas_internas: procedimiento.notas_internas || '', // Ahora no debería dar error de tipo
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
        initialData={initialDataForForm} // Ya no necesita 'as ProcedimientoType' aquí, 
                                        // initialDataForForm ya está preparado para el form.
        procedimientoId={procedimiento.id}
      />
    </div>
  );
}