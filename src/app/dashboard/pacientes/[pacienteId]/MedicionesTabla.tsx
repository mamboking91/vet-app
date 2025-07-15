"use client";

import { useTransition } from "react";
import { MedicionPaciente } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, PlusCircle, Eye } from "lucide-react"; // <-- Importamos el icono del ojo
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { eliminarMedicion } from "./actions";

interface MedicionesTablaProps {
  mediciones: MedicionPaciente[];
  pacienteId: string;
}

export default function MedicionesTabla({ mediciones, pacienteId }: MedicionesTablaProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (medicionId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta medición?")) {
      startTransition(async () => {
        const result = await eliminarMedicion(medicionId, pacienteId);
        if (result.success) {
          toast.success("Medición eliminada.");
        } else {
          // --- INICIO DE LA CORRECCIÓN ---
          // Accedemos a la propiedad `message` del objeto de error
          toast.error("Error al eliminar", { description: result.error?.message });
          // --- FIN DE LA CORRECCIÓN ---
        }
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mediciones</span>
          <Button size="sm" asChild>
            <Link href={`/dashboard/pacientes/${pacienteId}/mediciones/nuevo`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir
            </Link>
          </Button>
        </CardTitle>
        <CardDescription>Historial de peso y constantes vitales.</CardDescription>
      </CardHeader>
      <CardContent>
        {mediciones.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay mediciones registradas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Peso (kg)</TableHead>
                <TableHead>Temp (°C)</TableHead>
                {/* Añadimos cabecera para las acciones */}
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mediciones.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{format(parseISO(m.fecha_medicion), "dd/MM/yy", { locale: es })}</TableCell>
                  <TableCell>{m.peso != null ? m.peso : '-'}</TableCell>
                  <TableCell>{m.temperatura != null ? m.temperatura : '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {/* --- INICIO NUEVA FUNCIONALIDAD --- */}
                    {/* Botón para ver el detalle de la medición */}
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/dashboard/pacientes/${pacienteId}/mediciones/${m.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {/* --- FIN NUEVA FUNCIONALIDAD --- */}

                    <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)} disabled={isPending}>
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}