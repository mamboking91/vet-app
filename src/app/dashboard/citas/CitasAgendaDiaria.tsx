"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit3Icon, UserIcon, Heart, ClockIcon, Calendar, Stethoscope } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import type { CitaConDetalles } from "./types"

interface CitasAgendaDiariaProps {
  citas: CitaConDetalles[]
  fechaSeleccionada: Date
}

const getEstadoBadgeVariant = (
  estado?: string,
): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
  switch (estado?.toLowerCase()) {
    case "programada":
      return "outline"
    case "confirmada":
      return "default"
    case "completada":
      return "success"
    case "cancelada por clínica":
    case "cancelada por cliente":
    case "no asistió":
      return "destructive"
    case "reprogramada":
      return "warning"
    default:
      return "secondary"
  }
}

const getEstadoIcon = (estado?: string) => {
  switch (estado?.toLowerCase()) {
    case "completada":
      return "✅"
    case "confirmada":
      return "🟢"
    case "programada":
      return "🔵"
    case "cancelada por clínica":
    case "cancelada por cliente":
      return "❌"
    case "no asistió":
      return "⚠️"
    case "reprogramada":
      return "🔄"
    default:
      return "📅"
  }
}

export default function CitasAgendaDiaria({ citas, fechaSeleccionada }: CitasAgendaDiariaProps) {
  const router = useRouter()

  const handleCitaClick = (citaId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    router.push(`/dashboard/citas/${citaId}/editar`)
  }

  if (citas.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30 rounded-full flex items-center justify-center mb-6">
          <Calendar className="w-16 h-16 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Sin citas programadas</h3>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No hay citas programadas para el {format(fechaSeleccionada, "PPP", { locale: es })}.
        </p>
        <Button
          asChild
          className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Link href="/dashboard/citas/nueva">Programar nueva cita</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Agenda del {format(fechaSeleccionada, "PPP", { locale: es })}
        </h2>
        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
          {citas.length} {citas.length === 1 ? "cita programada" : "citas programadas"}
        </p>
      </div>

      {citas.map((cita, index) => (
        <Card
          key={cita.id}
          className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-400 hover:border-l-blue-600 bg-gradient-to-r from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30"
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center text-gray-800 dark:text-gray-200">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 mr-3">
                    <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold">
                      {format(parseISO(cita.fecha_hora_inicio), "p", { locale: es })}
                      {cita.fecha_hora_fin && ` - ${format(parseISO(cita.fecha_hora_fin), "p", { locale: es })}`}
                    </span>
                    {cita.duracion_estimada_minutos && !cita.fecha_hora_fin && (
                      <span className="text-sm text-muted-foreground font-normal">
                        Duración estimada: {cita.duracion_estimada_minutos} min
                      </span>
                    )}
                  </div>
                </CardTitle>
                <CardDescription className="text-sm mt-2 flex items-center">
                  <Stethoscope className="w-4 h-4 mr-2 text-blue-500" />
                  {cita.tipo || "Cita General"}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Badge
                  variant={
                    getEstadoBadgeVariant(cita.estado) as
                      | "default"
                      | "destructive"
                      | "outline"
                      | "secondary"
                      | null
                      | undefined
                  }
                  className="text-sm whitespace-nowrap font-semibold px-3 py-1"
                >
                  <span className="mr-1">{getEstadoIcon(cita.estado)}</span>
                  {cita.estado}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="text-sm space-y-4 pt-0">
            {cita.pacientes?.nombre && (
              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center mb-2">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 mr-3">
                    <Heart className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-green-800 dark:text-green-200">Paciente:</span>
                    <Link
                      href={`/dashboard/pacientes/${cita.pacientes.id}`}
                      className="ml-2 text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 font-bold hover:underline transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {cita.pacientes.nombre}
                    </Link>
                  </div>
                </div>
                {cita.pacientes?.propietarios?.nombre_completo && (
                  <div className="flex items-center text-sm text-green-700 dark:text-green-300 ml-11">
                    <UserIcon className="h-3 w-3 mr-2" />
                    <span>Propietario: {cita.pacientes.propietarios.nombre_completo}</span>
                  </div>
                )}
              </div>
            )}

            {cita.motivo && (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <span className="font-semibold text-amber-800 dark:text-amber-200">Motivo de la consulta:</span>
                <p className="text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">{cita.motivo}</p>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button
                asChild
                variant="default"
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105"
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={`/dashboard/citas/${cita.id}/editar`}>
                  <Edit3Icon className="h-4 w-4 mr-2" />
                  Ver detalles
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
