// app/dashboard/citas/nueva/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import CitaForm from './CitaForm';
// Importa PacienteParaSelector desde el archivo centralizado de tipos
import type { PacienteParaSelector } from '../types'; 
// Ya no necesitamos importar tiposDeCitaOpciones o estadosDeCitaOpciones aquí
// si CitaForm.tsx los importa directamente desde '../types'.

export const dynamic = 'force-dynamic';

export default async function NuevaCitaPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtener la lista de pacientes con sus propietarios para el selector
  const { data: pacientesData, error: pacientesError } = await supabase
    .from('pacientes')
    .select(`
      id,
      nombre,
      especie,
      propietarios (id, nombre_completo) 
    `)
    .order('nombre', { ascending: true });

  if (pacientesError) {
    console.error("[NuevaCitaPage] Error fetching pacientes para select:", pacientesError);
    // Considera mostrar un mensaje de error o un estado vacío elegante para el selector
  }

  const pacientesParaSelector: PacienteParaSelector[] = (pacientesData || []).map(p => {
    // Accedemos a propietarios como un array, según el error de TS anterior
    const propietarioInfo = (p.propietarios && Array.isArray(p.propietarios) && p.propietarios.length > 0)
                              ? p.propietarios[0]
                              : null;
    const propietarioNombre = propietarioInfo?.nombre_completo || 'Propietario Desconocido';
    const especieInfo = p.especie ? `(${p.especie})` : '';
    return {
      id: p.id,
      nombre_display: `${p.nombre} ${especieInfo} - Dueño: ${propietarioNombre}`,
    };
  });

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/citas">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Programar Nueva Cita</h1>
      </div>
      <CitaForm 
        pacientes={pacientesParaSelector}
        // Ya no pasamos tiposDeCita ni estadosDeCita como props
        // si CitaForm.tsx los importa directamente desde '../types.ts'
        // (lo cual hicimos en la última versión de CitaForm.tsx)
      />
    </div>
  );
}