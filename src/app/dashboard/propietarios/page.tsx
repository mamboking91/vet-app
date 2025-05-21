// app/dashboard/propietarios/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
// Corregimos el nombre del componente importado para que coincida con el nombre del archivo/componente (asumiendo PascalCase)
import PropietariosTable from './PropietarioTable'; 

// Actualizamos el tipo Propietario para incluir el conteo de mascotas
// Lo exportamos para que PropietariosTable.tsx pueda usarlo también.
export type PropietarioConMascotas = {
  id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  pacientes_count: number; // Nuevo campo para el conteo de mascotas
};

export const dynamic = 'force-dynamic';

export default async function PropietariosPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Modificamos la consulta para incluir el conteo de pacientes
  const { data: propietariosData, error } = await supabase
    .from('propietarios')
    .select('id, nombre_completo, email, telefono, pacientes(count)') // Añadimos pacientes(count)
    .order('nombre_completo', { ascending: true });

  if (error) {
    console.error('Error fetching propietarios con conteo de mascotas:', error);
    return <p>Error al cargar los propietarios: {error.message}. Revisa la consola.</p>;
  }
  
  // Procesamos los datos para extraer el conteo de forma más accesible
  const propietariosConConteo = (propietariosData || []).map(propietario => {
    // Supabase devuelve el conteo como un array con un objeto: pacientes: [{ count: N }]
    // o simplemente pacientes: null si no hay relaciones o la tabla es vacía.
    // En otros casos, si la tabla 'pacientes' no existe o no tiene registros, podría ser un array vacío.
    const countArray = propietario.pacientes as unknown as ({ count: number }[] | null);
    return {
      ...propietario,
      pacientes_count: countArray && countArray.length > 0 ? countArray[0].count : 0,
    };
  });

  return (
    <div className="container mx-auto py-10 px-4 md:px-6"> {/* Añadido padding responsivo */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Propietarios</h1> {/* Títulos responsivos */}
        <Button asChild>
          <Link href="/dashboard/propietarios/nuevo">Añadir Nuevo Propietario</Link>
        </Button>
      </div>
      {/* Pasamos los datos procesados al componente de tabla */}
      <PropietariosTable propietarios={propietariosConConteo as PropietarioConMascotas[]} />
    </div>
  );
}