import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import MedicionForm from './MedicionForm';

interface NuevaMedicionPageProps {
  params: { pacienteId: string };
}

export const dynamic = 'force-dynamic';

export default async function NuevaMedicionPage({ params }: NuevaMedicionPageProps) {
  const supabase = createServerComponentClient({ cookies: () => cookies() });
  const { data: paciente, error } = await supabase.from('pacientes').select('id, nombre').eq('id', params.pacienteId).single();
  if (error || !paciente) notFound();

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href={`/dashboard/pacientes/${paciente.id}`}><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-3xl font-bold">Nueva Medición para {paciente.nombre}</h1>
      </div>
      <MedicionForm pacienteId={paciente.id} />
    </div>
  );
}