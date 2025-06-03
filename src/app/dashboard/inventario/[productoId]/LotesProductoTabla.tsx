// app/dashboard/inventario/[productoId]/LotesProductoTabla.tsx
"use client";

import React, { useState, useTransition } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Importación de Badge
import { 
  PackageOpen, 
  Edit3Icon, 
  MinusCircle, 
  PlusCircle, 
  ArchiveRestoreIcon, // Para Inactivar
  CheckCircleIcon,    // Para Reactivar
  InfoIcon            // Para Lote Inactivo (opcional)
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
// Ajusta la ruta a tu archivo types.ts si es diferente
import type { LoteDeProducto, UnidadMedidaInventarioValue } from '../types'; 
import MovimientoStockForm from './MovimientoStockForm'; 
// Importa las acciones para inactivar/reactivar lotes
import { inactivarLoteProducto, reactivarLoteProducto } from '../actions'; 

interface LotesProductoTablaProps {
  lotes: LoteDeProducto[];
  productoId: string;
  nombreProducto: string;
  unidadProducto: UnidadMedidaInventarioValue | null | undefined;
}

export default function LotesProductoTabla({ 
  lotes, 
  productoId, 
  nombreProducto, 
  unidadProducto 
}: LotesProductoTablaProps) {
  const router = useRouter();
  
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
  const [selectedLoteParaMovimiento, setSelectedLoteParaMovimiento] = useState<LoteDeProducto | null>(null);

  const [isProcessingLote, startLoteTransition] = useTransition();
  const [loteActionError, setLoteActionError] = useState<string | null>(null);

  const handleOpenMovimientoModal = (lote: LoteDeProducto) => {
    setSelectedLoteParaMovimiento(lote);
    setIsMovimientoModalOpen(true);
  };

  const handleModalCloseAndRefresh = (refresh: boolean) => {
    setIsMovimientoModalOpen(false);
    setSelectedLoteParaMovimiento(null);
    if (refresh) {
      router.refresh(); 
    }
  };

  const handleToggleActividadLote = async (lote: LoteDeProducto) => {
    setLoteActionError(null);
    startLoteTransition(async () => {
      try {
        if (lote.esta_activo) {
          await inactivarLoteProducto(lote.id, productoId);
        } else {
          await reactivarLoteProducto(lote.id, productoId);
        }
        
        // Si llegamos aquí sin errores, la operación fue exitosa
        setLoteActionError(null);
        router.refresh();
      } catch (error: any) {
        // Manejo de errores si la función lanza una excepción
        const actionText = lote.esta_activo ? "inactivar" : "reactivar";
        console.error(`Error al ${actionText} lote (cliente):`, error);
        
        // Verificar si el error tiene la estructura esperada
        if (error && typeof error === 'object' && error.message) {
          setLoteActionError(error.message);
        } else {
          setLoteActionError(`Ocurrió un error al ${actionText} el lote.`);
        }
      }
    });
  };

  if (!lotes || lotes.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg mt-4">
        <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">No hay lotes registrados para este producto</h3>
        <p className="text-sm text-muted-foreground mb-4">Puedes añadir lotes desde la acción "Registrar Entrada de Lote" en la página de detalle del producto.</p>
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
      {loteActionError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md" role="alert">
          Error: {loteActionError}
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableCaption className="py-4">Lotes registrados para {nombreProducto}.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Nº Lote</TableHead>
              <TableHead className="font-semibold text-center">Stock</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">F. Entrada</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">F. Caducidad</TableHead>
              <TableHead className="font-semibold text-center">Estado</TableHead>
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lotes.map((lote) => (
              <TableRow 
                key={lote.id} 
                className={!lote.esta_activo ? "opacity-50 bg-slate-100 dark:bg-slate-800/50" : ""}
              >
                <TableCell className="font-medium">{lote.numero_lote}</TableCell>
                <TableCell className="text-center">{lote.stock_lote}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {lote.fecha_entrada ? format(parseISO(lote.fecha_entrada), 'dd/MM/yy', { locale: es }) : '-'}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {lote.fecha_caducidad 
                    ? format(parseISO(lote.fecha_caducidad), 'dd/MM/yy', { locale: es }) 
                    : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {lote.esta_activo 
                    ? <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Activo</Badge> 
                    : <Badge variant="destructive">Inactivo</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button asChild variant="ghost" size="icon" title="Editar Datos del Lote">
                    <Link href={`/dashboard/inventario/${productoId}/lotes/${lote.id}/editar`}>
                      <Edit3Icon className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    title="Registrar Movimiento de Stock"
                    onClick={() => handleOpenMovimientoModal(lote)}
                    disabled={!lote.esta_activo || isProcessingLote}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={lote.esta_activo ? "text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-600" : "text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-600"} 
                        title={lote.esta_activo ? "Inactivar Lote" : "Reactivar Lote"} 
                        disabled={isProcessingLote}
                      >
                        {lote.esta_activo ? <ArchiveRestoreIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿{lote.esta_activo ? "Inactivar" : "Reactivar"} este lote?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {lote.esta_activo 
                            ? `Esto marcará el lote ${lote.numero_lote} como inactivo. No se podrá usar para nuevas salidas y su stock no contará para el total disponible.` 
                            : `Esto reactivará el lote ${lote.numero_lote}, permitiendo que se use de nuevo y que su stock cuente para el total.`}
                          <br/>El registro del lote y sus movimientos permanecerán por trazabilidad. ¿Estás seguro?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessingLote}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleToggleActividadLote(lote)}
                          disabled={isProcessingLote}
                          className={lote.esta_activo ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                        >
                          {isProcessingLote ? (lote.esta_activo ? "Inactivando..." : "Reactivando...") : (lote.esta_activo ? "Sí, inactivar" : "Sí, reactivar")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedLoteParaMovimiento && (
        <Dialog open={isMovimientoModalOpen} onOpenChange={setIsMovimientoModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Movimiento de Stock</DialogTitle>
              <DialogDescription>
                <p>Producto: <strong>{nombreProducto}</strong></p>
                <p>Lote Nº: <strong>{selectedLoteParaMovimiento.numero_lote}</strong></p>
                <p>Stock Actual del Lote: <strong>{selectedLoteParaMovimiento.stock_lote}</strong> {unidadProducto || ''}</p>
                 {selectedLoteParaMovimiento.fecha_caducidad && (
                    <p>Caducidad del Lote: {format(parseISO(selectedLoteParaMovimiento.fecha_caducidad), 'PPP', {locale: es})}</p>
                )}
              </DialogDescription>
            </DialogHeader>
            <MovimientoStockForm
              productoId={productoId}
              lote={selectedLoteParaMovimiento}
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