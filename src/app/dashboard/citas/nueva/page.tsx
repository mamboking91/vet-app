// app/dashboard/citas/nueva/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import CitaForm from './CitaForm'; // Crearemos este componente a continuación

// Tipo para los pacientes en el selector (nombre del paciente y nombre del propietario)
export type PacienteParaSelector = {
  id: string; // ID del paciente
  nombre_display: string; // "NombreMascota (Dueño: NombreDueño)"
};

// Valores del ENUM tipo_cita_opciones para pasar al formulario
// Podríamos importarlos desde actions.ts si lo exportamos de allí,
// o definirlos aquí si son estáticos y solo para este formulario.
// Por ahora, los redefinimos para claridad, pero considera centralizarlos.
const tiposDeCitaOpciones = [
  { value: "Consulta General", label: "Consulta General" },
  { value: "Vacunación", label: "Vacunación" },
  { value: "Desparasitación", label: "Desparasitación" },
  { value: "Revisión", label: "Revisión" },
  { value: "Cirugía Programada", label: "Cirugía Programada" },
  { value: "Urgencia", label: "Urgencia" },
  { value: "Peluquería", label: "Peluquería" },
  { value: "Otro", label: "Otro" },
] as const; // 'as const' es importante para z.enum si se usa en el cliente

export type TipoCitaOpcion = typeof tiposDeCitaOpciones[number]['value'];


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
      propietarios (
        nombre_completo
      )
    `)
    .order('nombre', { ascending: true });

  if (pacientesError) {
    console.error("Error fetching pacientes for select:", pacientesError);
    // Considera mostrar un error o un estado vacío elegante
  }

  const pacientesParaSelector: PacienteParaSelector[] = (pacientesData || []).map(p => {
    const propietarioNombre = p.propietarios?.nombre_completo || 'Propietario Desconocido';
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
        tiposDeCita={tiposDeCitaOpciones.map(t => t.value)} // Pasamos solo los valores para el enum de Zod si es necesario
                                                          // o el array completo de objetos para el Select
      />
    </div>
  );
}