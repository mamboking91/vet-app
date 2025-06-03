// app/dashboard/facturacion/[facturaId]/page.tsx
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { ChevronLeft, Printer, DollarSignIcon, Edit3Icon, Trash2Icon, XCircle, AlertTriangle, InfoIcon } from 'lucide-react';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import PrintButton from './PrintButton'; // Asumiendo que PrintButton.tsx está en la misma carpeta
import type { 
  EstadoFacturaPagoValue, 
  FacturaHeaderFromDB, 
  ItemFacturaFromDB, 
  PagoFacturaFromDB 
} from '../types'; 
import type { ClinicData } from '../../configuracion/types'; // Ajusta la ruta si es necesario
import { eliminarFacturaBorrador, anularFactura } from '../actions'; // Importar acciones

// Helper para formatear moneda
const formatCurrency = (amount: number | null | undefined): string => { 
  if (typeof amount !== 'number' || isNaN(amount)) return '0,00 €';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

// Helper para el Badge de estado
const getEstadoFacturaBadgeVariant = (estado?: EstadoFacturaPagoValue | string | null): "default" | "destructive" | "outline" | "secondary" => { 
  switch (estado?.toLowerCase()) {
    case 'borrador': return "outline";
    case 'pendiente': return "secondary"; 
    case 'vencida': return "secondary"; // Se estilizará con className para amarillo
    case 'pagada parcialmente': return "default"; 
    case 'pagada': return "default"; // Se estilizará con className para verde
    case 'anulada': return "destructive";
    default: return "secondary";
  }
};

export default function DetalleFacturaPage() {
  const router = useRouter();
  const params = useParams();
  const facturaId = params.facturaId as string;

  const [factura, setFactura] = useState<FacturaHeaderFromDB | null>(null);
  const [items, setItems] = useState<ItemFacturaFromDB[]>([]);
  const [pagos, setPagos] = useState<PagoFacturaFromDB[]>([]);
  const [datosClinica, setDatosClinica] = useState<ClinicData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [pagosError, setPagosError] = useState<string | null>(null);

  const [isProcessingAction, startActionTransition] = useTransition();
  const [actionFeedback, setActionFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    if (!facturaId || facturaId.length !== 36) {
      setPageError("ID de factura inválido o no proporcionado.");
      setLoading(false);
      return;
    }

    const supabase = createClientComponentClient();
    async function fetchData() {
      setLoading(true);
      setPageError(null);
      setItemsError(null);
      setPagosError(null);
      setActionFeedback(null);

      const [facturaResult, itemsResult, pagosResult, datosClinicaResult] = await Promise.allSettled([
        supabase.from('facturas').select(`*, propietarios (id, nombre_completo), pacientes (id, nombre)`).eq('id', facturaId).single<FacturaHeaderFromDB>(),
        supabase.from('items_factura').select('*').eq('factura_id', facturaId).order('created_at', { ascending: true }),
        supabase.from('pagos_factura').select('*').eq('factura_id', facturaId).order('fecha_pago', { ascending: false }),
        supabase.from('datos_clinica').select('*').eq('id', true).maybeSingle<ClinicData>()
      ]);

      // Manejar resultado de factura
      if (facturaResult.status === 'fulfilled') {
        if (facturaResult.value.error) {
          console.error(`Error fetching factura:`, facturaResult.value.error);
          setPageError(facturaResult.value.error.message || "Error al cargar la factura.");
        } else if (!facturaResult.value.data) {
          setPageError("Factura no encontrada.");
        } else {
          setFactura(facturaResult.value.data);
        }
      } else {
        console.error(`Error fetching factura (promesa rechazada):`, facturaResult.reason);
        setPageError("Error crítico al cargar datos de la factura.");
      }

      // Manejar resultado de ítems
      if (itemsResult.status === 'fulfilled') {
        setItems((itemsResult.value.data || []) as ItemFacturaFromDB[]);
        if (itemsResult.value.error) {
          console.error(`Error fetching items:`, itemsResult.value.error);
          setItemsError(itemsResult.value.error.message);
        }
      } else {
        console.error(`Error fetching items (promesa rechazada):`, itemsResult.reason);
        setItemsError("Error crítico al cargar ítems.");
      }

      // Manejar resultado de pagos
      if (pagosResult.status === 'fulfilled') {
        setPagos((pagosResult.value.data || []) as PagoFacturaFromDB[]);
        if (pagosResult.value.error) {
          console.error(`Error fetching pagos:`, pagosResult.value.error);
          setPagosError(pagosResult.value.error.message);
        }
      } else {
        console.error(`Error fetching pagos (promesa rechazada):`, pagosResult.reason);
        setPagosError("Error crítico al cargar pagos.");
      }
      
      if (datosClinicaResult.status === 'fulfilled') {
        setDatosClinica(datosClinicaResult.value.data);
        if (datosClinicaResult.value.error) console.error("Error fetching datos de la clínica:", datosClinicaResult.value.error);
      } else {
        console.error("Error fetching datos de la clínica (promesa rechazada):", datosClinicaResult.reason);
      }
      setLoading(false);
    }

    fetchData();
  }, [facturaId]); // Volver a ejecutar si facturaId cambia

  const handleEliminarBorrador = async () => {
    if (!factura) return;
    setActionFeedback(null);
    startActionTransition(async () => {
      const result = await eliminarFacturaBorrador(factura.id);
      if (!result.success) {
        setActionFeedback({type: 'error', message: result.error?.message || "Error al eliminar la factura."});
      } else {
        router.push('/dashboard/facturacion');
        // router.refresh(); // push a la lista ya debería recargarla
      }
    });
  };

  const handleAnularFactura = async () => {
    if (!factura) return;
    setActionFeedback(null);
    startActionTransition(async () => {
      const result = await anularFactura(factura.id);
      if (!result.success) {
        setActionFeedback({type: 'error', message: result.error?.message || "Error al anular la factura."});
      } else {
        setActionFeedback({type: 'success', message: result.message || "Factura anulada."});
        router.refresh(); 
      }
    });
  };

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Cargando datos de la factura...</div>;
  }

  if (pageError || !factura) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al Cargar Factura</h2>
        <p className="text-muted-foreground mb-6">{pageError || "La factura solicitada no pudo ser cargada."}</p>
        <Button asChild variant="outline">
            <Link href="/dashboard/facturacion">Volver a la Lista de Facturas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-4xl print:py-4 print:px-2">
      {/* --- SECCIÓN DE BOTONES DE ACCIÓN --- */}
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
            {factura.estado === 'Borrador' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isProcessingAction}><Trash2Icon className="mr-2 h-4 w-4" /> Eliminar</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>¿Eliminar factura borrador?</AlertDialogTitle><AlertDialogDescription>Nº {factura.numero_factura}. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel disabled={isProcessingAction}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleEliminarBorrador} disabled={isProcessingAction} className="bg-destructive hover:bg-destructive/90">{isProcessingAction ? "Eliminando..." : "Sí, eliminar"}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {(factura.estado === 'Pendiente' || factura.estado === 'Pagada Parcialmente' || factura.estado === 'Vencida') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-100 hover:text-orange-700 dark:text-orange-500 dark:border-orange-500 dark:hover:bg-orange-900/30 dark:hover:text-orange-400" size="sm" disabled={isProcessingAction}><XCircle className="mr-2 h-4 w-4" /> Anular</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>¿Anular esta factura?</AlertDialogTitle><AlertDialogDescription>Nº {factura.numero_factura}. El estado cambiará a "Anulada".</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel disabled={isProcessingAction}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleAnularFactura} disabled={isProcessingAction} className="bg-orange-600 hover:bg-orange-700 text-white">{isProcessingAction ? "Anulando..." : "Sí, anular"}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
        </div>
      </div>

      {actionFeedback && (
        <div className={cn("mb-4 p-3 rounded-md text-sm print:hidden", actionFeedback.type === 'error' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")} role="alert">
          {actionFeedback.message}
        </div>
      )}

      {/* --- ENCABEZADO DE LA FACTURA: INFO CLÍNICA Y CLIENTE --- */}
      <section className="mb-8 print:mb-6" id="invoice-header">
        <div className="flex flex-col sm:flex-row justify-between items-start">
          <div className="w-full sm:w-2/3 mb-4 sm:mb-0">
            {datosClinica?.logo_url && (
              <div className="mb-3">
                <Image src={datosClinica.logo_url} alt={`Logo de ${datosClinica.nombre_clinica || 'Clínica'}`} width={150} height={75} className="object-contain print:max-h-16" priority />
              </div>
            )}
            <h2 className="text-xl font-semibold print:text-lg">{datosClinica?.nombre_clinica || "Nombre de Clínica"}</h2>
            <p className="text-xs text-muted-foreground print:text-[10px]">{datosClinica?.direccion_completa || "Dirección de la Clínica"}</p>
            <p className="text-xs text-muted-foreground print:text-[10px]">{datosClinica?.codigo_postal || ""} {datosClinica?.ciudad || ""} {datosClinica?.provincia && `(${datosClinica.provincia})`}</p>
            <p className="text-xs text-muted-foreground print:text-[10px]">Tel: {datosClinica?.telefono_principal || "N/A"}</p>
            <p className="text-xs text-muted-foreground print:text-[10px]">Email: {datosClinica?.email_contacto || "N/A"}</p>
            <p className="text-xs text-muted-foreground print:text-[10px]">NIF/CIF: {datosClinica?.nif_cif || "N/A"}</p>
          </div>
          <div className="w-full sm:w-1/3 text-left sm:text-right mt-4 sm:mt-0">
            <h3 className="text-md font-semibold mb-1 print:text-sm">Factura a:</h3>
            {factura.propietarios?.id ? (
                 <Link href={`/dashboard/propietarios/${factura.propietarios.id}/editar`} className="text-sm text-primary hover:underline block print:text-black print:no-underline">{factura.propietarios.nombre_completo || 'Cliente'}</Link>
            ) : (<p className="text-sm print:text-xs">{factura.propietarios?.nombre_completo || 'Cliente'}</p>)}
            {/* Aquí podrías añadir la dirección y NIF del propietario */}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm print:mt-4 print:pt-2 print:text-xs">
            <div><p className="font-semibold text-muted-foreground">Nº Factura:</p><p>{factura.numero_factura}</p></div>
            <div><p className="font-semibold text-muted-foreground">Fecha Emisión:</p><p>{factura.fecha_emision ? format(parseISO(factura.fecha_emision), 'dd/MM/yyyy', { locale: es }) : 'N/A'}</p></div>
            {factura.fecha_vencimiento && (<div><p className="font-semibold text-muted-foreground">Fecha Vencimiento:</p><p>{format(parseISO(factura.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}</p></div>)}
            <div className={factura.fecha_vencimiento ? "" : "col-start-2 sm:col-start-auto"}><p className="font-semibold text-muted-foreground">Estado:</p>
                <Badge 
                    variant={getEstadoFacturaBadgeVariant(factura.estado)}
                    className={cn("text-xs print:border print:border-gray-400 print:text-black print:font-normal",
                        factura.estado === 'Pagada' && 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border-green-400 print:bg-green-100! print:text-green-700!',
                        factura.estado === 'Vencida' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 border-yellow-400 print:bg-yellow-100! print:text-yellow-700!',
                        factura.estado === 'Pagada Parcialmente' && 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 border-blue-400 print:bg-blue-100! print:text-blue-700!',
                        factura.estado === 'Anulada' && 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 border-red-400 print:bg-red-100! print:text-red-700!'
                    )}
                >{factura.estado}</Badge>
            </div>
        </div>
        {factura.pacientes?.id && factura.pacientes.nombre && (
              <div className="mt-2 text-sm print:text-xs">
                <span className="font-semibold text-muted-foreground">Paciente Atendido:</span> {factura.pacientes.nombre}
                <Link href={`/dashboard/pacientes/${factura.pacientes.id}`} className="ml-2 text-xs text-primary hover:underline print:hidden">(ver ficha)</Link>
              </div>
        )}
      </section>

      {/* --- ÍTEMS DE LA FACTURA --- */}
      <section className="mb-8 print:mb-6" id="invoice-items">
        <h3 className="text-lg font-semibold mb-2 print:text-base">Detalle de la Factura</h3>
        <div className="border rounded-md overflow-hidden print:border print:border-gray-300 print:rounded-none">
          <Table>
            <TableHeader>
              <TableRow className="print:text-xs">
                <TableHead className="w-[40%] print:w-[45%]">Descripción</TableHead>
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
              {!itemsError && items.map(item => (
                <TableRow key={item.id} className="print:text-xs">
                  <TableCell className="py-2 print:py-1">{item.descripcion}</TableCell>
                  <TableCell className="text-center py-2 print:py-1">{item.cantidad}</TableCell>
                  <TableCell className="text-right py-2 print:py-1">{formatCurrency(item.precio_unitario)}</TableCell>
                  <TableCell className="text-right py-2 print:py-1">{item.porcentaje_impuesto_item}%</TableCell>
                  <TableCell className="text-right py-2 print:py-1">{formatCurrency(item.monto_impuesto_item)}</TableCell>
                  <TableCell className="text-right py-2 font-semibold print:py-1">{formatCurrency(item.total_item)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* --- TOTALES DE LA FACTURA --- */}
      <section className="mb-8 print:mb-6" id="invoice-summary">
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-sm space-y-1 text-sm print:text-xs"> {/* Ajustado ancho para que quepa mejor */}
            <div className="flex justify-between"><span>Suma de Bases Imponibles:</span><span>{formatCurrency(factura.subtotal)}</span></div>
            {factura.desglose_impuestos && Object.keys(factura.desglose_impuestos).length > 0 && (
              <div className="pl-4 border-l-2 border-gray-300 dark:border-gray-700 ml-2 my-1 py-1">
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
            <div className="flex justify-between font-bold text-base md:text-lg print:text-sm"><span>TOTAL FACTURA:</span><span>{formatCurrency(factura.total)}</span></div>
          </div>
        </div>
      </section>

      {/* --- NOTAS --- */}
      {(factura.notas_cliente || factura.notas_internas) && (
        <section className="mt-8 space-y-4 text-sm print:mt-4" id="invoice-notes">
          {factura.notas_cliente && (
            <div><h3 className="font-semibold mb-1 print:text-xs">Notas para el Cliente:</h3><p className="text-muted-foreground whitespace-pre-wrap print:text-xs">{factura.notas_cliente}</p></div>
          )}
          {factura.notas_internas && ( // Las notas internas no se deberían imprimir
            <div className="mt-2 print:hidden"><h3 className="font-semibold mb-1">Notas Internas:</h3><p className="text-muted-foreground whitespace-pre-wrap">{factura.notas_internas}</p></div>
          )}
        </section>
      )}
      
      {/* --- PAGOS REGISTRADOS --- */}
      <section className="mt-8 print:hidden" id="invoice-payments">
        <h2 className="text-xl font-semibold mb-3">Pagos Registrados</h2>
        {pagosError && <p className="text-sm text-red-500">Error al cargar los pagos: {pagosError}</p>}
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
        <Button size="sm" className="mt-4" disabled> {/* Botón deshabilitado por ahora */}
          <DollarSignIcon className="mr-2 h-4 w-4" />
          Registrar Nuevo Pago
        </Button>
      </section>
    </div>
  );
}