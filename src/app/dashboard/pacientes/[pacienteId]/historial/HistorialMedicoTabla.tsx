"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FilePenLine } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { HistorialMedico } from "../../types"; // Importamos el tipo central

// Props del componente, ahora usando el tipo HistorialMedico importado
interface HistorialMedicoTablaProps {
  historial: HistorialMedico[];
  pacienteId: string;
  nombrePaciente: string;
}

export default function HistorialMedicoTabla({
  historial,
  pacienteId,
  nombrePaciente,
}: HistorialMedicoTablaProps) {
  if (!historial || historial.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No hay registros en el historial clínico de {nombrePaciente}.</p>
        <Button asChild className="mt-4">
          <Link href={`/dashboard/pacientes/${pacienteId}/historial/nuevo`}>
            Añadir Primer Registro
          </Link>
        </Button>
      </div>
    );
  }

  // Función para formatear la fecha de forma segura
  const formatSafeDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "dd 'de' MMMM, yyyy", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Tipo/Motivo</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {historial.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              {formatSafeDate(item.fecha_evento)}
            </TableCell>
            <TableCell>
              {/* Manejamos el caso de que el tipo sea null */}
              <Badge variant="outline">{item.tipo || "No especificado"}</Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {/* Manejamos el caso de que la descripción sea null */}
              {item.descripcion || "Sin descripción"}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" asChild>
                <Link
                  href={`/dashboard/pacientes/${pacienteId}/historial/${item.id}`}
                >
                  <FilePenLine className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}