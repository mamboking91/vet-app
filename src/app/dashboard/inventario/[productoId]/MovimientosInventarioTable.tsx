// app/dashboard/inventario/[productoId]/MovimientosInventarioTable.tsx
"use client";

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
// Importamos el tipo específico que ahora incluye numero_lote_display
import type { MovimientoInventarioConDetallesVista } from './page'; 

interface MovimientosInventarioTableProps {
  movimientos: MovimientoInventarioConDetallesVista[];
}

const getTipoMovimientoBadgeVariant = (
  tipo?: string | null
): "default" | "destructive" | "outline" | "secondary" => {
  const tipoLower = tipo?.toLowerCase() || '';
  if (tipoLower.includes('entrada') || tipoLower.includes('positivo') || tipoLower.includes('devolución cliente')) {
    return "default"; 
  }
  if (tipoLower.includes('salida') || tipoLower.includes('negativo') || tipoLower.includes('devolución proveedor')) {
    return "destructive";
  }
  return "secondary";
};

export default function MovimientosInventarioTable({ movimientos }: MovimientosInventarioTableProps) {
  if (!movimientos || movimientos.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No hay movimientos de stock registrados para este producto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-0">
        <Table>
          <TableCaption className="py-4">Historial de movimientos de stock del producto.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Fecha Movimiento</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Lote Nº</TableHead>
              <TableHead className="font-semibold text-center">Cantidad</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map((movimiento) => (
              <TableRow key={movimiento.id}>
                <TableCell>
                  {movimiento.fecha_movimiento 
                    ? format(parseISO(movimiento.fecha_movimiento), 'Pp', { locale: es }) 
                    : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={getTipoMovimientoBadgeVariant(movimiento.tipo_movimiento)}>
                    {movimiento.tipo_movimiento || '-'}
                  </Badge>
                </TableCell>
                {/* Usamos el campo aplanado numero_lote_display */}
                <TableCell>{movimiento.numero_lote_display || 'N/A'}</TableCell>
                <TableCell className="text-center">{movimiento.cantidad}</TableCell>
                <TableCell className="hidden md:table-cell max-w-xs truncate" title={movimiento.notas || ''}>
                  {movimiento.notas || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}