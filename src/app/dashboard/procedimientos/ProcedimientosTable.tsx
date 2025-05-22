// app/dashboard/procedimientos/ProcedimientosTable.tsx
"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Edit3Icon, Trash2Icon, PlusCircle } from 'lucide-react';
import type { Procedimiento } from './page'; 
import { eliminarProcedimiento } from './actions';

interface ProcedimientosTableProps {
  procedimientos: Procedimiento[];
}

const formatCurrency = (amount: number) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

export default function ProcedimientosTable({ procedimientos }: ProcedimientosTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleEliminarConfirmado = async (procedimientoId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await eliminarProcedimiento(procedimientoId);
      if (!result.success) {
        setError(result.error?.message || "Ocurrió un error al eliminar el procedimiento.");
        console.error("Error al eliminar procedimiento (cliente):", result.error);
      } else {
        router.refresh();
      }
    });
  };

  if (!procedimientos || procedimientos.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 mb-4">No hay procedimientos registrados todavía.</p>
        <Button asChild>
          <Link href="/dashboard/procedimientos/nuevo">
            <span className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Primer Procedimiento
            </span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md" role="alert">
          Error: {error}
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableCaption className="py-4">Catálogo de procedimientos y servicios ofrecidos.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Nombre</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Descripción</TableHead>
              <TableHead className="font-semibold text-center">Duración (min)</TableHead>
              <TableHead className="font-semibold text-right">Precio</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Categoría</TableHead>
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {procedimientos.map((procedimiento) => (
              <TableRow key={procedimiento.id}>
                <TableCell className="font-medium">{procedimiento.nombre}</TableCell>
                <TableCell className="hidden md:table-cell max-w-xs truncate" title={procedimiento.descripcion || ''}>
                  {procedimiento.descripcion || '-'}
                </TableCell>
                <TableCell className="text-center">{procedimiento.duracion_estimada_minutos ?? '-'}</TableCell>
                <TableCell className="text-right">{formatCurrency(procedimiento.precio)}</TableCell>
                <TableCell className="hidden sm:table-cell">{procedimiento.categoria || '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button asChild variant="outline" size="sm" className="px-2 py-1 h-auto text-xs">
                    <Link href={`/dashboard/procedimientos/${procedimiento.id}/editar`}>
                      <span className="flex items-center">
                        <Edit3Icon className="h-3 w-3 mr-1" />
                        Editar
                      </span>
                    </Link>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="px-2 py-1 h-auto text-xs" disabled={isPending}>
                        <span className="flex items-center">
                          <Trash2Icon className="h-3 w-3 mr-1" />
                          Eliminar
                        </span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el procedimiento
                          &quot;{procedimiento.nombre}&quot;.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleEliminarConfirmado(procedimiento.id)}
                          disabled={isPending}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isPending ? "Eliminando..." : "Sí, eliminar"}
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
    </>
  );
}