// app/dashboard/pacientes/[pacienteId]/historial/nuevo/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import HistorialMedicoForm from './HistorialMedicoForm'; // Crearemos este componente

interface NuevaEntradaHistorialPageProps {
  params: {
    pacienteId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function NuevaEntradaHistorialPage({ params }: NuevaEntradaHistorialPageProps) {
  const { pacienteId } = params;
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtener el nombre del paciente para mostrar en el título
  const { data: paciente, error: pacienteError } = await supabase
    .from('pacientes')
    .select('id, nombre')
    .eq('id', pacienteId)
    .single();

  if (pacienteError || !paciente) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href={`/dashboard/pacientes/${pacienteId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">
          Añadir Entrada al Historial de: {paciente.nombre}
        </h1>
      </div>
      {/* Pasamos pacienteId al formulario */}
      <HistorialMedicoForm pacienteId={paciente.id} />
    </div>
  );
}