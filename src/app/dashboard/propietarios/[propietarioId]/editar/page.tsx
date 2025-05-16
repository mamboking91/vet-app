// src/app/dashboard/propietarios/[propietarioId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import EditarPropietarioForm from './EditarPropietarioForm';

// Define el tipo Propietario (asegúrate que esté completo)
type Propietario = {
  id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  notas_adicionales: string | null;
  // otros campos que puedas necesitar o que devuelva select('*')
};

export const dynamic = 'force-dynamic';

// Cambiamos la forma de tipar las props: directamente en la firma de la función.
export default async function EditarPropietarioPage({
  params,
  // searchParams, // Puedes incluir searchParams si los usas, si no, puedes omitirlo.
}: {
  params: { propietarioId: string }; // 'propietarioId' debe coincidir con tu carpeta [propietarioId]
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  const { propietarioId } = params; // Accedemos a propietarioId desde params

  const { data: propietarioData, error } = await supabase
    .from('propietarios')
    .select('*') // Selecciona todos los campos para el formulario
    .eq('id', propietarioId)
    .single();

  if (error || !propietarioData) {
    console.error("Error fetching propietario for edit or propietario not found:", error);
    notFound();
  }

  // Type assertion después de verificar el error y los datos
  const propietario = propietarioData as Propietario;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Editar Propietario</h1>
      <EditarPropietarioForm propietario={propietario} />
    </div>
  );
}