// app/dashboard/propietarios/[propietarioId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation'; // Para manejar el caso de propietario no encontrado
// Necesitaremos un formulario, podemos adaptar el PropietarioForm o crear uno nuevo
import EditarPropietarioForm from './editarpropietarioForm'; // Lo crearemos a continuación

// Definimos el tipo Propietario aquí también, o lo importamos de un archivo de tipos compartido
type Propietario = {
  id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  notas_adicionales: string | null;
};

export const dynamic = 'force-dynamic';

// Eliminamos la interfaz personalizada y usamos tipos directamente en la función
export default async function EditarPropietarioPage({ 
  params 
}: { 
  params: { propietarioId: string } 
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { propietarioId } = params;

  const { data: propietario, error } = await supabase
    .from('propietarios')
    .select('*') // Seleccionamos todos los campos para el formulario de edición
    .eq('id', propietarioId)
    .single(); // Esperamos un solo resultado

  if (error || !propietario) {
    console.error("Error fetching propietario for edit or propietario not found:", error);
    notFound(); // Muestra una página 404 si el propietario no se encuentra o hay un error
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Editar Propietario</h1>
      {/* Pasamos el propietario al formulario para pre-rellenar los campos */}
      <EditarPropietarioForm propietario={propietario as Propietario} />
    </div>
  );
}