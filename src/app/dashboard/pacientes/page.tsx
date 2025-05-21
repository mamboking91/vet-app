// app/dashboard/pacientes/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import PacientesTable from './PacientesTable'; 
import type { PacienteConPropietario } from './types';

export const dynamic = 'force-dynamic';

export default async function PacientesPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: pacientesData, error } = await supabase
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

  if (error) {
    console.error('Error fetching pacientes:', error);
    return <p className="text-red-500">Error al cargar los pacientes: {error.message}. Por favor, revisa la consola del servidor.</p>;
  }
  
  const pacientes = (pacientesData || []) as PacienteConPropietario[];

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Pacientes</h1>
        <Button asChild>
          <Link href="/dashboard/pacientes/nuevo">Añadir Nuevo Paciente</Link>
        </Button>
      </div>
      <PacientesTable pacientes={pacientes} />
    </div>
  );
}
