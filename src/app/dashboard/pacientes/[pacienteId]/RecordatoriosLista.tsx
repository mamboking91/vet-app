"use client";

import { useTransition } from "react";
import { RecordatorioSalud } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BellRing, CheckCircle2, Trash2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { format, parseISO, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { marcarRecordatorioCompletado, eliminarRecordatorio } from "./actions";
import { Badge } from "@/components/ui/badge";

interface RecordatoriosListaProps {
  recordatorios: RecordatorioSalud[];
  pacienteId: string;
}

export default function RecordatoriosLista({ recordatorios, pacienteId }: RecordatoriosListaProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggleCompletado = (recordatorio: RecordatorioSalud) => {
    startTransition(async () => {
      const result = await marcarRecordatorioCompletado(recordatorio.id, !recordatorio.completado, pacienteId);
      if (result.success) {
        toast.success(`Recordatorio ${!recordatorio.completado ? 'marcado como completado' : 'restaurado'}.`);
      } else {
        // --- INICIO DE LA CORRECCIÓN 1 ---
        // Accedemos a la propiedad `message` del objeto de error.
        toast.error("Error al actualizar el recordatorio", { description: result.error?.message });
        // --- FIN DE LA CORRECCIÓN 1 ---
      }
    });
  };

  const handleDelete = (recordatorioId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este recordatorio?")) {
      startTransition(async () => {
        const result = await eliminarRecordatorio(recordatorioId, pacienteId);
        if (result.success) {
          toast.success("Recordatorio eliminado.");
        } else {
          // --- INICIO DE LA CORRECCIÓN 2 ---
          // Accedemos a la propiedad `message` del objeto de error.
          toast.error("Error al eliminar el recordatorio", { description: result.error?.message });
          // --- FIN DE LA CORRECCIÓN 2 ---
        }
      });
    }
  };

  const recordatoriosPendientes = recordatorios.filter(r => !r.completado);
  const recordatoriosCompletados = recordatorios.filter(r => r.completado);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recordatorios</span>
          <Button size="sm" asChild>
            <Link href={`/dashboard/pacientes/${pacienteId}/recordatorios/nuevo`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir
            </Link>
          </Button>
        </CardTitle>
        <CardDescription>Próximas citas, vacunas y tratamientos.</CardDescription>
      </CardHeader>
      <CardContent>
        {recordatorios.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay recordatorios programados.</p>
        ) : (
          <div className="space-y-4">
            {recordatoriosPendientes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Pendientes</h4>
                {recordatoriosPendientes.map(r => {
                  const isVencido = isPast(parseISO(r.fecha_proxima));
                  return (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Button size="icon" variant="ghost" onClick={() => handleToggleCompletado(r)} disabled={isPending}>
                          <CheckCircle2 className="h-5 w-5 text-gray-400 hover:text-green-500" />
                        </Button>
                        <div>
                           <p className="font-medium">{r.tipo}</p>
                           <p className={`text-sm ${isVencido ? 'text-red-500' : 'text-muted-foreground'}`}>
                               {format(parseISO(r.fecha_proxima), "dd 'de' MMMM, yyyy", { locale: es })}
                           </p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)} disabled={isPending}>
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            {recordatoriosCompletados.length > 0 && (
               <div className="space-y-2">
                <h4 className="font-semibold text-gray-400">Completados</h4>
                 {recordatoriosCompletados.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded-lg">
                       <div className="flex items-center gap-3">
                         <Button size="icon" variant="ghost" onClick={() => handleToggleCompletado(r)} disabled={isPending}>
                           <CheckCircle2 className="h-5 w-5 text-green-500" />
                         </Button>
                         <div className="text-muted-foreground line-through">
                           <p className="font-medium">{r.tipo}</p>
                           <p className="text-sm">
                               {format(parseISO(r.fecha_proxima), "dd 'de' MMMM, yyyy", { locale: es })}
                           </p>
                        </div>
                       </div>
                    </div>
                 ))}
               </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}