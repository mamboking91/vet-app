// app/dashboard/facturacion/[facturaId]/editar/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import FacturaForm from '../../nueva/FacturaForm';
import { 
  type EntidadParaSelector, 
  type FacturaHeaderFromDB, 
  type ItemFacturaFromDB,
  type FacturaHeaderFormData,
  type FacturaItemFormData,
  type ImpuestoItemValue
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

  const { data: facturaData, error: facturaError } = await supabase
    .from('facturas')
    .select(`
      *, 
      propietarios (id, nombre_completo), 
      pacientes (id, nombre) 
    `)
    .eq('id', facturaId)
    .single<FacturaHeaderFromDB>();

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

  const { data: itemsData, error: itemsError } = await supabase
    .from('items_factura')
    .select('*')
    .eq('factura_id', facturaId)
    .order('created_at', { ascending: true });

  if (itemsError) {
    console.error(`Error fetching items para factura ID ${facturaId} (editar):`, itemsError);
  }
  const itemsFactura = (itemsData || []) as ItemFacturaFromDB[];

  const { data: propietariosData, error: propietariosError } = await supabase
    .from('propietarios').select('id, nombre_completo').order('nombre_completo', { ascending: true });
  
  // --- CORRECCIÓN EN LA CONSULTA DE PACIENTES ---
  const { data: todosPacientesData, error: pacientesError } = await supabase
    .from('pacientes')
    .select('id, nombre, propietario_id, especie, propietarios (id, nombre_completo)') // <--- AÑADIDO propietarios (id, nombre_completo)
    .order('nombre', { ascending: true });

  if (propietariosError) console.error("Error fetching propietarios para form factura:", propietariosError);
  if (pacientesError) console.error("Error fetching pacientes para form factura:", pacientesError);

  const propietariosParaSelector: EntidadParaSelector[] = (propietariosData || []).map(p => ({
    id: p.id,
    nombre: p.nombre_completo || 'Nombre no disponible',
  }));

  const pacientesParaSelector: (EntidadParaSelector & { propietario_id: string, especie?: string | null })[] = 
    (todosPacientesData || []).map(p_data => { // Renombrado 'p' a 'p_data' para evitar confusión con la p interna
      // Asegúrate de que la estructura de p_data.propietarios es un objeto o un array de un solo objeto
      // Si Supabase devuelve un array para la relación "a uno":
      const propietarioAnidado = (p_data.propietarios && Array.isArray(p_data.propietarios) && p_data.propietarios.length > 0)
                                ? p_data.propietarios[0]
                                : (p_data.propietarios && !Array.isArray(p_data.propietarios) ? p_data.propietarios : null); // Si es objeto directo

      const propietarioNombre = propietarioAnidado?.nombre_completo || 'Propietario Desconocido';
      const especieInfo = p_data.especie ? ` (${p_data.especie})` : '';
      return {
        id: p_data.id,
        nombre: `${p_data.nombre}${especieInfo} - Dueño: ${propietarioNombre}`,
        propietario_id: p_data.propietario_id,
        especie: p_data.especie 
      };
  });
  
  const initialHeaderData: Partial<FacturaHeaderFormData> = {
    numero_factura: facturaData.numero_factura,
    propietario_id: facturaData.propietario_id,
    paciente_id: facturaData.paciente_id || undefined,
    fecha_emision: facturaData.fecha_emision ? format(parseISO(facturaData.fecha_emision), 'yyyy-MM-dd') : '',
    fecha_vencimiento: facturaData.fecha_vencimiento ? format(parseISO(facturaData.fecha_vencimiento), 'yyyy-MM-dd') : undefined,
    estado: facturaData.estado,
    notas_cliente: facturaData.notas_cliente || '',
    notas_internas: facturaData.notas_internas || '',
  };

  const initialItemsData: FacturaItemFormData[] = itemsFactura.map(item => ({
    id_temporal: item.id,
    descripcion: item.descripcion,
    cantidad: item.cantidad.toString(),
    precio_unitario: item.precio_unitario.toString(),
    porcentaje_impuesto_item: item.porcentaje_impuesto_item.toString() as ImpuestoItemValue,
  }));
  
  const initialDataForForm = {
    ...initialHeaderData,
    items: initialItemsData.length > 0 ? initialItemsData : [{ 
        id_temporal: crypto.randomUUID(), 
        descripcion: '', 
        cantidad: '1', 
        precio_unitario: '0', 
        porcentaje_impuesto_item: "7" 
    }]
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
        initialData={initialDataForForm}
        facturaId={facturaData.id}
      />
    </div>
  );
}