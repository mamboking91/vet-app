// app/dashboard/pacientes/[pacienteId]/historial/HistorialMedicoTabla.tsx
"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
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
import { Edit3Icon, Trash2Icon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { eliminarEntradaHistorial } from './actions'; // Asegúrate que la ruta a actions.ts es correcta

// Tipo para una entrada del historial médico
// Podrías importarlo de un archivo types.ts si lo tienes centralizado
type HistorialMedicoEntrada = {
  id: string;
  fecha_evento: string;
  tipo: string;
  descripcion: string;
  diagnostico: string | null;
  tratamiento_indicado: string | null;
  notas_seguimiento: string | null; // Añadido para consistencia con la tabla
};

interface HistorialMedicoTablaProps {
  historial: HistorialMedicoEntrada[];
  pacienteId: string;
  nombrePaciente: string;
}

export default function HistorialMedicoTabla({ historial, pacienteId, nombrePaciente }: HistorialMedicoTablaProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleEliminarConfirmado = async (historialId: string) => {
    setDeleteError(null);
    startTransition(async () => {
      const result = await eliminarEntradaHistorial(historialId, pacienteId);
      if (!result.success) {
        console.error("Error al eliminar entrada de historial:", result.error?.message);
        setDeleteError(result.error?.message || "Ocurrió un error al eliminar.");
      } else {
        router.refresh(); 
      }
    });
  };

  if (!historial || historial.length === 0) {
    return <p className="text-center text-gray-500 py-8">Este paciente aún no tiene entradas en su historial médico.</p>;
  }

  return (
    <>
      {deleteError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md" role="alert">
          Error al eliminar: {deleteError}
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableCaption className="mt-4 py-4">Registros del historial médico de {nombrePaciente}.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha Evento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="hidden md:table-cell">Diagnóstico</TableHead>
                <TableHead className="hidden lg:table-cell">Tratamiento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historial.map((entrada) => (
                <TableRow key={entrada.id}>
                  <TableCell>{format(new Date(entrada.fecha_evento), 'PPP', { locale: es })}</TableCell>
                  <TableCell>{entrada.tipo}</TableCell>
                  <TableCell className="max-w-xs truncate" title={entrada.descripcion}>{entrada.descripcion}</TableCell>
                  <TableCell className="hidden md:table-cell">{entrada.diagnostico || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{entrada.tratamiento_indicado || '-'}</TableCell>
                  <TableCell className="text-right space-x-2"> {/* Botones en la misma celda con espacio */}
                    <Button asChild variant="outline" size="sm" className="px-2 py-1 h-auto text-xs">
                      <Link href={`/dashboard/pacientes/${pacienteId}/historial/${entrada.id}/editar`}>
                        <span className="flex items-center">
                          <Edit3Icon className="h-3 w-3 mr-1" />
                          Editar
                        </span>
                      </Link>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="px-2 py-1 h-auto text-xs" disabled={isPending}>
                          <Trash2Icon className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la entrada del historial del tipo "{entrada.tipo}" 
                            para el día {format(new Date(entrada.fecha_evento), 'PPP', { locale: es })}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleEliminarConfirmado(entrada.id)}
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
        </CardContent>
      </Card>
    </>
  );
}