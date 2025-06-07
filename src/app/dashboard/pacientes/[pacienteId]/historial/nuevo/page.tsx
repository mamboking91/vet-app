// src/app/dashboard/pacientes/[pacienteId]/historial/nuevo/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import HistorialMedicoForm from './HistorialMedicoForm';
// --- CORRECCIÓN: La ruta de importación ahora apunta a 'facturacion/types' ---
import type { ProductoInventarioParaFactura, ProcedimientoParaFactura } from '@/app/dashboard/facturacion/types';

interface NuevaEntradaHistorialPageProps {
  params: {
    pacienteId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function NuevaEntradaHistorialPage({ params }: NuevaEntradaHistorialPageProps) {
  const { pacienteId } = params;
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtener el nombre del paciente para mostrar en el título
  const { data: paciente, error: pacienteError } = await supabase
    .from('pacientes')
    .select('id, nombre')
    .eq('id', pacienteId)
    .single();

  if (pacienteError || !paciente) {
    notFound();
  }

  // Obtener productos del inventario para el selector
  const { data: productosData, error: productosError } = await supabase
    .from('productos_inventario')
    .select('id, nombre, requiere_lote, precio_venta, porcentaje_impuesto')
    .order('nombre', { ascending: true });

  if (productosError) {
    console.error("Error fetching productos para historial:", productosError);
  }
  const productosDisponibles = (productosData || []) as ProductoInventarioParaFactura[];

  // Obtener procedimientos del catálogo
  const { data: procedimientosData, error: procedimientosError } = await supabase
    .from('procedimientos')
    .select('id, nombre, precio, porcentaje_impuesto')
    .order('nombre', { ascending: true });

  if (procedimientosError) {
    console.error("Error fetching procedimientos para historial:", procedimientosError);
  }
  const procedimientosDisponibles = (procedimientosData || []) as ProcedimientoParaFactura[];

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href={`/dashboard/pacientes/${pacienteId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">
          Añadir Entrada al Historial de: {paciente.nombre}
        </h1>
      </div>
      <HistorialMedicoForm 
        pacienteId={paciente.id} 
        productosDisponibles={productosDisponibles}
        procedimientosDisponibles={procedimientosDisponibles}
      />
    </div>
  );
}
