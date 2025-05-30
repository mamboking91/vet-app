// app/dashboard/facturacion/[facturaId]/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Printer, DollarSignIcon, Edit3Icon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import PrintButton from './PrintButton';
import type { EstadoFacturaPagoValue } from '../types'; 
import type { ClinicData } from '../../configuracion/types'; // Ajusta la ruta si tu types.ts de config está en otro lugar

// Tipo para la cabecera de la factura con detalles
type FacturaDetalleHeader = {
  id: string;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  propietario_id: string; 
  paciente_id: string | null;  
  subtotal: number;
  porcentaje_impuesto: number | null; // Este campo ya no existe en la tabla 'facturas'
  monto_impuesto: number;
  total: number;
  estado: EstadoFacturaPagoValue;
  notas_cliente: string | null;
  notas_internas: string | null;
  desglose_impuestos: { [tasaKey: string]: { base: number; impuesto: number; }; } | null; // Para el JSONB
  propietarios: { id: string; nombre_completo: string | null } | null;
  pacientes: { id: string; nombre: string | null } | null;
  created_at: string;
  updated_at: string | null;
};

// Tipo para un ítem de factura
type ItemFacturaDetalle = { 
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number; // Precio base
  base_imponible_item: number;
  porcentaje_impuesto_item: number;
  monto_impuesto_item: number;
  total_item: number;
};

// Tipo para un pago
type PagoFacturaDetalle = { 
    id: string;
    fecha_pago: string;
    monto_pagado: number;
    metodo_pago: string | null;
    referencia_pago: string | null;
    notas: string | null;
};

interface DetalleFacturaPageProps {
  params: {
    facturaId: string;
  };
}

const formatCurrency = (amount: number | null | undefined): string => { 
  if (typeof amount !== 'number' || isNaN(amount)) return '0,00 €';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

const getEstadoFacturaBadgeVariant = (estado?: EstadoFacturaPagoValue | string | null): "default" | "destructive" | "outline" | "secondary" => { 
  switch (estado?.toLowerCase()) {
    case 'borrador': return "outline";
    case 'pendiente': case 'vencida': return "secondary"; 
    case 'pagada parcialmente': return "default"; 
    case 'pagada': return "default";
    case 'anulada': return "destructive";
    default: return "secondary";
  }
}; // Punto y coma aquí es buena práctica

export const dynamic = 'force-dynamic';

export default async function DetalleFacturaPage({ params }: DetalleFacturaPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { facturaId } = params;

  if (!facturaId || facturaId.length !== 36) { 
    console.error("[DetalleFacturaPage] facturaId inválido en params:", facturaId);
    notFound(); 
  }

  const [
    facturaResult,
    itemsResult,
    pagosResult,
    datosClinicaResult
  ] = await Promise.all([
    supabase.from('facturas').select(`
      id, numero_factura, fecha_emision, fecha_vencimiento, propietario_id, paciente_id, 
      subtotal, monto_impuesto, total, estado, notas_cliente, notas_internas, desglose_impuestos,
      created_at, updated_at,
      propietarios (id, nombre_completo), 
      pacientes (id, nombre)
    `).eq('id', facturaId).single<FacturaDetalleHeader>(),
    supabase.from('items_factura').select(
      'id, descripcion, cantidad, precio_unitario, base_imponible_item, porcentaje_impuesto_item, monto_impuesto_item, total_item'
    ).eq('factura_id', facturaId).order('created_at', { ascending: true }),
    supabase.from('pagos_factura').select('*').eq('factura_id', facturaId).order('fecha_pago', { ascending: false }),
    supabase.from('datos_clinica').select('*').eq('id', true).maybeSingle<ClinicData>()
  ]);

  const { data: factura, error: facturaError } = facturaResult;
  if (facturaError || !factura) {
    console.error(`[DetalleFacturaPage] Error fetching factura con ID ${facturaId}:`, facturaError);
    notFound();
  }

  const { data: itemsData, error: itemsError } = itemsResult;
  if (itemsError) {
    console.error(`[DetalleFacturaPage] Error fetching items para factura ID ${facturaId}:`, itemsError);
  }
  const items = (itemsData || []) as ItemFacturaDetalle[];

  const { data: pagosData, error: pagosError } = pagosResult;
  if (pagosError) {
    console.error(`[DetalleFacturaPage] Error fetching pagos para factura ID ${facturaId}:`, pagosError);
  }
  const pagos = (pagosData || []) as PagoFacturaDetalle[];
  
  const { data: datosClinica, error: datosClinicaError } = datosClinicaResult;
  if (datosClinicaError) {
      console.error("[DetalleFacturaPage] Error fetching datos de la clínica:", datosClinicaError);
  }
  // Esta es la línea 101 en tu error si el código anterior es igual.
  // La lógica de obtención de datos termina aquí.
  // El error "Expected '}', got '<eof>'" sugiere que la llave de cierre de la función DetalleFacturaPage falta.

  return ( // Línea 103 si el código anterior es igual
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-4xl print:py-4 print:px-2"> {/* Línea 104 */}
      <div className="flex items-center mb-6 print:hidden">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/facturacion"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Factura {factura.numero_factura}</h1>
        <div className="ml-auto flex items-center gap-2">
            {factura.estado === 'Borrador' && (
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/facturacion/${factura.id}/editar`}>
                        <Edit3Icon className="mr-2 h-4 w-4" /> Editar
                    </Link>
                </Button>
            )}
            <PrintButton />
        </div>
      </div>

      <Card className="mb-6 print:shadow-none print:border-none">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start">
              <div className="w-full sm:w-2/3 mb-4 sm:mb-0">
                {datosClinica?.logo_url && (
                  <div className="mb-3">
                    <Image src={datosClinica.logo_url} alt={`Logo de ${datosClinica.nombre_clinica || 'Clínica'}`} width={160} height={80} className="object-contain print:max-h-16" />
                  </div>
                )}
                <h2 className="text-xl font-semibold">{datosClinica?.nombre_clinica || "Nombre de Clínica"}</h2>
                <p className="text-xs text-muted-foreground">{datosClinica?.direccion_completa || "Dirección"}</p>
                <p className="text-xs text-muted-foreground">{datosClinica?.codigo_postal || ""} {datosClinica?.ciudad || ""} {datosClinica?.provincia && `(${datosClinica.provincia})`}</p>
                <p className="text-xs text-muted-foreground">Tel: {datosClinica?.telefono_principal || "N/A"}</p>
                <p className="text-xs text-muted-foreground">Email: {datosClinica?.email_contacto || "N/A"}</p>
                <p className="text-xs text-muted-foreground">NIF/CIF: {datosClinica?.nif_cif || "N/A"}</p>
              </div>
              <div className="w-full sm:w-1/3 text-left sm:text-right mt-4 sm:mt-0">
                <h3 className="text-md font-semibold mb-1">Factura a:</h3>
                {factura.propietarios?.id ? (
                     <Link href={`/dashboard/propietarios/${factura.propietarios.id}/editar`} className="text-sm text-primary hover:underline block">{factura.propietarios.nombre_completo || 'Cliente'}</Link>
                ) : (<p className="text-sm">{factura.propietarios?.nombre_completo || 'Cliente'}</p>)}
              </div>
            </div>
        </CardHeader>
        <CardContent className="text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 pt-4 border-t mt-4">
                <div><p className="font-semibold text-muted-foreground">Nº Factura:</p><p>{factura.numero_factura}</p></div>
                <div><p className="font-semibold text-muted-foreground">Fecha Emisión:</p><p>{factura.fecha_emision ? format(parseISO(factura.fecha_emision), 'PPP', { locale: es }) : 'N/A'}</p></div>
                {factura.fecha_vencimiento && (<div><p className="font-semibold text-muted-foreground">Fecha Vencimiento:</p><p>{format(parseISO(factura.fecha_vencimiento), 'PPP', { locale: es })}</p></div>)}
                <div className={factura.fecha_vencimiento ? "" : "col-start-2 sm:col-start-auto"}><p className="font-semibold text-muted-foreground">Estado:</p>
                    <Badge 
                        variant={getEstadoFacturaBadgeVariant(factura.estado)}
                        className={cn("text-xs",
                            factura.estado === 'Pagada' && 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border-green-400',
                            factura.estado === 'Vencida' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 border-yellow-400',
                            factura.estado === 'Pagada Parcialmente' && 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 border-blue-400',
                            factura.estado === 'Anulada' && 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 border-red-400'
                        )}
                    >{factura.estado}</Badge>
                </div>
            </div>
            {factura.pacientes?.id && factura.pacientes.nombre && (
                  <div className="mt-2 text-sm">
                    <span className="font-semibold text-muted-foreground">Paciente Atendido:</span> {factura.pacientes.nombre}
                    <Link href={`/dashboard/pacientes/${factura.pacientes.id}`} className="ml-2 text-xs text-primary hover:underline">(ver ficha)</Link>
                  </div>
            )}
        </CardContent>
      </Card>

      <section className="mb-8 print:mb-6">
        <h3 className="text-lg font-semibold mb-2">Detalle de la Factura</h3>
        <div className="border rounded-md overflow-hidden print:border-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%] print:w-[40%]">Descripción</TableHead>
                <TableHead className="text-center w-[10%] print:w-[10%]">Cant.</TableHead>
                <TableHead className="text-right w-[15%] print:w-[15%]">Precio Base</TableHead>
                <TableHead className="text-right w-[10%] print:w-[10%]">IGIC %</TableHead>
                <TableHead className="text-right w-[10%] print:w-[10%]">IGIC €</TableHead>
                <TableHead className="text-right w-[15%] print:w-[15%]">Total Ítem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsError && <TableRow><TableCell colSpan={6} className="text-center text-red-500 py-4">Error al cargar los ítems.</TableCell></TableRow>}
              {!itemsError && items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Esta factura no tiene ítems.</TableCell></TableRow>}
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="py-2">{item.descripcion}</TableCell>
                  <TableCell className="text-center py-2">{item.cantidad}</TableCell>
                  <TableCell className="text-right py-2">{formatCurrency(item.precio_unitario)}</TableCell>
                  <TableCell className="text-right py-2">{item.porcentaje_impuesto_item}%</TableCell>
                  <TableCell className="text-right py-2">{formatCurrency(item.monto_impuesto_item)}</TableCell>
                  <TableCell className="text-right py-2 font-semibold">{formatCurrency(item.total_item)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mb-8 print:mb-6">
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-md space-y-1 text-sm">
            <div className="flex justify-between"><span>Suma de Bases Imponibles:</span><span>{formatCurrency(factura.subtotal)}</span></div>
            {factura.desglose_impuestos && Object.keys(factura.desglose_impuestos).length > 0 && (
              <div className="pl-4 border-l ml-4 my-1 py-1">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Desglose IGIC:</p>
                {Object.entries(factura.desglose_impuestos).map(([tasaKey, montos]) => (
                  <div key={tasaKey} className="flex justify-between text-xs">
                    <span>Base {tasaKey.replace('IGIC_', '')}: {formatCurrency(montos.base)}</span>
                    <span>Cuota {tasaKey.replace('IGIC_', '')}: {formatCurrency(montos.impuesto)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between"><span>Suma Total de Impuestos (IGIC):</span><span>{formatCurrency(factura.monto_impuesto)}</span></div>
            <Separator className="my-1 print:border-gray-400"/>
            <div className="flex justify-between font-bold text-base md:text-lg"><span>TOTAL FACTURA:</span><span>{formatCurrency(factura.total)}</span></div>
          </div>
        </div>
      </section>

      {(factura.notas_cliente || factura.notas_internas) && (
        <section className="mt-8 space-y-4 text-sm print:mt-4">
          {factura.notas_cliente && (
            <div><h3 className="font-semibold mb-1 print:text-xs">Notas para el Cliente:</h3><p className="text-muted-foreground whitespace-pre-wrap print:text-xs">{factura.notas_cliente}</p></div>
          )}
          {factura.notas_internas && (
            <div className="mt-2 print:hidden"><h3 className="font-semibold mb-1">Notas Internas:</h3><p className="text-muted-foreground whitespace-pre-wrap">{factura.notas_internas}</p></div>
          )}
        </section>
      )}
      
      <section className="mt-8 print:hidden">
        <h2 className="text-xl font-semibold mb-3">Pagos Registrados</h2>
        {pagosError && <p className="text-sm text-red-500">Error al cargar los pagos.</p>}
        {!pagosError && pagos.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aún no se han registrado pagos para esta factura.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {pagos.map(pago => (
                <li key={pago.id} className="p-3 border rounded-md bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex justify-between items-center">
                        <span>{pago.fecha_pago ? format(parseISO(pago.fecha_pago), 'PPP p', {locale: es}) : 'Fecha N/A'}</span>
                        <span className="font-semibold">{formatCurrency(pago.monto_pagado)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Método: {pago.metodo_pago || 'N/A'}
                        {pago.referencia_pago && ` (Ref: ${pago.referencia_pago})`}
                    </div>
                </li>
            ))}
          </ul>
        )}
        <Button size="sm" className="mt-4" disabled> 
          <DollarSignIcon className="mr-2 h-4 w-4" />
          Registrar Nuevo Pago
        </Button>
      </section>
    </div> // Cierre del div principal del return
  ); // Cierre del return
} // <--- ESTA ES LA LLAVE DE CIERRE FINAL DE LA FUNCIÓN DetalleFacturaPage