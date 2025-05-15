// app/dashboard/propietarios/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import PropietariosTable from './PropietarioTable'; // Importa el nuevo componente de tabla

// El tipo Propietario puede definirse aquí o importarse de un archivo compartido
type Propietario = {
  id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
};

export const dynamic = 'force-dynamic';

export default async function PropietariosPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: propietariosData, error } = await supabase
    .from('propietarios')
    .select('id, nombre_completo, email, telefono')
    .order('nombre_completo', { ascending: true });

  if (error) {
    console.error('Error fetching propietarios:', error);
    return <p>Error al cargar los propietarios: {error.message}. Revisa la consola.</p>;
  }
  
  // Aseguramos que propietariosData no sea null para pasarlo al componente
  const propietarios = propietariosData || [];

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Propietarios</h1>
        <Button asChild>
          <Link href="/dashboard/propietarios/nuevo">Añadir Nuevo Propietario</Link>
        </Button>
      </div>
      {/* Usa el componente PropietariosTable y pásale los datos */}
      <PropietariosTable propietarios={propietarios as Propietario[]} />
    </div>
  );
}