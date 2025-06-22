// src/app/dashboard/citas/nueva/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import CitaForm from './CitaForm';
// --- CORRECCIÓN: Importamos el tipo correcto para pasar los datos al formulario ---
import type { PacienteConPropietario } from '../types'; 

export const dynamic = 'force-dynamic';

export default async function NuevaCitaPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Realizamos una única consulta para obtener los pacientes y sus propietarios anidados
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
    console.error("[NuevaCitaPage] Error fetching pacientes con propietarios:", pacientesError);
  }

  // --- CORRECCIÓN: Procesamos los datos manejando propietarios como array ---
  const pacientesParaSelector: PacienteConPropietario[] = (pacientesData || [])
    .map(p => {
      // Supabase devuelve propietarios como un array, tomamos el primer elemento
      const propietario = Array.isArray(p.propietarios) ? p.propietarios[0] : p.propietarios;
      return {
        paciente_id: p.id,
        paciente_nombre: `${p.nombre} (${p.especie || 'N/A'})`,
        propietario_id: propietario?.id || '',
        propietario_nombre: propietario?.nombre_completo || 'Propietario Desconocido',
      };
    })
    // Nos aseguramos de que solo se puedan seleccionar pacientes que tienen un propietario asignado
    .filter(p => p.propietario_id && p.propietario_nombre !== 'Propietario Desconocido'); 

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
      />
    </div>
  );
}