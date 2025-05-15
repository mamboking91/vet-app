// src/app/dashboard/propietarios/[propietarioId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import EditarPropietarioForm from './EditarPropietarioForm'; // Asegúrate que esta ruta sea correcta

// Define el tipo Propietario (o impórtalo si lo tienes en un archivo global de tipos)
type Propietario = {
  id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  notas_adicionales: string | null;
  // Asegúrate de que todos los campos que seleccionas de Supabase estén aquí
};

// Define la estructura de las props para esta página específica
// Esto es lo que Next.js pasará a tu componente de página
interface EditarPropietarioPageProps {
  params: {
    propietarioId: string; // El nombre debe coincidir con el nombre de la carpeta dinámica: [propietarioId]
  };
  searchParams?: { // Opcional, si no usas searchParams, puedes omitirlo
    [key: string]: string | string[] | undefined;
  };
}

// Esta directiva es importante para páginas que deben obtener datos en cada solicitud
export const dynamic = 'force-dynamic';

export default async function EditarPropietarioPage({ params }: EditarPropietarioPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  // Extraemos el propietarioId de params
  const { propietarioId } = params;

  const { data: propietarioData, error } = await supabase
    .from('propietarios')
    .select('*') // Selecciona todos los campos para el formulario
    .eq('id', propietarioId)
    .single(); // Esperamos un solo resultado

  if (error || !propietarioData) {
    console.error("Error fetching propietario for edit or propietario not found:", error);
    notFound(); // Muestra una página 404 si no se encuentra o hay error
  }

  // Hacemos un type assertion aquí después de verificar que no es null/undefined
  // y que no hubo error. Asegúrate que el tipo Propietario coincida
  // con los campos que devuelve .select('*').
  const propietario = propietarioData as Propietario;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Editar Propietario</h1>
      <EditarPropietarioForm propietario={propietario} />
    </div>
  );
}