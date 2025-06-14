// app/dashboard/citas/[citaId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import CitaForm from '../../nueva/CitaForm';
import { 
  type PacienteParaSelector, 
  type CitaDBRecord,
  type CitaFormData
  // Ya no necesitamos importar tiposDeCitaOpciones ni estadosDeCitaOpciones aquí
  // si CitaForm los importa directamente.
} from '../../types'; 

interface EditarCitaPageProps {
  params: {
    citaId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function EditarCitaPage({ params }: EditarCitaPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { citaId } = params;

  if (!citaId || citaId === 'undefined' || citaId.length !== 36) {
    console.error("[EditarCitaPage] citaId es inválido:", citaId);
    notFound();
  }

  const { data: cita, error: citaError } = await supabase
    .from('citas')
    .select('*')
    .eq('id', citaId)
    .single<CitaDBRecord>();

  if (citaError || !cita) {
    console.error(`[EditarCitaPage] Error fetching cita con ID ${citaId} o no encontrada:`, citaError);
    notFound();
  }

  const { data: pacientesData, error: pacientesError } = await supabase
    .from('pacientes')
    .select('id, nombre, especie, propietarios (id, nombre_completo)')
    .order('nombre', { ascending: true });

  if (pacientesError) {
    console.error("[EditarCitaPage] Error fetching pacientes para el selector:", pacientesError);
  }

  const pacientesParaSelector: PacienteParaSelector[] = (pacientesData || []).map(p => {
    const propietarioInfo = (p.propietarios && Array.isArray(p.propietarios) && p.propietarios.length > 0)
                              ? p.propietarios[0]
                              : null;
    const propietarioNombre = propietarioInfo?.nombre_completo || 'Propietario Desconocido';
    const especieInfo = p.especie ? `(${p.especie})` : '';
    return {
      id: p.id,
      nombre_display: `${p.nombre} ${especieInfo} - Dueño: ${propietarioNombre || 'Desconocido'}`,
    };
  });
  
  const fechaInicio = cita.fecha_hora_inicio ? new Date(cita.fecha_hora_inicio) : null;
  let fechaHoraInicioFormato = '';
  if (fechaInicio) {
    const offset = fechaInicio.getTimezoneOffset() * 60000;
    const localDate = new Date(fechaInicio.getTime() - offset);
    fechaHoraInicioFormato = localDate.toISOString().slice(0, 16);
  }

  const initialDataForForm: Partial<CitaFormData> = {
    paciente_id: cita.paciente_id,
    fecha_hora_inicio: fechaHoraInicioFormato,
    duracion_estimada_minutos: cita.duracion_estimada_minutos?.toString() || '30',
    motivo: cita.motivo || '',
    tipo: cita.tipo || '',
    estado: cita.estado || 'Programada',
    notas_cita: cita.notas_cita || '',
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/citas">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">
          Editar Cita
        </h1>
      </div>
      <CitaForm 
        initialData={initialDataForForm}
        citaId={cita.id}
        pacientes={pacientesParaSelector}
        // --- LÍNEAS ELIMINADAS ---
        // tiposDeCita={tiposDeCitaValues} 
        // estadosDeCita={estadosDeCitaValues} 
      />
    </div>
  );
}