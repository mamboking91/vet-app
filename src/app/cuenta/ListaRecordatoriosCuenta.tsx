"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format, parseISO, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { PawPrint, Calendar, ChevronRight } from "lucide-react";

// Definimos el tipo aquí y lo exportamos para que la página lo pueda usar.
export type RecordatorioParaLista = {
    id: string;
    tipo: string;
    fecha_proxima: string;
    completado: boolean;
    pacientes: {
        id: string;
        nombre: string;
    } | null;
}

interface ListaRecordatoriosCuentaProps {
  recordatorios: RecordatorioParaLista[];
}

export default function ListaRecordatoriosCuenta({ recordatorios }: ListaRecordatoriosCuentaProps) {
  if (recordatorios.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12 border-2 border-dashed rounded-lg">
        <h2 className="text-2xl font-semibold">¡Todo en orden!</h2>
        <p>No tienes recordatorios pendientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recordatorios.map((r) => {
        const isVencido = !r.completado && isPast(parseISO(r.fecha_proxima));
        return (
          // Usamos `passHref` con el componente `<a>` legacy para asegurar una navegación correcta.
          <Link key={r.id} href={`/cuenta/mascotas/${r.pacientes?.id}`} passHref legacyBehavior>
            <a className="block">
              <Card className="hover:border-purple-500 hover:bg-purple-50/50 transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <Badge variant={isVencido ? "destructive" : "secondary"}>
                      {r.tipo}
                    </Badge>
                    <p className="font-semibold text-lg mt-1 flex items-center gap-2">
                        <PawPrint className="h-5 w-5 text-purple-600"/>
                        {r.pacientes?.nombre || "Mascota no encontrada"}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>{format(parseISO(r.fecha_proxima), "dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </CardContent>
              </Card>
            </a>
          </Link>
        );
      })}
    </div>
  );
}