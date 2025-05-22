// app/dashboard/procedimientos/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import ProcedimientosTable from './ProcedimientosTable';

// Definición del tipo Procedimiento - ASEGÚRATE QUE notas_internas ESTÉ INCLUIDO
export type Procedimiento = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_estimada_minutos: number | null;
  precio: number;
  categoria: string | null;
  notas_internas: string | null; // Incluido para que el tipo sea completo
};

export const dynamic = 'force-dynamic';

export default async function ProcedimientosPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Modificamos la consulta para incluir todos los campos del tipo Procedimiento
  // que podrían ser relevantes para la tabla o para otros usos del tipo.
  const { data: procedimientosData, error } = await supabase
    .from('procedimientos')
    .select('id, nombre, descripcion, duracion_estimada_minutos, precio, categoria, notas_internas')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching procedimientos:', error);
    return <p className="text-red-500">Error al cargar los procedimientos: {error.message}. Revisa la consola del servidor.</p>;
  }
  
  // Mapeamos los datos asegurando que se ajustan al tipo Procedimiento
  // El filtro p.id != null es una buena práctica, aunque id es una PK.
  const procedimientosProcesados = (procedimientosData || [])
    .filter(p => p.id != null) 
    .map(p => ({
      id: p.id as string,
      nombre: p.nombre as string,
      descripcion: p.descripcion,
      duracion_estimada_minutos: p.duracion_estimada_minutos,
      precio: p.precio as number,
      categoria: p.categoria,
      notas_internas: p.notas_internas, // Aseguramos que se mapea
    }));

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Catálogo de Procedimientos</h1>
        <Button asChild>
          <Link href="/dashboard/procedimientos/nuevo">Añadir Nuevo Procedimiento</Link>
        </Button>
      </div>
      {/* Pasamos los datos procesados que ahora se ajustan al tipo Procedimiento (incluyendo notas_internas) */}
      <ProcedimientosTable procedimientos={procedimientosProcesados as Procedimiento[]} />
    </div>
  );
}