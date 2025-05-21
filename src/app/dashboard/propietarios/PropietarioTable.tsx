// app/dashboard/propietarios/PropietariosTable.tsx
"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { eliminarPropietario } from './actions';
// Importamos el tipo actualizado desde page.tsx
import type { PropietarioConMascotas } from './page'; 
import { Eye } from 'lucide-react'; // Icono para el enlace de ver mascotas

// Usamos el tipo importado
interface PropietariosTableProps {
  propietarios: PropietarioConMascotas[];
}

export default function PropietariosTable({ propietarios }: PropietariosTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleEliminar = async (propietarioId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await eliminarPropietario(propietarioId);
      if (result?.error) {
        setError(result.error.message);
        console.error("Error al eliminar propietario:", result.error.message);
      } else {
        router.refresh();
      }
    });
  };

  if (!propietarios || propietarios.length === 0) {
    return <p className="text-center text-gray-500 py-8">No hay propietarios registrados todavía.</p>;
  }

  return (
    <>
      {error && <p className="text-red-500 p-4 bg-red-100 rounded-md mb-4">Error: {error}</p>}
      <div className="border rounded-lg overflow-hidden"> {/* Contenedor para la tabla */}
        <Table>
          <TableCaption className="py-4">Una lista de todos los propietarios registrados.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Nombre Completo</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Email</TableHead> {/* Ocultar en extra pequeño */}
              <TableHead className="font-semibold hidden md:table-cell">Teléfono</TableHead> {/* Ocultar en pequeño */}
              <TableHead className="font-semibold text-center">Nº Mascotas</TableHead> {/* Nueva columna */}
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {propietarios.map((propietario) => (
              <TableRow key={propietario.id}>
                <TableCell className="font-medium">{propietario.nombre_completo}</TableCell>
                <TableCell className="hidden sm:table-cell">{propietario.email || '-'}</TableCell>
                <TableCell className="hidden md:table-cell">{propietario.telefono || '-'}</TableCell>
                <TableCell className="text-center">
                  {propietario.pacientes_count > 0 ? (
                    <Link href={`/dashboard/pacientes?propietarioId=${propietario.id}`} 
                          className="text-blue-600 hover:underline hover:text-blue-800 flex items-center justify-center"
                          title={`Ver ${propietario.pacientes_count} mascota(s) de ${propietario.nombre_completo}`}>
                      {propietario.pacientes_count}
                      <Eye className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    propietario.pacientes_count // Muestra 0 si no hay mascotas
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1 md:space-x-2"> {/* Ajuste de espacio entre botones */}
                  <Button asChild variant="outline" size="sm" className="px-2 py-1 h-auto text-xs md:text-sm">
                    <Link href={`/dashboard/propietarios/${propietario.id}/editar`}>
                      Editar
                    </Link>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isPending} className="px-2 py-1 h-auto text-xs md:text-sm">
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente al propietario
                          &quot;{propietario.nombre_completo}&quot; y todos sus datos asociados (incluyendo sus mascotas, si la base de datos está configurada para borrado en cascada).
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
      </div>
    </>
  );
}