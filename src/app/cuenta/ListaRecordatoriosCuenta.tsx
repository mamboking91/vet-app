"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format, parseISO, isPast, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { PawPrint, Calendar, ChevronRight, AlertTriangle } from "lucide-react";

// El tipo de dato que espera el componente. Lo exportamos para que la página lo use.
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
  
  // --- INICIO DE LA CORRECCIÓN ---
  // Obtenemos la fecha de hoy para comparar.
  const hoy = startOfToday();

  // Filtramos los recordatorios en dos grupos: vencidos y próximos.
  const recordatoriosVencidos = recordatorios.filter(r => parseISO(r.fecha_proxima) < hoy);
  const recordatoriosProximos = recordatorios.filter(r => parseISO(r.fecha_proxima) >= hoy);
  // --- FIN DE LA CORRECCIÓN ---

  if (recordatorios.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12 border-2 border-dashed rounded-lg">
        <h2 className="text-2xl font-semibold">¡Todo en orden!</h2>
        <p>No tienes recordatorios pendientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sección para los Próximos Recordatorios */}
      {recordatoriosProximos.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Próximos</h2>
          {recordatoriosProximos.map((r) => (
            <Link key={r.id} href={`/cuenta/mascotas/${r.pacientes?.id}`} passHref legacyBehavior>
              <a className="block">
                <Card className="hover:border-purple-500 hover:bg-purple-50/50 transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <Badge variant="secondary">{r.tipo}</Badge>
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
          ))}
        </section>
      )}

      {/* Sección para los Recordatorios Vencidos (solo si existen) */}
      {recordatoriosVencidos.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Vencidos
          </h2>
          {recordatoriosVencidos.map((r) => (
            <Link key={r.id} href={`/cuenta/mascotas/${r.pacientes?.id}`} passHref legacyBehavior>
              <a className="block">
                <Card className="border-destructive/50 hover:border-destructive hover:bg-destructive/5 transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <Badge variant="destructive">{r.tipo}</Badge>
                      <p className="font-semibold text-lg mt-1 flex items-center gap-2">
                          <PawPrint className="h-5 w-5 text-destructive"/>
                          {r.pacientes?.nombre || "Mascota no encontrada"}
                      </p>
                      <div className="flex items-center text-sm text-destructive mt-1">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Venció el {format(parseISO(r.fecha_proxima), "dd 'de' MMMM, yyyy", { locale: es })}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-gray-400" />
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}