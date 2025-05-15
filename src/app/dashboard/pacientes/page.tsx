// app/dashboard/pacientes/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
// Importaremos un componente de tabla para pacientes similar al de propietarios
import PacientesTable from './pacientesTable'; // Lo crearemos a continuación

// Definimos un tipo para los datos combinados de paciente y propietario
// que vamos a mostrar en la tabla.
export type PacienteConPropietario = {
  id: string;
  nombre: string;
  especie: string | null;
  raza: string | null;
  fecha_nacimiento: string | null; // Considera formatear esto para la vista
  propietarios: { // Este es el nombre de la relación como Supabase lo devuelve
    id: string; // Podríamos necesitar el ID del propietario para enlaces
    nombre_completo: string | null;
  } | null; // El propietario podría ser null si la relación lo permite (aunque la nuestra no)
};

export const dynamic = 'force-dynamic';

export default async function PacientesPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Fetching de datos: seleccionamos campos de 'pacientes'
  // y de la tabla relacionada 'propietarios', específicamente 'nombre_completo' e 'id'.
  // Supabase infiere la relación por la clave foránea.
  // La sintaxis 'tabla_relacionada (campo1, campo2)' es clave.
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
    return <p>Error al cargar los pacientes: {error.message}. Revisa la consola.</p>;
  }
  
  const pacientes = (pacientesData || []) as PacienteConPropietario[];

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Pacientes</h1>
        <Button asChild>
          <Link href="/dashboard/pacientes/nuevo">Añadir Nuevo Paciente</Link>
        </Button>
      </div>
      <PacientesTable pacientes={pacientes} />
    </div>
  );
}