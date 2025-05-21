// app/dashboard/pacientes/PacientesTable.tsx
"use client";

import React, { useState, useTransition } from 'react'; // Importa useState y useTransition
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Importa useRouter
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
} from "@/components/ui/alert-dialog"; // Importa AlertDialog
import { eliminarPaciente } from './actions'; // Importa la Server Action
import type { PacienteConPropietario } from './page'; 

interface PacientesTableProps {
  pacientes: PacienteConPropietario[];
}

export default function PacientesTable({ pacientes }: PacientesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleEliminarConfirmado = async (pacienteId: string) => {
    setError(null); // Limpia errores anteriores
    startTransition(async () => {
      const result = await eliminarPaciente(pacienteId);
      if (!result.success) {
        console.error("Error al eliminar paciente:", result.error?.message);
        setError(result.error?.message || "Ocurrió un error al eliminar el paciente.");
        // Aquí podrías mostrar un "toast" de error
      } else {
        // Éxito
        // revalidatePath en la Server Action ya invalidó la caché del servidor.
        // router.refresh() actualiza la vista actual obteniendo los datos frescos.
        router.refresh();
        // Aquí podrías mostrar un "toast" de éxito
      }
    });
  };

  if (!pacientes || pacientes.length === 0) {
    return <p className="text-center text-gray-500 py-8">No hay pacientes registrados todavía.</p>;
  }

  return (
    <> {/* Necesario si el mensaje de error está fuera de la tabla principal */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md" role="alert">
          Error: {error}
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableCaption className="py-4">Una lista de todos los pacientes registrados en la clínica.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Nombre Paciente</TableHead>
              <TableHead className="font-semibold">Especie</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Raza</TableHead>
              <TableHead className="font-semibold">Propietario</TableHead>
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pacientes.map((paciente) => (
              <TableRow key={paciente.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/pacientes/${paciente.id}`} className="hover:underline">
                    {paciente.nombre}
                  </Link>
                </TableCell>
                <TableCell>{paciente.especie || '-'}</TableCell>
                <TableCell className="hidden md:table-cell">{paciente.raza || '-'}</TableCell>
                <TableCell>
                  {paciente.propietarios?.nombre_completo || 'N/A'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/pacientes/${paciente.id}/editar`}>
                      Editar
                    </Link>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isPending}>
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente al paciente
                          "{paciente.nombre}". Los datos de su historial médico también podrían eliminarse si la base de datos está configurada para borrado en cascada.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleEliminarConfirmado(paciente.id)}
                          disabled={isPending}
                          className="bg-destructive hover:bg-destructive/90" // Mantenemos el estilo destructivo
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