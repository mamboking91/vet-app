// app/dashboard/pacientes/[pacienteId]/historial/[historialId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import EditarHistorialForm from './EditarHistorialForm'; // Asume que EditarHistorialForm.tsx está en la misma carpeta 'editar'

// Tipo para los datos que el formulario de edición necesita
export type HistorialMedicoEditable = {
  id: string;
  paciente_id: string;
  fecha_evento: string; // Formato YYYY-MM-DD para el input date
  tipo: string;
  descripcion: string;
  diagnostico: string | null;
  tratamiento_indicado: string | null;
  notas_seguimiento: string | null;
};

interface EditarHistorialPageProps {
  params: {
    pacienteId: string;
    historialId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function EditarHistorialPage({ params }: EditarHistorialPageProps) {
  const { pacienteId, historialId } = params;
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Obtener datos de la entrada del historial a editar
  const { data: entradaHistorialData, error: historialError } = await supabase
    .from('historiales_medicos')
    .select('*')
    .eq('id', historialId)
    .eq('paciente_id', pacienteId) // Asegurar que la entrada pertenece al paciente correcto
    .single();

  // Imprime para depuración, revisa esto en la consola de tu servidor
  console.log(`Workspaceing historial entry: pacienteId=${pacienteId}, historialId=${historialId}`);
  if (historialError) {
    console.error("Supabase error fetching historial entry:", historialError);
  }
  if (!entradaHistorialData) {
    console.error("No data returned for historial entry.");
  }

  if (historialError || !entradaHistorialData) {
    notFound(); // Si no se encuentra la entrada o hay un error, devuelve 404
  }

  // Formatear fecha_evento a YYYY-MM-DD para el input type="date"
  // Es importante que entradaHistorialData.fecha_evento sea un string de fecha válido o null
  const entradaHistorialFormateada: HistorialMedicoEditable = {
    ...entradaHistorialData,
    fecha_evento: entradaHistorialData.fecha_evento ? new Date(entradaHistorialData.fecha_evento).toISOString().split('T')[0] : '',
  };
  
  // 2. Obtener el nombre del paciente para contexto (opcional pero útil)
  const { data: paciente, error: pacienteError } = await supabase
    .from('pacientes')
    .select('nombre')
    .eq('id', pacienteId)
    .single();

  if (pacienteError && !paciente) {
    console.warn("Paciente no encontrado para el contexto del título de edición del historial:", pacienteError);
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          {/* Volver a la página de detalles del paciente */}
          <Link href={`/dashboard/pacientes/${pacienteId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">
          Editar Entrada de Historial {paciente ? `para ${paciente.nombre}` : `del Paciente ID: ${pacienteId}`}
        </h1>
      </div>
      <EditarHistorialForm 
        entradaHistorial={entradaHistorialFormateada}
        pacienteId={pacienteId} 
      />
    </div>
  );
}