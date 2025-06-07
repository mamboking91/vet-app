// src/app/dashboard/pacientes/[pacienteId]/historial/[historialId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import EditarHistorialForm from './EditarHistorialForm';
// --- CORRECCIÓN: La ruta de importación ahora apunta a 'facturacion/types' para ambos tipos ---
import type { ProcedimientoParaFactura, ProductoInventarioParaFactura } from '@/app/dashboard/facturacion/types';
import type { CitaDBRecord } from '@/app/dashboard/citas/types'; // Aunque no se usa directamente, es bueno para referencia


// Se extiende el tipo para incluir los items consumidos que se cargarán
export type HistorialMedicoEditableConItems = {
  id: string;
  paciente_id: string;
  fecha_evento: string;
  tipo: string;
  descripcion: string;
  diagnostico: string | null;
  tratamiento_indicado: string | null;
  notas_seguimiento: string | null;
  procedimientos_realizados: {
    procedimiento_id: string;
    cantidad: number;
  }[];
  consumed_items: {
    producto_id: string;
    cantidad: number;
  }[];
};

interface EditarHistorialPageProps {
  params: {
    pacienteId: string;
    historialId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function EditarHistorialPage({ params }: EditarHistorialPageProps) {
  const { pacienteId, historialId } = params;
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Obtener la entrada del historial y el nombre del paciente
  const { data: entradaHistorialData, error: historialError } = await supabase
    .from('historiales_medicos')
    .select('*, pacientes(nombre)')
    .eq('id', historialId)
    .eq('paciente_id', pacienteId)
    .single();

  if (historialError || !entradaHistorialData) {
    notFound();
  }

  // 2. Obtener catálogos para los selectores
  const { data: productosDisponiblesData } = await supabase
    .from('productos_inventario')
    .select('id, nombre, requiere_lote, precio_venta, porcentaje_impuesto');
  
  const { data: procedimientosDisponiblesData } = await supabase
    .from('procedimientos')
    .select('id, nombre, precio, porcentaje_impuesto');

  // 3. Obtener los productos consumidos desde la tabla de movimientos
  const { data: movimientosData } = await supabase
    .from('movimientos_inventario')
    .select('producto_id, cantidad')
    .eq('historial_id', historialId)
    .eq('tipo_movimiento', 'Salida Uso Interno');
  
  const consumed_items = (movimientosData || []).map(m => ({
    producto_id: m.producto_id,
    cantidad: m.cantidad
  }));

  // 4. Preparar los datos iniciales para el formulario
  const initialDataForForm: HistorialMedicoEditableConItems = {
    id: entradaHistorialData.id,
    paciente_id: entradaHistorialData.paciente_id,
    fecha_evento: entradaHistorialData.fecha_evento ? new Date(entradaHistorialData.fecha_evento).toISOString().split('T')[0] : '',
    tipo: entradaHistorialData.tipo || '',
    descripcion: entradaHistorialData.descripcion || '',
    diagnostico: entradaHistorialData.diagnostico || '',
    tratamiento_indicado: entradaHistorialData.tratamiento_indicado || '',
    notas_seguimiento: entradaHistorialData.notas_seguimiento || '',
    procedimientos_realizados: (entradaHistorialData.procedimientos_realizados as any[]) || [],
    consumed_items: consumed_items,
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href={`/dashboard/pacientes/${pacienteId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">
          Editar Entrada de Historial {entradaHistorialData.pacientes ? `para ${entradaHistorialData.pacientes.nombre}` : ''}
        </h1>
      </div>
      <EditarHistorialForm 
        entradaHistorial={initialDataForForm}
        pacienteId={pacienteId}
        productosDisponibles={(productosDisponiblesData || []) as ProductoInventarioParaFactura[]}
        procedimientosDisponibles={(procedimientosDisponiblesData || []) as ProcedimientoParaFactura[]}
      />
    </div>
  );
}
