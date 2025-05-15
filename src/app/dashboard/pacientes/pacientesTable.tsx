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
// Importa el tipo que definimos en page.tsx
import type { PacienteConPropietario } from './page'; 
// (O define el tipo aquí, o muévelo a un archivo de tipos compartido, ej: types.ts)

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
              {/* Accedemos al nombre del propietario a través del objeto anidado */}
              {paciente.propietarios?.nombre_completo || 'N/A'}
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