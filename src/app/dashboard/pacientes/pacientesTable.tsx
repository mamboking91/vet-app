// app/dashboard/pacientes/PacientesTable.tsx
"use client";

import React from 'react';
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
// Importa el tipo que definimos en page.tsx (o donde esté definido)
// Asumimos que PacienteConPropietario ahora tiene 'propietarios' como un array:
// propietarios: { id: string; nombre_completo: string | null; }[] | null;
import type { PacienteConPropietario } from './page'; 

interface PacientesTableProps {
  pacientes: PacienteConPropietario[];
}

export default function PacientesTable({ pacientes }: PacientesTableProps) {
  // Lógica para eliminar (AlertDialog) y editar se añadirá aquí más tarde,
  // similar a PropietariosTable.tsx

  if (!pacientes || pacientes.length === 0) {
    return <p className="text-center text-gray-500">No hay pacientes registrados todavía.</p>;
  }

  return (
    <Table>
      <TableCaption>Una lista de todos los pacientes registrados.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre Paciente</TableHead>
          <TableHead>Especie</TableHead>
          <TableHead>Raza</TableHead>
          <TableHead>Propietario</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pacientes.map((paciente) => (
          <TableRow key={paciente.id}>
            <TableCell className="font-medium">{paciente.nombre}</TableCell>
            <TableCell>{paciente.especie || '-'}</TableCell>
            <TableCell>{paciente.raza || '-'}</TableCell>
            <TableCell>
              {/* MODIFICACIÓN AQUÍ: Accedemos al primer propietario en el array */}
              {(paciente.propietarios && paciente.propietarios.length > 0 && paciente.propietarios[0])
                ? paciente.propietarios[0].nombre_completo // Accede al nombre_completo del primer objeto propietario
                : 'N/A'}
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button asChild variant="outline" size="sm">
                {/* Enlace para editar paciente (lo haremos después) */}
                <Link href={`/dashboard/pacientes/${paciente.id}/editar`}>
                  Editar
                </Link>
              </Button>
              <Button variant="destructive" size="sm">
                {/* Botón para eliminar paciente (lo haremos después) */}
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}