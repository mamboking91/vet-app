"use client";

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, FileText, FilterIcon, Package, AlertCircle } from 'lucide-react';
import type { VentasReportData, TopItemsReportData } from './actions';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

interface ReportesClienteProps {
  initialVentasData: VentasReportData;
  initialTopItemsData: TopItemsReportData;
  defaultDates: { from: Date; to: Date };
}

export default function ReportesCliente({ initialVentasData, initialTopItemsData, defaultDates }: ReportesClienteProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [startDate, setStartDate] = useState<Date | undefined>(defaultDates.from);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultDates.to);

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      const params = new URLSearchParams();
      params.set('from', format(startDate, 'yyyy-MM-dd'));
      params.set('to', format(endDate, 'yyyy-MM-dd'));
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sección de Filtros (sin cambios) */}
      <Card>
        <CardHeader><CardTitle>Filtrar por Fecha</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="grid gap-2"><label className="text-sm font-medium">Desde</label><DatePicker date={startDate} onDateChange={setStartDate} /></div>
          <div className="grid gap-2"><label className="text-sm font-medium">Hasta</label><DatePicker date={endDate} onDateChange={setEndDate} /></div>
          <Button onClick={handleApplyFilter} className="gap-2"><FilterIcon className="h-4 w-4" />Aplicar Filtros</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: Informe de Ventas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informe de Ventas</CardTitle>
              {startDate && endDate && (
                <p className="text-sm text-gray-500">
                  Resultados del {format(startDate, 'd MMM yy', { locale: es })} al {format(endDate, 'd MMM yy', { locale: es })}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CORRECCIÓN: Verificamos si hay un error antes de renderizar */}
              {initialVentasData?.error ? (
                <div className="flex items-center justify-center h-full bg-red-50 text-red-700 p-4 rounded-lg">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <p>{initialVentasData.error}</p>
                </div>
              ) : (
                <>
                  {/* Tarjetas de Resumen (KPIs) */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Facturado</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{formatCurrency(initialVentasData.totalFacturado)}</div><p className="text-xs text-muted-foreground">Ingresos totales en el período.</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Nº de Facturas</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{initialVentasData.numeroFacturas}</div><p className="text-xs text-muted-foreground">Facturas emitidas y válidas.</p></CardContent>
                    </Card>
                  </div>
                  {/* Gráfico de Evolución de Ventas */}
                  <div className="h-[350px] w-full">
                    <h3 className="text-lg font-semibold mb-4 text-center">Evolución Diaria de Ventas</h3>
                    {initialVentasData.ventasPorDia.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={initialVentasData.ventasPorDia} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fecha" tickFormatter={(dateStr) => format(new Date(dateStr), 'dd MMM', { locale: es })} />
                            <YAxis tickFormatter={(value) => `${formatCurrency(value).replace('€', '')}`} />
                            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Total']} />
                            <Legend />
                            <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} name="Ventas" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg"><p className="text-gray-500">No hay datos de ventas para mostrar.</p></div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Informe de Items más vendidos */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5"/>Servicios y Productos Más Vendidos</CardTitle>
                <p className="text-sm text-gray-500">Top 10 por ingresos en el período seleccionado.</p>
            </CardHeader>
            <CardContent>
              {/* CORRECCIÓN: Verificamos también el error en este informe */}
              {initialTopItemsData?.error ? (
                <div className="flex items-center justify-center bg-red-50 text-red-700 p-4 rounded-lg">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <p>{initialTopItemsData.error}</p>
                </div>
              ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60%]">Descripción</TableHead>
                            <TableHead className="text-center">Cantidad</TableHead>
                            <TableHead className="text-right">Ingresos</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialTopItemsData.topItems.length > 0 ? (
                            initialTopItemsData.topItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.descripcion}</TableCell>
                                    <TableCell className="text-center">{item.cantidadVendida}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(item.ingresosTotales)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                                    No hay datos de ítems para mostrar.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}