// app/dashboard/facturacion/nueva/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import FacturaForm from './FacturaForm';
import type { 
  EntidadParaSelector,
  ProcedimientoParaFactura,
  ProductoInventarioParaFactura
} from '../types'; 

export const dynamic = 'force-dynamic';

export default async function NuevaFacturaPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Obtener lista de Propietarios
  const { data: propietariosData, error: propietariosError } = await supabase
    .from('propietarios').select('id, nombre_completo').order('nombre_completo', { ascending: true });
  if (propietariosError) console.error("Error fetching propietarios:", propietariosError);
  const propietariosParaSelector: EntidadParaSelector[] = (propietariosData || []).map(p => ({
    id: p.id,
    nombre: p.nombre_completo || 'Nombre no disponible',
  }));

  // 2. Obtener lista de Pacientes
  const { data: todosPacientesData, error: pacientesError } = await supabase
    .from('pacientes').select('id, nombre, propietario_id, especie').order('nombre', { ascending: true });
  if (pacientesError) console.error("Error fetching pacientes:", pacientesError);
  const pacientesParaSelector: (EntidadParaSelector & { propietario_id: string, especie?: string | null })[] = 
    (todosPacientesData || []).map(p_data => {
      // La consulta para pacientes NO anida propietarios aquí, así que no podemos mostrar el nombre del propietario
      // directamente desde p_data.propietarios. Si se quisiera, se necesitaría un join o una consulta anidada.
      // Por ahora, el nombre del paciente y su especie.
      const especieInfo = p_data.especie ? ` (${p_data.especie})` : '';
      return {
        id: p_data.id,
        nombre: `${p_data.nombre}${especieInfo}`, 
        propietario_id: p_data.propietario_id,
      };
  });

  // 3. Obtener Procedimientos del Catálogo
  // Asegúrate que tu tabla 'procedimientos' tenga 'precio' y 'porcentaje_impuesto'
  const { data: procedimientosData, error: procedimientosError } = await supabase
    .from('procedimientos')
    .select('id, nombre, precio, porcentaje_impuesto') 
    .order('nombre', { ascending: true });
  if (procedimientosError) console.error("Error fetching procedimientos:", procedimientosError);
  const procedimientosParaFactura: ProcedimientoParaFactura[] = (procedimientosData || []).map(p => ({
    id: p.id,
    nombre: p.nombre,
    precio: p.precio || 0, // Precio base
    porcentaje_impuesto: p.porcentaje_impuesto || 0, // % de impuesto
  }));

  // 4. Obtener Productos del Inventario (Catálogo)
  // Asegúrate que tu tabla 'productos_inventario' tenga 'precio_venta' y 'porcentaje_impuesto'
  const { data: productosInvData, error: productosInvError } = await supabase
    .from('productos_inventario') 
    .select('id, nombre, precio_venta, porcentaje_impuesto, requiere_lote') 
    .order('nombre', { ascending: true });
  if (productosInvError) console.error("Error fetching productos inventario:", productosInvError);
  const productosParaFactura: ProductoInventarioParaFactura[] = (productosInvData || []).map(p => ({
    id: p.id,
    nombre: p.nombre,
    precio_venta: p.precio_venta || 0, // Precio base
    porcentaje_impuesto: p.porcentaje_impuesto || 0, // % de impuesto
    requiere_lote: p.requiere_lote || false,
  }));

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/facturacion">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Crear Nueva Factura</h1>
      </div>
      <FacturaForm 
        propietarios={propietariosParaSelector}
        pacientes={pacientesParaSelector}
        procedimientosDisponibles={procedimientosParaFactura}
        productosDisponibles={productosParaFactura}
      />
    </div>
  );
}