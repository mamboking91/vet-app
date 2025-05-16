// app/dashboard/pacientes/nuevo/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import PacienteForm from './PacienteForm'; // Crearemos este componente a continuación
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react'; // Para un botón de "Volver"

// Tipo para los propietarios (solo necesitamos id y nombre para el selector)
export type PropietarioSimple = {
  id: string;
  nombre_completo: string;
};

export const dynamic = 'force-dynamic';

export default async function NuevoPacientePage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtener la lista de propietarios para el selector
  const { data: propietarios, error: propietariosError } = await supabase
    .from('propietarios')
    .select('id, nombre_completo')
    .order('nombre_completo', { ascending: true });

  if (propietariosError) {
    console.error("Error fetching propietarios for select:", propietariosError);
    // Podrías manejar este error mostrando un mensaje al usuario
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/pacientes">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Añadir Nuevo Paciente</h1>
      </div>
      <PacienteForm propietarios={propietarios || []} />
    </div>
  );
}