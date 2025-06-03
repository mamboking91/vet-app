// app/dashboard/facturacion/[facturaId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation'; // redirect no se usa aquí
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import FacturaForm from '../../nueva/FacturaForm'; // Reutilizamos el formulario
import { 
  type EntidadParaSelector, 
  type FacturaHeaderFromDB, 
  type ItemFacturaFromDB,    // Asegúrate que este tipo incluya procedimiento_id y producto_inventario_id
  type FacturaHeaderFormData,
  type FacturaItemFormData,
  type ImpuestoItemValue,
  type ProcedimientoParaFactura,    // Para la lista de procedimientos
  type ProductoInventarioParaFactura // Para la lista de productos
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

  // Usamos Promise.all para obtener todos los datos necesarios en paralelo
  const [
    facturaResult,
    itemsResult,
    propietariosResult,
    pacientesResult,
    procedimientosResult,
    productosResult
  ] = await Promise.all([
    supabase.from('facturas').select(`*, propietarios (id, nombre_completo), pacientes (id, nombre)`).eq('id', facturaId).single<FacturaHeaderFromDB>(),
    supabase.from('items_factura').select('*, procedimiento_id, producto_inventario_id, lote_id').eq('factura_id', facturaId).order('created_at', { ascending: true }),
    supabase.from('propietarios').select('id, nombre_completo').order('nombre_completo', { ascending: true }),
    supabase.from('pacientes').select('id, nombre, propietario_id, especie').order('nombre', { ascending: true }), // Quitamos el join anidado innecesario aquí si solo es para el selector
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
  const itemsFactura = (itemsData || []) as ItemFacturaFromDB[]; // ItemFacturaFromDB debe incluir los nuevos campos

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
  
  // Preparamos initialData para FacturaForm
  const initialHeaderData: Partial<FacturaHeaderFormData> = {
    numero_factura: facturaData.numero_factura,
    propietario_id: facturaData.propietario_id,
    paciente_id: facturaData.paciente_id || '',
    fecha_emision: facturaData.fecha_emision ? format(parseISO(facturaData.fecha_emision), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    fecha_vencimiento: facturaData.fecha_vencimiento ? format(parseISO(facturaData.fecha_vencimiento), 'yyyy-MM-dd') : '',
    estado: facturaData.estado,
    notas_cliente: facturaData.notas_cliente || '',
    notas_internas: facturaData.notas_internas || '',
  };

  const initialItemsData: FacturaItemFormData[] = itemsFactura.map(item => {
    let tipo_origen_item: 'manual' | 'procedimiento' | 'producto' = 'manual';
    if (item.procedimiento_id) tipo_origen_item = 'procedimiento';
    else if (item.producto_inventario_id) tipo_origen_item = 'producto';

    return {
      id_temporal: item.id, // Usamos el ID real del ítem de la BD
      descripcion: item.descripcion,
      cantidad: item.cantidad.toString(),
      precio_unitario: item.precio_unitario.toString(), // Precio base
      porcentaje_impuesto_item: item.porcentaje_impuesto_item.toString() as ImpuestoItemValue,
      tipo_origen_item: tipo_origen_item,
      procedimiento_id: item.procedimiento_id || null,
      producto_inventario_id: item.producto_inventario_id || null,
      lote_id: item.lote_id || null, // Si lo tuvieras
    };
  });
  
  // Definir el item por defecto con el tipo correcto
  const defaultItem: FacturaItemFormData = { 
    id_temporal: crypto.randomUUID(), 
    descripcion: '', 
    cantidad: '1', 
    precio_unitario: '0', 
    porcentaje_impuesto_item: "7" as ImpuestoItemValue, // Especificamos el tipo
    tipo_origen_item: 'manual' as const, // Especificamos como literal type
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
        procedimientosDisponibles={procedimientosParaFactura} // Pasamos los procedimientos
        productosDisponibles={productosParaFactura}       // Pasamos los productos
        initialData={initialDataForForm}
        facturaId={facturaData.id}
      />
    </div>
  );
}