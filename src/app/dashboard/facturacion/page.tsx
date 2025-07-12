// app/dashboard/facturacion/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import FacturasTable from './FacturasTable';
import type { FacturaParaTabla, FacturaCrudaDesdeSupabase, PropietarioInfoAnidadoFactura } from './types';
import SearchInput from '@/components/ui/SearchInput';

export const dynamic = 'force-dynamic';

interface FacturacionPageProps {
  searchParams?: {
    q?: string;
  };
}

export default async function FacturacionPage({ searchParams }: FacturacionPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const searchQuery = searchParams?.q?.trim();

  let query = supabase
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
    );

  // --- INICIO DE LA CORRECCIÓN ---
  // Lógica de búsqueda mejorada para evitar el error de parsing
  if (searchQuery) {
    const { data: propietariosIds, error: propietariosError } = await supabase
      .from('propietarios')
      .select('id')
      .ilike('nombre_completo', `%${searchQuery}%`);

    if (propietariosError) {
      console.error("[FacturacionPage] Error fetching propietario IDs for search:", propietariosError);
    }

    const matchingPropietarioIds = (propietariosIds || []).map(p => p.id);

    // Construir la cláusula OR
    // Si se encontraron propietarios, se busca por número de factura O por los IDs de esos propietarios.
    // Si no, se busca solo por número de factura.
    const orFilters = [
      `numero_factura.ilike.%${searchQuery}%`,
      ...(matchingPropietarioIds.length > 0 ? [`propietario_id.in.(${matchingPropietarioIds.join(',')})`] : [])
    ].join(',');

    if (orFilters) {
      query = query.or(orFilters);
    }
  }
  
  // Se añade el ordenamiento al final de la construcción de la consulta
  query = query.order('fecha_emision', { ascending: false }).order('numero_factura', { ascending: false });

  const { data: facturasData, error } = await query;
  // --- FIN DE LA CORRECCIÓN ---

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

  const facturasCrudas = (facturasData || []) as FacturaCrudaDesdeSupabase[];

  const facturas: FacturaParaTabla[] = facturasCrudas.map((facturaCruda) => {
    const propietarioInfo: PropietarioInfoAnidadoFactura | null =
      (facturaCruda.propietarios && !Array.isArray(facturaCruda.propietarios))
        ? (facturaCruda.propietarios as unknown as PropietarioInfoAnidadoFactura)
        : null;

    return {
      id: facturaCruda.id,
      numero_factura: facturaCruda.numero_factura,
      fecha_emision: facturaCruda.fecha_emision,
      fecha_vencimiento: facturaCruda.fecha_vencimiento,
      total: facturaCruda.total,
      estado: facturaCruda.estado,
      propietarios: propietarioInfo,
    };
  });

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Gestión de Facturación</h1>
        <Button asChild>
          <Link href="/dashboard/facturacion/nueva">
            <PlusCircle className="mr-2 h-5 w-5" />
            Crear Nueva Factura
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
            placeholder="Buscar por nº de factura o propietario..."
            initialQuery={searchQuery || ''}
            queryParamName="q"
        />
      </div>

      {searchQuery && facturas.length === 0 && (
        <p className="text-muted-foreground text-center my-4">
          No se encontraron facturas que coincidan con &quot;{searchQuery}&quot;.
        </p>
      )}

      <FacturasTable facturas={facturas} />
    </div>
  );
}