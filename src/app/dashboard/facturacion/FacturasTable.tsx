// app/dashboard/facturacion/FacturasTable.tsx
"use client";

import React from 'react';
import Link from 'next/link';
// import { useRouter } from 'next/navigation'; // No se usa aún, puedes descomentar si lo necesitas
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, Edit3Icon /*, PrinterIcon, DollarSignIcon*/ } from 'lucide-react'; // Comenté los no usados por ahora
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FacturaParaTabla, EstadoFacturaPagoValue } from './types'; 
import { cn } from '@/lib/utils'; // Importa cn para combinar clases condicionalmente

interface FacturasTableProps {
  facturas: FacturaParaTabla[];
}

const formatCurrency = (amount: number | null | undefined): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '-';
  }
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

const getEstadoFacturaBadgeVariant = (
  estado?: EstadoFacturaPagoValue | string | null
): "default" | "destructive" | "outline" | "secondary" => { // Quitado "success" del tipo de retorno
  switch (estado?.toLowerCase()) {
    case 'borrador':
      return "outline";
    case 'pendiente':
    case 'vencida':
      return "secondary"; 
    case 'pagada parcialmente':
      return "default"; 
    case 'pagada':
      return "default"; // Mapeamos 'Pagada' a 'default', el color verde se aplicará con className
    case 'anulada':
      return "destructive";
    default:
      return "secondary";
  }
}; // <--- ASEGÚRATE DE QUE ESTE PUNTO Y COMA ESTÉ PRESENTE

export default function FacturasTable({ facturas }: FacturasTableProps) {
  // const router = useRouter();

  if (!facturas || facturas.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No hay facturas registradas todavía.</p>
      </div>
    );
  } // <--- ASEGÚRATE DE QUE ESTA LLAVE DE CIERRE ESTÉ PRESENTE

  return ( // Este es el return que estaba causando problemas si el código anterior tiene errores
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableCaption className="py-4">Lista de facturas emitidas.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Nº Factura</TableHead>
            <TableHead className="font-semibold">Fecha Emisión</TableHead>
            <TableHead className="font-semibold hidden md:table-cell">Propietario</TableHead>
            <TableHead className="font-semibold text-right">Total</TableHead>
            <TableHead className="font-semibold text-center">Estado Pago</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {facturas.map((factura) => (
            <TableRow key={factura.id}>
              <TableCell className="font-medium">
                <Link href={`/dashboard/facturacion/${factura.id}`} className="text-primary hover:underline">
                  {factura.numero_factura}
                </Link>
              </TableCell>
              <TableCell>
                {factura.fecha_emision ? format(parseISO(factura.fecha_emision), 'PPP', { locale: es }) : '-'}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {factura.propietarios?.nombre_completo || 'N/A'}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(factura.total)}</TableCell>
              <TableCell className="text-center">
                <Badge 
                  variant={getEstadoFacturaBadgeVariant(factura.estado)}
                  className={cn( // Usamos cn para aplicar clases condicionales
                    factura.estado === 'Pagada' && 'bg-green-100 text-green-800 border-green-300 dark:bg-green-800/30 dark:text-green-200',
                    factura.estado === 'Vencida' && 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-200',
                    factura.estado === 'Pagada Parcialmente' && 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-800/30 dark:text-blue-200'
                  )}
                >
                  {factura.estado}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button asChild variant="ghost" size="icon" title="Ver Detalles">
                  <Link href={`/dashboard/facturacion/${factura.id}`}>
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" title="Editar Factura (si es Borrador)">
                  <Link href={`/dashboard/facturacion/${factura.id}/editar`}>
                    <Edit3Icon className="h-4 w-4" />
                  </Link>
                </Button>
                {/* Más acciones como "Registrar Pago", "Descargar PDF", "Anular" irán aquí */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}