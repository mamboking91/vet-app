// app/dashboard/pacientes/[pacienteId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import EditarPacienteForm from './EditarPacienteForm'; // Crearemos este componente a continuación
import type { PropietarioSimple } from '../../nuevo/page'; // Reutilizamos el tipo PropietarioSimple

// Definimos el tipo Paciente completo para esta página (o lo importamos)
// Asegúrate que incluya todos los campos que quieres editar.
export type PacienteCompleto = {
  id: string;
  nombre: string;
  propietario_id: string; // Necesitamos el ID del propietario actual para preseleccionar
  especie: string | null;
  raza: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  microchip_id: string | null;
  color: string | null;
  notas_adicionales: string | null;
  // foto_url: string | null; // Si vas a editar la foto
};

interface EditarPacientePageProps {
  params: {
    pacienteId: string; // Debe coincidir con el nombre de la carpeta dinámica [pacienteId]
  };
}

export const dynamic = 'force-dynamic';

export default async function EditarPacientePage({ params }: EditarPacientePageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { pacienteId } = params;

  // 1. Obtener los datos del paciente a editar
  const { data: paciente, error: pacienteError } = await supabase
    .from('pacientes')
    .select('*') // Seleccionamos todos los campos del paciente
    .eq('id', pacienteId)
    .single();

  if (pacienteError || !paciente) {
    console.error("Error fetching paciente for edit or paciente not found:", pacienteError);
    notFound(); // Muestra una página 404 si el paciente no se encuentra
  }

  // 2. Obtener la lista de todos los propietarios para el selector
  const { data: propietarios, error: propietariosError } = await supabase
    .from('propietarios')
    .select('id, nombre_completo')
    .order('nombre_completo', { ascending: true });

  if (propietariosError) {
    console.error("Error fetching propietarios for select:", propietariosError);
    // Considera cómo manejar este error. Quizás el formulario no pueda funcionar sin propietarios.
    // Por ahora, pasaremos un array vacío si hay error.
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          {/* Enlace para volver a la lista de pacientes o a la ficha del paciente si existiera */}
          <Link href="/dashboard/pacientes">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Editar Paciente: {paciente.nombre}</h1>
      </div>
      <EditarPacienteForm
        paciente={paciente as PacienteCompleto}
        propietarios={propietarios || []}
      />
    </div>
  );
}