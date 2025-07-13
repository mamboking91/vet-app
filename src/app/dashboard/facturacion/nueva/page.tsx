// src/app/dashboard/facturacion/nueva/page.tsx
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
  ProductoInventarioParaFactura,
  FacturaItemFormData,
  ImpuestoItemValue,
} from '../types'; 
import { format, parseISO, isValid } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function NuevaFacturaPage({ searchParams }: { searchParams?: { fromHistorial?: string }}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const historialId = searchParams?.fromHistorial;
  let initialDataForForm = {};
  let origenFactura: 'manual' | 'historial' = 'manual';

  const [propietariosResult, pacientesResult, procedimientosResult, productosResult] = await Promise.all([
    supabase.from('propietarios').select('id, nombre_completo').order('nombre_completo'),
    supabase.from('pacientes').select('id, nombre, propietario_id, especie').order('nombre'),
    supabase.from('procedimientos').select('id, nombre, precio, porcentaje_impuesto').order('nombre'),
    supabase.from('productos_inventario').select('id, nombre, precio_venta, porcentaje_impuesto, requiere_lote').order('nombre')
  ]);

  const propietariosParaSelector: EntidadParaSelector[] = (propietariosResult.data || []).map(p => ({
    id: p.id, nombre: p.nombre_completo || 'N/A',
  }));

  const pacientesParaSelector: (EntidadParaSelector & { propietario_id: string, especie?: string | null })[] = 
    (pacientesResult.data || []).map(p_data => ({
      id: p_data.id,
      nombre: `${p_data.nombre}${p_data.especie ? ` (${p_data.especie})` : ''}`,
      propietario_id: p_data.propietario_id,
  }));
  
  const procedimientosDisponibles: ProcedimientoParaFactura[] = (procedimientosResult.data || []);
  const productosDisponibles: ProductoInventarioParaFactura[] = (productosResult.data || []);

  if (historialId) {
    origenFactura = 'historial';
    const { data: historial } = await supabase
      .from('historiales_medicos')
      .select('*, pacientes(*, propietarios(id, nombre_completo))')
      .eq('id', historialId)
      .single();

    if (historial) {
      const items: FacturaItemFormData[] = [];
      
      const procedimientoPrincipal = procedimientosDisponibles.find(p => p.nombre === historial.tipo);
      if (procedimientoPrincipal) {
        items.push({
          id_temporal: crypto.randomUUID(),
          descripcion: historial.descripcion || historial.tipo,
          cantidad: "1",
          precio_unitario: (procedimientoPrincipal.precio ?? 0).toString(),
          porcentaje_impuesto_item: (procedimientoPrincipal.porcentaje_impuesto ?? 0).toString() as ImpuestoItemValue,
          tipo_origen_item: 'procedimiento',
          procedimiento_id: procedimientoPrincipal.id,
          producto_inventario_id: null,
          lote_id: null,
        });
      }

      if (historial.procedimientos_realizados && Array.isArray(historial.procedimientos_realizados)) {
        historial.procedimientos_realizados.forEach((procRealizado: any) => {
          const procDeCatalogo = procedimientosDisponibles.find(p => p.id === procRealizado.procedimiento_id);
          if (procDeCatalogo) {
            items.push({
              id_temporal: crypto.randomUUID(),
              descripcion: procDeCatalogo.nombre,
              cantidad: (procRealizado.cantidad || 1).toString(),
              precio_unitario: (procDeCatalogo.precio ?? 0).toString(),
              porcentaje_impuesto_item: (procDeCatalogo.porcentaje_impuesto ?? 0).toString() as ImpuestoItemValue,
              tipo_origen_item: 'procedimiento',
              procedimiento_id: procDeCatalogo.id,
              producto_inventario_id: null,
              lote_id: null,
            });
          }
        });
      }

      const { data: movimientos } = await supabase
        .from('movimientos_inventario')
        .select('cantidad, producto_id, productos_inventario(nombre, precio_venta, porcentaje_impuesto)')
        .eq('historial_id', historialId)
        .eq('tipo_movimiento', 'Salida Uso Interno');

      if (movimientos) {
        movimientos.forEach(mov => {
          const productoInfo = mov.productos_inventario && !Array.isArray(mov.productos_inventario) 
            ? mov.productos_inventario 
            : Array.isArray(mov.productos_inventario) && mov.productos_inventario.length > 0 
            ? mov.productos_inventario[0] 
            : null;

          if (productoInfo) {
            items.push({
              id_temporal: crypto.randomUUID(),
              descripcion: productoInfo.nombre,
              cantidad: mov.cantidad.toString(),
              precio_unitario: (productoInfo.precio_venta ?? 0).toString(),
              porcentaje_impuesto_item: (productoInfo.porcentaje_impuesto ?? 0).toString() as ImpuestoItemValue,
              tipo_origen_item: 'producto',
              producto_inventario_id: mov.producto_id,
              procedimiento_id: null,
              lote_id: null,
            });
          }
        });
      }
      
      initialDataForForm = {
        propietario_id: historial.pacientes?.propietarios?.id,
        paciente_id: historial.paciente_id,
        fecha_emision: format(new Date(), 'yyyy-MM-dd'),
        estado: 'Borrador',
        items: items,
      };
    } else {
        console.error(`Error: No se encontró el historial con ID: ${historialId}`);
    }
  }

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
        procedimientosDisponibles={procedimientosDisponibles}
        productosDisponibles={productosDisponibles}
        initialData={initialDataForForm}
        origen={origenFactura} 
        historialId={historialId} // <-- AÑADIDO
      />
    </div>
  );
}