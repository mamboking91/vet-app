// app/dashboard/facturacion/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import FacturasTable from './FacturasTable';
// El tipo PropietarioInfoAnidadoFactura se importa ahora correctamente desde types.ts
import type { FacturaParaTabla, FacturaCrudaDesdeSupabase, PropietarioInfoAnidadoFactura } from './types';

export const dynamic = 'force-dynamic';

export default async function FacturacionPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: facturasData, error } = await supabase
    .from('facturas')
    .select(
      `
        id,
        numero_factura,
        fecha_emision,
        fecha_vencimiento,
        total,
        estado,
        propietario_id,
        propietarios (id, nombre_completo)
      `
    )
    .order('fecha_emision', { ascending: false })
    .order('numero_factura', { ascending: false });

  if (error) {
    console.error("[FacturacionPage] Error fetching facturas:", error);
    return (
        <div className="container mx-auto py-10 px-4 md:px-6">
            <p className="text-red-500">Error al cargar las facturas: {error.message}</p>
            <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
        </div>
    );
  }

  // Ahora FacturaCrudaDesdeSupabase espera propietarios como PropietarioInfoAnidadoFactura[] | null
  const facturasCrudas = (facturasData || []) as FacturaCrudaDesdeSupabase[];

  const facturas: FacturaParaTabla[] = facturasCrudas.map((facturaCruda) => {
    // *** CORRECCIÓN AQUÍ: Tomar el primer propietario del array si existe ***
    const propietarioInfo: PropietarioInfoAnidadoFactura | null =
      (facturaCruda.propietarios && Array.isArray(facturaCruda.propietarios) && facturaCruda.propietarios.length > 0)
        ? facturaCruda.propietarios[0]
        // Si por alguna razón Supabase devolviera un objeto en lugar de un array (aunque el error TS indica array),
        // esta línea lo manejaría. Pero es principalmente para el caso del array.
        : (facturaCruda.propietarios && !Array.isArray(facturaCruda.propietarios) 
            ? (facturaCruda.propietarios as unknown as PropietarioInfoAnidadoFactura) // Cast a unknown primero si es necesario
            : null);


    return {
      id: facturaCruda.id,
      numero_factura: facturaCruda.numero_factura,
      fecha_emision: facturaCruda.fecha_emision,
      fecha_vencimiento: facturaCruda.fecha_vencimiento,
      total: facturaCruda.total,
      estado: facturaCruda.estado,
      propietarios: propietarioInfo, // Asignar el objeto único o null
    };
  });

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Facturación</h1>
        <Button asChild>
          <Link href="/dashboard/facturacion/nueva">
            <PlusCircle className="mr-2 h-5 w-5" />
            Crear Nueva Factura
          </Link>
        </Button>
      </div>
      <FacturasTable facturas={facturas} />
    </div>
  );
}