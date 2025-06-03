// app/dashboard/procedimientos/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import ProcedimientosTable from './ProcedimientosTable';
// Importamos el tipo Procedimiento desde nuestro archivo types.ts
import type { Procedimiento } from './types'; 

export const dynamic = 'force-dynamic';

export default async function ProcedimientosPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Modificamos la consulta para incluir el nuevo campo porcentaje_impuesto
  const { data: procedimientosData, error } = await supabase
    .from('procedimientos')
    .select('id, nombre, descripcion, duracion_estimada_minutos, precio, categoria, notas_internas, porcentaje_impuesto') // <--- AÑADIDO porcentaje_impuesto
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching procedimientos:', error);
    return <p className="text-red-500">Error al cargar los procedimientos: {error.message}. Revisa la consola del servidor.</p>;
  }
  
  // Mapeamos los datos asegurando que se ajustan al tipo Procedimiento
  const procedimientosProcesados: Procedimiento[] = (procedimientosData || [])
    .filter(p => p.id != null) 
    .map(p => ({
      id: p.id, // Supabase devuelve UUID como string
      nombre: p.nombre,
      descripcion: p.descripcion,
      duracion_estimada_minutos: p.duracion_estimada_minutos,
      precio: p.precio, // Asumimos que ya es number
      categoria: p.categoria,
      notas_internas: p.notas_internas,
      porcentaje_impuesto: p.porcentaje_impuesto, // Asumimos que ya es number
    }));

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Catálogo de Procedimientos</h1>
        <Button asChild>
          <Link href="/dashboard/procedimientos/nuevo">Añadir Nuevo Procedimiento</Link>
        </Button>
      </div>
      {/* Pasamos los datos procesados, que ahora incluyen porcentaje_impuesto */}
      <ProcedimientosTable procedimientos={procedimientosProcesados} />
    </div>
  );
}