// app/dashboard/facturacion/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import FacturasTable from './FacturasTable';
import type { FacturaParaTabla, FacturaCrudaDesdeSupabase } from './types'; 

export const dynamic = 'force-dynamic';

export default async function FacturacionPage() {
  // console.log("[FacturacionPage] INICIO - Obteniendo facturas...");

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
  
  // console.log("[FacturacionPage] Datos crudos de Supabase (facturasData):", JSON.stringify(facturasData, null, 2));

  // Hacemos cast a la estructura cruda que devuelve Supabase (propietarios ahora es objeto)
  const facturasCrudas = (facturasData || []) as FacturaCrudaDesdeSupabase[];
  
  // Transformamos los datos. Ahora 'facturaCruda.propietarios' ya es el objeto o null.
  const facturas: FacturaParaTabla[] = facturasCrudas.map((facturaCruda) => {
    // Ya no necesitamos la lógica para extraer de un array
    // const propietarioInfo = (facturaCruda.propietarios && facturaCruda.propietarios.length > 0)
    //   ? facturaCruda.propietarios[0]
    //   : null;
    
    // Log para depurar la estructura de propietarios en cada facturaCruda
    // if (facturaCruda.propietarios) {
    //   console.log(`[FacturacionPage] facturaCruda ID: ${facturaCruda.id}, facturaCruda.propietarios:`, JSON.stringify(facturaCruda.propietarios, null, 2));
    // }


    return {
      id: facturaCruda.id,
      numero_factura: facturaCruda.numero_factura,
      fecha_emision: facturaCruda.fecha_emision,
      fecha_vencimiento: facturaCruda.fecha_vencimiento,
      total: facturaCruda.total,
      estado: facturaCruda.estado,
      propietarios: facturaCruda.propietarios, // Directamente el objeto o null
    };
  });
  
  // console.log("[FacturacionPage] FIN - Facturas procesadas para la tabla (primeras 2):", JSON.stringify(facturas.slice(0,2), null, 2));

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
