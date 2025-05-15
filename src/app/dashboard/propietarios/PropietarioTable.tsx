// app/dashboard/propietarios/PropietariosTable.tsx
"use client"; // Este componente manejará el estado del diálogo

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation'; // Para refrescar la lista si es necesario
 import Link from 'next/link';
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
import { eliminarPropietario } from './actions'; // Importa la Server Action

// Reutiliza el tipo Propietario
type Propietario = {
  id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
};

interface PropietariosTableProps {
  propietarios: Propietario[];
}

export default function PropietariosTable({ propietarios }: PropietariosTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // No necesitamos estado para el propietario a eliminar aquí si pasamos el ID directamente
  // a la función de manejo, y el AlertDialogTrigger maneja la apertura por propietario.

  const handleEliminar = async (propietarioId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await eliminarPropietario(propietarioId);
      if (result?.error) {
        setError(result.error.message);
        console.error("Error al eliminar propietario:", result.error.message);
        // Podrías mostrar un toast de error aquí
      } else {
        // Éxito
        // `revalidatePath` en la Server Action debería ser suficiente para que
        // la próxima carga de la página de lista muestre los datos actualizados.
        // Para forzar una actualización inmediata de los Server Components en la vista actual:
        router.refresh();
        // Podrías mostrar un toast de éxito aquí
      }
    });
  };

  if (!propietarios || propietarios.length === 0) {
    return <p className="text-center text-gray-500">No hay propietarios registrados todavía.</p>;
  }

  return (
    <>
      {error && <p className="text-red-500 p-4 bg-red-100 rounded-md">Error: {error}</p>}
      <Table>
        <TableCaption>Una lista de todos los propietarios registrados.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Nombre Completo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {propietarios.map((propietario) => (
            <TableRow key={propietario.id}>
              <TableCell className="font-medium">{propietario.nombre_completo}</TableCell>
              <TableCell>{propietario.email || '-'}</TableCell>
              <TableCell>{propietario.telefono || '-'}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/propietarios/${propietario.id}/editar`}>
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
                        Esta acción no se puede deshacer. Esto eliminará permanentemente al propietario
                        &quot;{propietario.nombre_completo}&quot; y todos sus datos asociados (dependiendo de la configuración de la base de datos).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleEliminar(propietario.id)}
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
    </>
  );
}