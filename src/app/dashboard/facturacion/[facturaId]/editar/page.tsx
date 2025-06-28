// app/dashboard/facturacion/[facturaId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import FacturaForm from '../../nueva/FacturaForm';
import {
  type EntidadParaSelector,
  type FacturaHeaderFromDB,
  type ItemFacturaFromDB,    // Este tipo DEBE incluir procedimiento_id y producto_inventario_id como opcionales
  type FacturaHeaderFormData,
  type FacturaItemFormData,
  type ImpuestoItemValue,
  type ProcedimientoParaFactura,
  type ProductoInventarioParaFactura
} from '../../types';
import { format, parseISO, isValid } from 'date-fns';

interface EditarFacturaPageProps {
  params: {
    facturaId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function EditarFacturaPage({ params }: EditarFacturaPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { facturaId } = params;

  if (!facturaId || facturaId.length !== 36) {
    console.error("[EditarFacturaPage] facturaId inválido:", facturaId);
    notFound();
  }

  // Fetch all data in parallel
  const [
    facturaResult,
    itemsResult,
    propietariosResult,
    pacientesResult,
    procedimientosResult,
    productosResult
  ] = await Promise.all([
    supabase.from('facturas').select(`*, propietarios (id, nombre_completo), pacientes (id, nombre)`).eq('id', facturaId).single<FacturaHeaderFromDB>(),
    // ***** CAMBIO AQUÍ: Consulta explícita para items_factura *****
    supabase.from('items_factura')
      .select(`
        id,
        factura_id, 
        descripcion,
        cantidad,
        precio_unitario,
        base_imponible_item,
        porcentaje_impuesto_item,
        monto_impuesto_item,
        total_item,
        procedimiento_id,
        producto_inventario_id,
        lote_id,
        created_at 
      `)
      .eq('factura_id', facturaId)
      .order('created_at', { ascending: true }),
    // ***** FIN DEL CAMBIO *****
    supabase.from('propietarios').select('id, nombre_completo').order('nombre_completo', { ascending: true }),
    supabase.from('pacientes').select('id, nombre, propietario_id, especie').order('nombre', { ascending: true }),
    supabase.from('procedimientos').select('id, nombre, precio, porcentaje_impuesto').order('nombre', { ascending: true }),
    supabase.from('productos_inventario').select('id, nombre, precio_venta, porcentaje_impuesto, requiere_lote').order('nombre', { ascending: true })
  ]);

  const { data: facturaData, error: facturaError } = facturaResult;
  if (facturaError || !facturaData) {
    console.error(`Error fetching factura con ID ${facturaId} para editar:`, facturaError);
    notFound();
  }

  if (facturaData.estado !== 'Borrador') {
    return (
        <div className="container mx-auto py-10 px-4 md:px-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Factura no editable</h2>
            <p className="text-muted-foreground mb-6">
              La factura Nº {facturaData.numero_factura} tiene estado "{facturaData.estado}" y ya no puede ser modificada.
            </p>
            <Button asChild variant="outline">
                <Link href={`/dashboard/facturacion/${facturaId}`}>Volver a Detalles de Factura</Link>
            </Button>
        </div>
    );
  }

  const { data: itemsData, error: itemsError } = itemsResult;
  if (itemsError) console.error(`Error fetching items para factura ID ${facturaId} (editar):`, itemsError);
  const itemsFactura = (itemsData || []) as ItemFacturaFromDB[];

  const { data: propietariosData, error: propietariosError } = propietariosResult;
  if (propietariosError) console.error("Error fetching propietarios para form factura:", propietariosError);
  const propietariosParaSelector: EntidadParaSelector[] = (propietariosData || []).map(p => ({
    id: p.id, nombre: p.nombre_completo || 'N/A',
  }));

  const { data: todosPacientesData, error: pacientesError } = pacientesResult;
  if (pacientesError) console.error("Error fetching pacientes para form factura:", pacientesError);
  const pacientesParaSelector: (EntidadParaSelector & { propietario_id: string, especie?: string | null })[] =
    (todosPacientesData || []).map(p_data => ({
      id: p_data.id,
      nombre: `${p_data.nombre}${p_data.especie ? ` (${p_data.especie})` : ''}`,
      propietario_id: p_data.propietario_id,
  }));

  const { data: procedimientosData, error: procedimientosError } = procedimientosResult;
  if (procedimientosError) console.error("Error fetching procedimientos:", procedimientosError);
  const procedimientosParaFactura: ProcedimientoParaFactura[] = (procedimientosData || []).map(p => ({
    id: p.id, nombre: p.nombre, precio: p.precio || 0, porcentaje_impuesto: p.porcentaje_impuesto || 0,
  }));

  const { data: productosInvData, error: productosInvError } = productosResult;
  if (productosInvError) console.error("Error fetching productos inventario:", productosInvError);
  const productosParaFactura: ProductoInventarioParaFactura[] = (productosInvData || []).map(p => ({
    id: p.id, nombre: p.nombre, precio_venta: p.precio_venta || 0,
    porcentaje_impuesto: p.porcentaje_impuesto || 0, requiere_lote: p.requiere_lote || false,
  }));

  const initialHeaderData: Partial<FacturaHeaderFormData> = {
    numero_factura: facturaData.numero_factura,
    propietario_id: facturaData.propietario_id,
    paciente_id: facturaData.paciente_id || '',
    fecha_emision: facturaData.fecha_emision && isValid(parseISO(facturaData.fecha_emision)) ? format(parseISO(facturaData.fecha_emision), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    fecha_vencimiento: facturaData.fecha_vencimiento && isValid(parseISO(facturaData.fecha_vencimiento)) ? format(parseISO(facturaData.fecha_vencimiento), 'yyyy-MM-dd') : '',
    estado: facturaData.estado,
    notas_cliente: facturaData.notas_cliente || '',
    notas_internas: facturaData.notas_internas || '',
  };

  const initialItemsData: FacturaItemFormData[] = itemsFactura.map(itemDeDB => {
    let tipo_origen_item_determinado: 'manual' | 'procedimiento' | 'producto' = 'manual';

    if (itemDeDB.procedimiento_id && typeof itemDeDB.procedimiento_id === 'string') {
      tipo_origen_item_determinado = 'procedimiento';
    } else if (itemDeDB.producto_inventario_id && typeof itemDeDB.producto_inventario_id === 'string') {
      tipo_origen_item_determinado = 'producto';
    }

    return {
      id_temporal: itemDeDB.id,
      descripcion: itemDeDB.descripcion,
      cantidad: itemDeDB.cantidad.toString(),
      precio_unitario: itemDeDB.precio_unitario.toString(),
      porcentaje_impuesto_item: itemDeDB.porcentaje_impuesto_item.toString() as ImpuestoItemValue,
      tipo_origen_item: tipo_origen_item_determinado,
      procedimiento_id: itemDeDB.procedimiento_id || null,
      producto_inventario_id: itemDeDB.producto_inventario_id || null,
      lote_id: itemDeDB.lote_id || null,
    };
  });

  const defaultItem: FacturaItemFormData = {
    id_temporal: crypto.randomUUID(),
    descripcion: '',
    cantidad: '1',
    precio_unitario: '0',
    porcentaje_impuesto_item: "7" as ImpuestoItemValue,
    tipo_origen_item: 'manual' as const,
    procedimiento_id: null,
    producto_inventario_id: null,
    lote_id: null,
  };

  const initialDataForForm = {
    ...initialHeaderData,
    items: initialItemsData.length > 0 ? initialItemsData : [defaultItem]
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href={`/dashboard/facturacion/${facturaId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Editar Factura Nº: {facturaData.numero_factura}</h1>
      </div>
      <FacturaForm
        propietarios={propietariosParaSelector}
        pacientes={pacientesParaSelector}
        procedimientosDisponibles={procedimientosParaFactura}
        productosDisponibles={productosParaFactura}
        initialData={initialDataForForm}
        facturaId={facturaData.id}
        origen='manual'
      />
    </div>
  );
}