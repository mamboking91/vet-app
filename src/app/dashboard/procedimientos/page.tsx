// app/dashboard/procedimientos/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import ProcedimientosTable from './ProcedimientosTable';
import type { Procedimiento } from './types'; 
// --- INICIO DE LA CORRECCIÓN ---
import SearchInput from '@/components/ui/SearchInput'; // 1. Importar el buscador
// --- FIN DE LA CORRECCIÓN ---


export const dynamic = 'force-dynamic';

// --- INICIO DE LA CORRECCIÓN ---
// 2. Añadir searchParams a las props de la página
interface ProcedimientosPageProps {
  searchParams?: {
    q?: string;
  };
}

export default async function ProcedimientosPage({ searchParams }: ProcedimientosPageProps) {
// --- FIN DE LA CORRECCIÓN ---
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // --- INICIO DE LA CORRECCIÓN ---
  // 3. Lógica para la búsqueda
  const searchQuery = searchParams?.q?.trim();

  let query = supabase
    .from('procedimientos')
    .select('id, nombre, descripcion, duracion_estimada_minutos, precio, categoria, notas_internas, porcentaje_impuesto')
    .order('nombre', { ascending: true });

  if (searchQuery) {
    // Filtrar por nombre o descripción si hay un término de búsqueda
    query = query.or(`nombre.ilike.%${searchQuery}%,descripcion.ilike.%${searchQuery}%`);
  }

  const { data: procedimientosData, error } = await query;
  // --- FIN DE LA CORRECCIÓN ---

  if (error) {
    console.error('Error fetching procedimientos:', error);
    return <p className="text-red-500">Error al cargar los procedimientos: {error.message}. Revisa la consola del servidor.</p>;
  }
  
  const procedimientosProcesados: Procedimiento[] = (procedimientosData || [])
    .filter(p => p.id != null) 
    .map(p => ({
      id: p.id, 
      nombre: p.nombre,
      descripcion: p.descripcion,
      duracion_estimada_minutos: p.duracion_estimada_minutos,
      precio: p.precio, 
      categoria: p.categoria,
      notas_internas: p.notas_internas,
      porcentaje_impuesto: p.porcentaje_impuesto,
    }));

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Catálogo de Procedimientos</h1>
        <Button asChild>
          <Link href="/dashboard/procedimientos/nuevo">Añadir Nuevo Procedimiento</Link>
        </Button>
      </div>

      {/* --- INICIO DE LA CORRECCIÓN --- */}
      {/* 4. Añadir el componente de búsqueda a la UI */}
      <div className="mb-6">
        <SearchInput 
          placeholder="Buscar por nombre o descripción..."
          initialQuery={searchQuery || ''}
          queryParamName="q"
        />
      </div>
      
      {searchQuery && procedimientosProcesados.length === 0 && (
        <p className="text-muted-foreground text-center my-4">
          No se encontraron procedimientos que coincidan con &quot;{searchQuery}&quot;.
        </p>
      )}
      {/* --- FIN DE LA CORRECCIÓN --- */}
      
      <ProcedimientosTable procedimientos={procedimientosProcesados} />
    </div>
  );
}