// app/dashboard/facturacion/nueva/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import FacturaForm from './FacturaForm'; // Crearemos este componente a continuación
// Importamos el tipo EntidadParaSelector desde nuestro archivo de tipos de facturación
import type { EntidadParaSelector } from '../types'; 

export const dynamic = 'force-dynamic';

export default async function NuevaFacturaPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Obtener lista de Propietarios para el selector
  const { data: propietariosData, error: propietariosError } = await supabase
    .from('propietarios')
    .select('id, nombre_completo')
    .order('nombre_completo', { ascending: true });

  if (propietariosError) {
    console.error("Error fetching propietarios para nueva factura:", propietariosError);
    // Podrías mostrar un error o un estado vacío para el selector
  }
  const propietariosParaSelector: EntidadParaSelector[] = (propietariosData || []).map(p => ({
    id: p.id,
    nombre: p.nombre_completo || 'Nombre no disponible',
  }));


  // 2. Obtener lista de Pacientes para el selector
  // Incluimos propietario_id para poder filtrar pacientes por propietario en el cliente si es necesario,
  // o para mostrar más contexto en el selector.
  const { data: pacientesData, error: pacientesError } = await supabase
    .from('pacientes')
    .select('id, nombre, propietario_id, especie') // Añadimos especie para más contexto
    .order('nombre', { ascending: true });

  if (pacientesError) {
    console.error("Error fetching pacientes para nueva factura:", pacientesError);
  }
  const pacientesParaSelector: (EntidadParaSelector & { propietario_id: string, especie?: string | null })[] = 
    (pacientesData || []).map(p => ({
      id: p.id,
      nombre: `${p.nombre}${p.especie ? ` (${p.especie})` : ''}`,
      propietario_id: p.propietario_id,
      // especie: p.especie // Si quieres pasar la especie también
  }));


  // (Más adelante, podríamos obtener aquí listas de Procedimientos y Productos del Inventario)

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/facturacion"> {/* Volver a la lista de facturas */}
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Crear Nueva Factura</h1>
      </div>
      <FacturaForm 
        propietarios={propietariosParaSelector}
        pacientes={pacientesParaSelector} // Pasamos todos, el form podría filtrarlos por propietario
        // procedimientos={[]} // Placeholder para el futuro
        // productosInventario={[]} // Placeholder para el futuro
      />
    </div>
  );
}