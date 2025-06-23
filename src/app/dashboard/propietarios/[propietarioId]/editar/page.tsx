// src/app/dashboard/propietarios/[propietarioId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import EditarPropietarioForm from './EditarPropietarioForm';
// --- CORRECCIÓN: Importamos el tipo Propietario desde el archivo central de tipos ---
import type { Propietario } from '../../types';

export const dynamic = 'force-dynamic';

export default async function EditarPropietarioPage({
  params,
}: {
  params: { propietarioId: string };
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  const { propietarioId } = params;

  const { data: propietarioData, error } = await supabase
    .from('propietarios')
    .select('*')
    .eq('id', propietarioId)
    .single();

  if (error || !propietarioData) {
    console.error("Error fetching propietario for edit or propietario not found:", error);
    notFound();
  }

  // Ahora 'propietarioData' coincidirá con el tipo 'Propietario' importado
  const propietario = propietarioData as Propietario;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Editar Propietario</h1>
      {/* El prop 'propietario' ahora tiene el tipo correcto y completo */}
      <EditarPropietarioForm propietario={propietario} />
    </div>
  );
}