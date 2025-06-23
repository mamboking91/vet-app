"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { WeekInMonth, DayInMonth, CitaConDetallesAnidados } from "./types"
import { ClockIcon, UserIcon, Stethoscope } from "lucide-react"

interface CalendarioMensualCitasProps {
  semanas: WeekInMonth[]
  currentDisplayMonth: Date
}

const getEstadoColors = (estado?: string) => {
  switch (estado?.toLowerCase()) {
    case "pendiente de confirmación":
        return "bg-gradient-to-r from-yellow-50 to-amber-100 dark:from-yellow-950/30 dark:to-amber-900/40 text-yellow-700 dark:text-yellow-300 border-l-4 border-l-yellow-400"
    case "programada":
      return "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/40 text-blue-700 dark:text-blue-300 border-l-4 border-l-blue-400"
    case "confirmada":
      return "bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/40 text-green-700 dark:text-green-300 border-l-4 border-l-green-400"
    case "completada":
      return "bg-gradient-to-r from-emerald-50 to-teal-100 dark:from-emerald-950/30 dark:to-teal-900/40 text-emerald-700 dark:text-emerald-300 border-l-4 border-l-emerald-500"
    case "cancelada por clínica":
    case "cancelada por cliente":
    case "no asistió":
      return "bg-gradient-to-r from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-900/40 text-red-700 dark:text-red-300 border-l-4 border-l-red-400"
    case "reprogramada":
      return "bg-gradient-to-r from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/40 text-amber-700 dark:text-amber-300 border-l-4 border-l-amber-400"
    default:
      return "bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-950/30 dark:to-slate-900/40 text-gray-700 dark:text-gray-300 border-l-4 border-l-gray-400"
  }
}

export default function CalendarioMensualCitas({ semanas, currentDisplayMonth }: CalendarioMensualCitasProps) {
  const router = useRouter()
  const diasSemanaHeaders = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  const handleDayClick = (day: DayInMonth) => {
    if (day.isCurrentMonth) {
      const fechaFormateada = format(day.date, "yyyy-MM-dd")
      router.push(`/dashboard/citas?fecha=${fechaFormateada}`)
    }
  }

  const handleCitaClick = (citaId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    router.push(`/dashboard/citas/${citaId}/editar`)
  }

  if (!semanas || semanas.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30 rounded-full flex items-center justify-center mb-4">
          <Stethoscope className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No hay datos del calendario para mostrar.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
      <div className="grid grid-cols-7 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800">
        {diasSemanaHeaders.map((header) => (
          <div key={header} className="p-4 text-center font-semibold text-sm text-white">
            {header}
          </div>
        ))}
      </div>

      {semanas.map((semana, indexSemana) => (
        <div key={indexSemana} className="grid grid-cols-7 min-h-[140px] md:min-h-[180px]">
          {semana.map((dia) => (
            <div
              key={dia.date.toString()}
              className={cn(
                "p-2 md:p-3 border-r border-b border-gray-100 dark:border-slate-700 text-xs md:text-sm relative flex flex-col transition-all duration-200",
                dia.isCurrentMonth
                  ? "bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  : "bg-gray-50/50 dark:bg-slate-800/50 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700/50",
                dia.isToday &&
                  "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 ring-2 ring-blue-200 dark:ring-blue-800",
                "cursor-pointer group",
              )}
              onClick={() => handleDayClick(dia)}
            >
              <div
                className={cn(
                  "flex items-center justify-between mb-2",
                  dia.isToday && "pb-2 border-b border-blue-200 dark:border-blue-800",
                )}
              >
                <span
                  className={cn(
                    "font-semibold text-sm md:text-base transition-colors",
                    dia.isToday
                      ? "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      : "group-hover:text-blue-600 dark:group-hover:text-blue-400",
                  )}
                >
                  {dia.dayNumber}
                </span>
                {dia.citasDelDia.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {dia.citasDelDia.length}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 overflow-y-auto flex-grow max-h-[100px] md:max-h-[130px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
                {dia.citasDelDia.map((cita) => (
                  <div
                    key={cita.id}
                    onClick={(e) => handleCitaClick(cita.id, e)}
                    className={cn(
                      "p-2 rounded-lg text-[10px] md:text-xs leading-tight cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md",
                      getEstadoColors(cita.estado),
                    )}
                    title={`${format(parseISO(cita.fecha_hora_inicio), "p", { locale: es })} - ${cita.pacientes?.nombre || "Paciente Desconocido"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-3 w-3" />
                        <span className="font-semibold">
                          {format(parseISO(cita.fecha_hora_inicio), "p", { locale: es })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <UserIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="font-medium truncate">{cita.pacientes?.nombre || "Paciente desc."}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}