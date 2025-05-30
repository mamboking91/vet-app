// app/dashboard/propietarios/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
// Asegúrate de que el nombre del archivo y la importación coincidan.
// Si tu archivo es PropietariosTable.tsx (plural), la importación debería ser './PropietariosTable'.
// Si es PropietarioTable.tsx (singular), entonces tu importación actual está bien.
import PropietariosTable from './PropietarioTable'; 
import SearchInput from '@/components/ui/SearchInput'; // Ajusta la ruta si SearchInput.tsx está en otro lugar

// Tipo PropietarioConMascotas
export type PropietarioConMascotas = {
  id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  pacientes_count: number;
  // Añadimos los campos que se seleccionan de Supabase y que faltaban en el tipo
  // para que la aserción de tipo sea más precisa, aunque no se usen todos en PropietariosTable.
  // 'pacientes' viene de la consulta con el count, pero lo transformamos.
  // El tipo base de Supabase tendría 'pacientes' como { count: number }[] | null
};

// Props para la página, incluyendo searchParams
interface PropietariosPageProps {
  searchParams?: {
    q?: string; // Término de búsqueda
  };
}

export const dynamic = 'force-dynamic';

export default async function PropietariosPage({ searchParams }: PropietariosPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const searchQuery = searchParams?.q?.trim();

  // Construimos la consulta base
  let query = supabase
    .from('propietarios')
    .select('id, nombre_completo, email, telefono, pacientes(count)'); // pacientes(count) para el conteo

  // Aplicamos el filtro de búsqueda si existe
  if (searchQuery) {
    query = query.ilike('nombre_completo', `%${searchQuery}%`);
    // Podrías añadir más campos al filtro con .or() si lo deseas, por ejemplo:
    // query = query.or(`nombre_completo.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
  }

  // Añadimos el ordenamiento al final
  query = query.order('nombre_completo', { ascending: true });

  const { data: propietariosData, error } = await query;

  if (error) {
    console.error('Error fetching propietarios:', error);
    return <p className="text-red-500">Error al cargar los propietarios: {error.message}. Revisa la consola.</p>;
  }
  
  // Procesamos los datos para extraer el conteo y asegurar tipos
  const propietariosConConteoProcesados = (propietariosData || []).map(propietario => {
    const countArray = propietario.pacientes as unknown as ({ count: number }[] | null);
    return {
      id: propietario.id as string, // Asegurar que id es string
      nombre_completo: propietario.nombre_completo as string, // Asegurar que nombre_completo es string
      email: propietario.email,
      telefono: propietario.telefono,
      pacientes_count: countArray && countArray.length > 0 ? countArray[0].count : 0,
    };
  });

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Propietarios</h1>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/propietarios/nuevo">Añadir Nuevo Propietario</Link>
        </Button>
      </div>

      {/* Componente de Búsqueda */}
      <SearchInput 
        placeholder="Buscar propietario por nombre..." 
        initialQuery={searchQuery || ''}
        queryParamName="q" // Nombre del parámetro en la URL
      />

      {/* Mensaje si la búsqueda no arroja resultados */}
      {searchQuery && propietariosConConteoProcesados.length === 0 && (
        <p className="text-muted-foreground mt-4 mb-4 text-center">
          No se encontraron propietarios que coincidan con &quot;{searchQuery}&quot;.
        </p>
      )}
      
      <PropietariosTable propietarios={propietariosConConteoProcesados as PropietarioConMascotas[]} />
    </div>
  );
}