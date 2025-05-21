// app/dashboard/pacientes/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import PacientesTable from './PacientesTable'; 
import type { PacienteConPropietario } from './types'; // Importa desde tu archivo de tipos
import { AlertTriangle } from 'lucide-react'; // Para un mensaje si el propietario del filtro no se encuentra

export const dynamic = 'force-dynamic';

// Definimos las props que puede recibir la página, incluyendo searchParams
interface PacientesPageProps {
  // params es un objeto vacío para esta ruta específica, pero Next.js lo pasa
  params: {}; 
  searchParams?: {
    propietarioId?: string; // El ID del propietario por el que queremos filtrar
    // otros searchParams si los hubiera
  };
}

export default async function PacientesPage({ searchParams }: PacientesPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const propietarioIdFilter = searchParams?.propietarioId;
  let nombrePropietarioFiltrado: string | null = null;
  let filtroActivo = false;

  // Construimos la consulta base
  let queryPacientes = supabase
    .from('pacientes')
    .select(`
      id,
      nombre,
      especie,
      raza,
      fecha_nacimiento,
      propietarios (id, nombre_completo) 
    `)
    .order('nombre', { ascending: true });

  // Si hay un propietarioId en los searchParams, filtramos por él
  if (propietarioIdFilter) {
    filtroActivo = true;
    queryPacientes = queryPacientes.eq('propietario_id', propietarioIdFilter);

    // Opcional: Obtener el nombre del propietario para mostrar un título más descriptivo
    const { data: propietarioInfo, error: propietarioInfoError } = await supabase
      .from('propietarios')
      .select('nombre_completo')
      .eq('id', propietarioIdFilter)
      .single();

    if (propietarioInfoError) {
      console.error("Error fetching propietario for filter title:", propietarioInfoError);
      // No es un error crítico, simplemente no mostraremos el nombre
    }
    if (propietarioInfo) {
      nombrePropietarioFiltrado = propietarioInfo.nombre_completo;
    } else if (!propietarioInfoError) {
      // El ID del propietario en la URL no existe, podríamos mostrar un aviso
      console.warn(`Propietario con ID ${propietarioIdFilter} no encontrado para el filtro.`);
      // Los pacientes no se mostrarán debido al .eq() si el ID no es válido.
    }
  }

  const { data: pacientesData, error } = await queryPacientes;

  if (error) {
    console.error('Error fetching pacientes:', error);
    return <p className="text-red-500">Error al cargar los pacientes: {error.message}. Por favor, revisa la consola del servidor.</p>;
  }
  
  const pacientes = (pacientesData || []) as PacienteConPropietario[];

  const pageTitle = nombrePropietarioFiltrado 
    ? `Pacientes de ${nombrePropietarioFiltrado}` 
    : "Gestión de Pacientes";

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{pageTitle}</h1>
          {filtroActivo && (
            <div className="mt-1">
              {!nombrePropietarioFiltrado && propietarioIdFilter && (
                 <p className="text-sm text-orange-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> El propietario del filtro no fue encontrado.
                 </p>
              )}
              <Link href="/dashboard/pacientes" className="text-sm text-blue-600 hover:underline">
                (Mostrar todos los pacientes)
              </Link>
            </div>
          )}
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/pacientes/nuevo">Añadir Nuevo Paciente</Link>
        </Button>
      </div>
      <PacientesTable pacientes={pacientes} />
    </div>
  );
}