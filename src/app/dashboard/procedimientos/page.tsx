// app/dashboard/procedimientos/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import ProcedimientosTable from './ProcedimientosTable';

export type Procedimiento = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_estimada_minutos: number | null;
  precio: number;
  categoria: string | null;
  // created_at: string; // Descomenta si seleccionas y usas este campo
  // notas_internas: string | null; // Descomenta si seleccionas y usas este campo
};

export const dynamic = 'force-dynamic';

export default async function ProcedimientosPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: procedimientosData, error } = await supabase
    .from('procedimientos')
    .select('id, nombre, descripcion, duracion_estimada_minutos, precio, categoria') // Ajusta los campos según necesites mostrar
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching procedimientos:', error);
    return <p className="text-red-500">Error al cargar los procedimientos: {error.message}. Revisa la consola del servidor.</p>;
  }
  
  const procedimientos = (procedimientosData || [])
    .filter(p => p.id != null) // Asegura que el id exista
    .map(p => ({ // Mapeo explícito para asegurar conformidad con el tipo Procedimiento
      id: p.id as string,
      nombre: p.nombre as string,
      descripcion: p.descripcion,
      duracion_estimada_minutos: p.duracion_estimada_minutos,
      precio: p.precio as number,
      categoria: p.categoria,
    }));

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Catálogo de Procedimientos</h1>
        <Button asChild>
          <Link href="/dashboard/procedimientos/nuevo">Añadir Nuevo Procedimiento</Link>
        </Button>
      </div>
      <ProcedimientosTable procedimientos={procedimientos as Procedimiento[]} />
    </div>
  );
}