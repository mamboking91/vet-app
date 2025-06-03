// app/dashboard/pacientes/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import PacientesTable from './PacientesTable'; 
// Importa los tipos desde tu archivo types.ts
import type { PacienteConPropietario, PropietarioSimpleInfo } from './types'; 
import { AlertTriangle } from 'lucide-react';
// Asegúrate que la ruta a SearchInput sea correcta
import SearchInput from '../../../components/ui/SearchInput'; 

interface PacientesPageProps {
  searchParams?: {
    propietarioId?: string;
    q?: string; // Para el término de búsqueda de pacientes
  };
}

export const dynamic = 'force-dynamic';

export default async function PacientesPage({ searchParams }: PacientesPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const propietarioIdFilter = searchParams?.propietarioId;
  const searchQuery = searchParams?.q?.trim();
  let nombrePropietarioFiltrado: string | null = null;
  let filtroPropietarioActivo = !!propietarioIdFilter;

  // Definimos la cadena de selección base para reutilizarla
  const selectString = `
    id,
    nombre,
    especie,
    raza,
    fecha_nacimiento,
    sexo,
    propietarios (id, nombre_completo)
  `;

  let queryPacientes = supabase
    .from('pacientes')
    .select(selectString)
    .order('nombre', { ascending: true });

  if (propietarioIdFilter) {
    filtroPropietarioActivo = true; // Marcar que el filtro por propietario está activo
    queryPacientes = queryPacientes.eq('propietario_id', propietarioIdFilter);

    const { data: propietarioInfo, error: propietarioInfoError } = await supabase
      .from('propietarios')
      .select('nombre_completo')
      .eq('id', propietarioIdFilter)
      .single();

    if (propietarioInfoError && !propietarioInfo) {
      console.warn(`Propietario con ID ${propietarioIdFilter} no encontrado. Mostrando todos los pacientes si no hay búsqueda por nombre.`);
      // Si el propietario no existe, y no hay búsqueda por nombre, mostramos todos.
      // Si hay búsqueda por nombre, el filtro de nombre se aplicará a todos.
      if (!searchQuery) {
         queryPacientes = supabase.from('pacientes').select(selectString).order('nombre', { ascending: true });
         filtroPropietarioActivo = false; // Ya no estamos filtrando por un propietario específico
      }
    } else if (propietarioInfo) {
      nombrePropietarioFiltrado = propietarioInfo.nombre_completo;
    }
  }

  if (searchQuery) {
    queryPacientes = queryPacientes.ilike('nombre', `%${searchQuery}%`);
  }

  const { data: pacientesData, error } = await queryPacientes;

  if (error) {
    console.error('Error fetching pacientes:', error);
    return <p className="text-red-500">Error al cargar los pacientes: {error.message}.</p>;
  }
  
  // Mapeamos los datos para transformar 'propietarios' de array a objeto
  // y asegurar que todos los campos de PacienteConPropietario estén presentes.
  const pacientesProcesados: PacienteConPropietario[] = (pacientesData || []).map(p_raw => {
    let propietarioObjeto: PropietarioSimpleInfo | null = null;
    // Supabase devuelve la relación 'propietarios' como un objeto si es "a uno"
    // o como un array si la consulta podría devolver múltiples (aunque aquí esperamos uno).
    // El error de TypeScript sugiere que lo ve como un array.
    if (p_raw.propietarios) {
      if (Array.isArray(p_raw.propietarios) && p_raw.propietarios.length > 0) {
        propietarioObjeto = p_raw.propietarios[0] as PropietarioSimpleInfo;
      } else if (!Array.isArray(p_raw.propietarios)) {
        // Si no es un array, es el objeto directamente (comportamiento esperado para relación a uno)
        propietarioObjeto = p_raw.propietarios as PropietarioSimpleInfo;
      }
    }
    return {
      id: p_raw.id,
      nombre: p_raw.nombre,
      especie: p_raw.especie,
      raza: p_raw.raza,
      fecha_nacimiento: p_raw.fecha_nacimiento,
      sexo: p_raw.sexo, // Incluimos el sexo
      propietarios: propietarioObjeto,
    };
  });

  const pageTitle = nombrePropietarioFiltrado 
    ? `Pacientes de ${nombrePropietarioFiltrado}` 
    : searchQuery 
      ? `Resultados de búsqueda para "${searchQuery}"`
      : "Gestión de Pacientes";

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{pageTitle}</h1>
          {(filtroPropietarioActivo || searchQuery) && (
            <div className="mt-1">
              {filtroPropietarioActivo && !nombrePropietarioFiltrado && propietarioIdFilter && (
                 <p className="text-sm text-orange-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> El propietario del filtro (ID: {propietarioIdFilter.substring(0,8)}...) no fue encontrado.
                 </p>
              )}
              <Link href="/dashboard/pacientes" className="text-sm text-primary hover:underline">
                (Mostrar todos los pacientes / Limpiar filtros)
              </Link>
            </div>
          )}
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/pacientes/nuevo">Añadir Nuevo Paciente</Link>
        </Button>
      </div>

      <SearchInput 
        placeholder="Buscar paciente por nombre..." 
        initialQuery={searchQuery || ''}
        queryParamName="q"
      />
      
      {searchQuery && pacientesProcesados.length === 0 && !filtroPropietarioActivo && (
        <p className="text-muted-foreground mt-4 mb-4 text-center">
          No se encontraron pacientes que coincidan con &quot;{searchQuery}&quot;.
        </p>
      )}
      
      {/* Pasamos los pacientes procesados a la tabla */}
      <PacientesTable pacientes={pacientesProcesados} />
    </div>
  );
}
