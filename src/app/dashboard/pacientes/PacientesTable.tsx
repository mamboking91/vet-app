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
import type { PacienteConPropietario } from './types'; // <--- CAMBIO AQUÍ: Importa desde './types'

interface PacientesTableProps {
  pacientes: PacienteConPropietario[];
}

export default function PacientesTable({ pacientes }: PacientesTableProps) {
  if (!pacientes || pacientes.length === 0) {
    return <p className="text-center text-gray-500 py-8">No hay pacientes registrados todavía.</p>;
  }

  return (
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
              <TableCell className="font-medium">{paciente.nombre}</TableCell>
              <TableCell>{paciente.especie || '-'}</TableCell>
              <TableCell className="hidden md:table-cell">{paciente.raza || '-'}</TableCell>
              <TableCell>
                {(paciente.propietarios && paciente.propietarios.length > 0 && paciente.propietarios[0])
                  ? paciente.propietarios[0].nombre_completo
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/pacientes/${paciente.id}/editar`}>
                    Editar
                  </Link>
                </Button>
                <Button variant="destructive" size="sm">
                  Eliminar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
