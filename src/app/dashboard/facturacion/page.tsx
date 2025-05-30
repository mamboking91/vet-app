// app/dashboard/facturacion/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import FacturasTable from './FacturasTable';
// Importamos los tipos actualizados/nuevos
import type { FacturaParaTabla, FacturaCrudaDesdeSupabase } from './types'; 

export const dynamic = 'force-dynamic';

export default async function FacturacionPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: facturasData, error } = await supabase
    .from('facturas')
    .select(`
      id,
      numero_factura,
      fecha_emision,
      fecha_vencimiento,
      total,
      estado,
      propietarios (id, nombre_completo) 
    `)
    .order('fecha_emision', { ascending: false })
    .order('numero_factura', { ascending: false });

  if (error) {
    console.error("Error fetching facturas:", error);
    return <p className="text-red-500">Error al cargar las facturas: {error.message}.</p>;
  }
  
  // Hacemos cast a la estructura cruda que devuelve Supabase
  const facturasCrudas = (facturasData || []) as FacturaCrudaDesdeSupabase[];

  // Transformamos los datos para que 'propietarios' sea un objeto
  const facturas: FacturaParaTabla[] = facturasCrudas.map(facturaCruda => {
    const propietarioInfo = (facturaCruda.propietarios && facturaCruda.propietarios.length > 0)
      ? facturaCruda.propietarios[0]
      : null;
    return {
      id: facturaCruda.id,
      numero_factura: facturaCruda.numero_factura,
      fecha_emision: facturaCruda.fecha_emision,
      fecha_vencimiento: facturaCruda.fecha_vencimiento,
      total: facturaCruda.total,
      estado: facturaCruda.estado,
      propietarios: propietarioInfo, // Ahora es un objeto o null
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