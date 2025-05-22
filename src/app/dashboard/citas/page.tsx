// app/dashboard/citas/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { format, startOfDay, endOfDay, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Importaremos el nuevo componente para la vista de agenda y el selector de fecha
import CitasAgendaDiaria from './CitasAgendaDiaria'; 
import DatePickerClient from './DatePickerClient'; // Componente cliente para el calendario

import type { CitaConDetalles, PacienteInfo } from './types'; // Asumiendo que tienes types.ts

// Asegúrate de que estos tipos estén en app/dashboard/citas/types.ts y se exporten
/*
export type PacienteInfo = {
  id: string;
  nombre: string;
  propietarios: {
    id: string;
    nombre_completo: string | null;
  } | null; 
} | null; 

export type CitaConDetalles = {
  id: string;
  fecha_hora_inicio: string; 
  fecha_hora_fin: string | null;
  duracion_estimada_minutos: number | null;
  motivo: string | null;
  tipo: string | null; 
  estado: string;      
  pacientes: PacienteInfo; 
};
*/

export const dynamic = 'force-dynamic';

interface CitasPageProps {
  searchParams?: {
    fecha?: string; // YYYY-MM-DD
  };
}

export default async function CitasPage({ searchParams }: CitasPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Determinar la fecha para la que se mostrarán las citas
  let fechaSeleccionada: Date;
  if (searchParams?.fecha && isValid(parseISO(searchParams.fecha))) {
    fechaSeleccionada = parseISO(searchParams.fecha);
  } else {
    fechaSeleccionada = new Date(); // Por defecto, hoy
  }

  const inicioDelDia = startOfDay(fechaSeleccionada).toISOString();
  const finDelDia = endOfDay(fechaSeleccionada).toISOString();

  console.log(`[CitasPage] Buscando citas para ${format(fechaSeleccionada, 'yyyy-MM-dd')}: de ${inicioDelDia} a ${finDelDia}`);

  const { data: citasData, error } = await supabase
    .from('citas')
    .select(`
      id,
      fecha_hora_inicio,
      fecha_hora_fin,
      duracion_estimada_minutos,
      motivo,
      tipo,
      estado,
      pacientes (
        id,
        nombre,
        propietarios (
          id,
          nombre_completo
        )
      )
    `)
    .gte('fecha_hora_inicio', inicioDelDia)
    .lt('fecha_hora_inicio', finDelDia) // Citas que comiencen dentro del día seleccionado
    // .in('estado', ['Programada', 'Confirmada']) // Puedes mantener o quitar este filtro por ahora
    .order('fecha_hora_inicio', { ascending: true });

  if (error) {
    console.error('[CitasPage] Error fetching citas:', error);
    return <p className="text-red-500">Error al cargar las citas: {error.message}.</p>;
  }
  
  const citas = (citasData || []) as CitaConDetalles[];

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          Agenda de Citas para: {format(fechaSeleccionada, 'PPP', { locale: es })}
        </h1>
        <div className="flex items-center gap-4">
          {/* Componente Cliente para el DatePicker */}
          <DatePickerClient initialDate={fechaSeleccionada} />
          <Button asChild>
            <Link href="/dashboard/citas/nueva">
              <PlusCircle className="mr-2 h-5 w-5" />
              Programar Cita
            </Link>
          </Button>
        </div>
      </div>
      <CitasAgendaDiaria citas={citas} fechaSeleccionada={fechaSeleccionada} />
    </div>
  );
}