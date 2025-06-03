// app/dashboard/procedimientos/[productoId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ProcedimientoForm from '../../nuevo/ProcedimientoForm'; 
// Importamos los tipos desde el archivo centralizado de tipos de procedimientos
import type { 
  Procedimiento as ProcedimientoDB, // Tipo para datos de la BD
  ProcedimientoFormData,             // Tipo para el initialData del formulario
  ImpuestoItemValue                  // Tipo para los valores de impuesto
} from '../../types';                   // Asume que types.ts está en app/dashboard/procedimientos/types.ts

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

  if (!procedimientoId || procedimientoId === 'undefined' || procedimientoId.length !== 36) { // Simple validación de UUID
    console.error("[EditarProcedimientoPage] procedimientoId es inválido o 'undefined' en params.");
    notFound();
  }

  // Obtenemos el procedimiento, incluyendo el nuevo campo 'porcentaje_impuesto'
  const { data: procedimiento, error } = await supabase
    .from('procedimientos')
    .select('id, nombre, descripcion, duracion_estimada_minutos, precio, categoria, notas_internas, porcentaje_impuesto') // <--- AÑADIDO porcentaje_impuesto
    .eq('id', procedimientoId)
    .single<ProcedimientoDB>(); // Tipamos la respuesta con el tipo de la BD

  if (error || !procedimiento) {
    console.error(`[EditarProcedimientoPage] Error fetching procedimiento con ID ${procedimientoId} o no encontrado:`, error);
    notFound();
  }
  
  // Preparamos los datos iniciales para el ProcedimientoForm
  // Los campos del formulario (definidos en ProcedimientoFormData) esperan strings para inputs numéricos/selects.
  const initialDataForForm: Partial<ProcedimientoFormData> = {
    nombre: procedimiento.nombre || '', 
    descripcion: procedimiento.descripcion || '',
    duracion_estimada_minutos: procedimiento.duracion_estimada_minutos?.toString() || '',
    precio: procedimiento.precio?.toString() || '0', // Precio base
    categoria: procedimiento.categoria || '',
    porcentaje_impuesto: procedimiento.porcentaje_impuesto?.toString() as ImpuestoItemValue || "0", // <--- AÑADIDO Y FORMATEADO
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