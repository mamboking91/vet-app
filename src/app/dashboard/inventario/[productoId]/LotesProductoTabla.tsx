// app/dashboard/inventario/[productoId]/LotesProductoTabla.tsx
"use client";

import React, { useState } from 'react'; // useTransition no se usa si no hay acciones con isPending aquí
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  // DialogTrigger, // No es necesario si el botón de abrir modal es un Button normal
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card"; // Añadido por si se usa para el mensaje de no lotes
import { PackageOpen, Edit3Icon, MinusCircle, PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { LoteDeProducto, UnidadMedidaInventarioValue } from '../types'; 
import MovimientoStockForm from './MovimientoStockForm'; 

interface LotesProductoTablaProps {
  lotes: LoteDeProducto[];
  productoId: string;
  nombreProducto: string;
  unidadProducto: UnidadMedidaInventarioValue | null | undefined; // <--- PROP AÑADIDA Y USADA
}

export default function LotesProductoTabla({ 
  lotes, 
  productoId, 
  nombreProducto, 
  unidadProducto // <--- Recibe la prop
}: LotesProductoTablaProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState<LoteDeProducto | null>(null);

  const handleOpenMovimientoModal = (lote: LoteDeProducto) => {
    setSelectedLote(lote);
    setIsModalOpen(true);
  };

  const handleModalCloseAndRefresh = (refresh: boolean) => {
    setIsModalOpen(false);
    setSelectedLote(null);
    if (refresh) {
      router.refresh(); 
    }
  };

  if (!lotes || lotes.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg mt-4">
        <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">No hay lotes registrados</h3>
        <p className="text-sm text-muted-foreground mb-4">Registra una entrada para este producto para empezar a controlar el stock por lotes.</p>
        <Button asChild size="sm">
          <Link href={`/dashboard/inventario/${productoId}/lotes/nuevo`}> 
            <PlusCircle className="mr-2 h-4 w-4" />
            Registrar Primer Lote
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableCaption className="py-4">Lotes disponibles para {nombreProducto}.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Nº Lote</TableHead>
              <TableHead className="font-semibold text-center">Stock Actual</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Fecha Entrada</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Fecha Caducidad</TableHead>
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lotes.map((lote) => (
              <TableRow key={lote.id}>
                <TableCell className="font-medium">{lote.numero_lote}</TableCell>
                <TableCell className="text-center">{lote.stock_lote}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {lote.fecha_entrada ? format(parseISO(lote.fecha_entrada), 'PPP', { locale: es }) : '-'}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {lote.fecha_caducidad 
                    ? format(parseISO(lote.fecha_caducidad), 'PPP', { locale: es }) 
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleOpenMovimientoModal(lote)}
                    className="px-2 py-1 h-auto text-xs"
                  >
                    <MinusCircle className="h-3 w-3 mr-1" />
                    Registrar Movimiento
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedLote && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Movimiento de Stock</DialogTitle>
              <DialogDescription>
                <p>Producto: <strong>{nombreProducto}</strong></p>
                <p>Lote Nº: <strong>{selectedLote.numero_lote}</strong></p>
                <p>Stock Actual del Lote: <strong>{selectedLote.stock_lote}</strong> {unidadProducto || ''}</p>
              </DialogDescription>
            </DialogHeader>
            <MovimientoStockForm
              productoId={productoId}
              lote={selectedLote}
              unidadProducto={unidadProducto} 
              nombreProducto={nombreProducto} 
              onFormSubmit={() => handleModalCloseAndRefresh(true)}
              onCancel={() => handleModalCloseAndRefresh(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}