// app/dashboard/citas/CalendarioMensualCitas.tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns'; // parseISO ya no es tan necesario aquí si las fechas ya son objetos Date
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import type { WeekInMonth, DayInMonth, CitaConDetalles } from './types'; // Importa desde types.ts
import { Badge } from "@/components/ui/badge";
import { ClockIcon } from 'lucide-react';

interface CalendarioMensualCitasProps {
  semanas: WeekInMonth[];
  currentDisplayMonth: Date; // Para saber el mes que se está mostrando
}

// Copiamos o importamos esta función
const getEstadoBadgeVariant = (estado?: string): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
  switch (estado?.toLowerCase()) {
    case 'programada': return "outline";
    case 'confirmada': return "default";
    case 'completada': return "success";
    case 'cancelada por clínica':
    case 'cancelada por cliente':
    case 'no asistió': return "destructive";
    case 'reprogramada': return "warning";
    default: return "secondary";
  }
};

export default function CalendarioMensualCitas({ semanas, currentDisplayMonth }: CalendarioMensualCitasProps) {
  const router = useRouter();
  const diasSemanaHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const handleDayClick = (day: DayInMonth) => {
    if (day.isCurrentMonth) {
      const fechaFormateada = format(day.date, 'yyyy-MM-dd');
      // Navegar a la vista diaria (la que teníamos antes o una nueva si se prefiere)
      // La vista diaria anterior ya usa el searchParam 'fecha'
      router.push(`/dashboard/citas?fecha=${fechaFormateada}`); 
    }
  };

  const handleCitaClick = (citaId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que se active el click del día
    router.push(`/dashboard/citas/${citaId}/editar`); // Ir a editar/detalle
  };

  if (!semanas || semanas.length === 0) {
    return <p className="text-center text-gray-500">No hay datos del calendario para mostrar.</p>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Encabezados de los días de la semana */}
      <div className="grid grid-cols-7 border-b">
        {diasSemanaHeaders.map(header => (
          <div key={header} className="p-2 text-center font-medium text-sm text-gray-600 dark:text-gray-300">
            {header}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      {semanas.map((semana, indexSemana) => (
        <div key={indexSemana} className="grid grid-cols-7 min-h-[120px] md:min-h-[150px]">
          {semana.map((dia) => (
            <div
              key={dia.date.toString()}
              className={cn(
                "p-1 md:p-2 border-r border-b text-xs md:text-sm relative flex flex-col",
                dia.isCurrentMonth ? "bg-white dark:bg-slate-900" : "bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500",
                dia.isToday && "bg-blue-50 dark:bg-blue-900/30",
                "hover:bg-gray-100 dark:hover:bg-slate-700/50 cursor-pointer" // Hacer toda la celda clickeable
              )}
              onClick={() => handleDayClick(dia)}
            >
              <span className={cn("font-medium mb-1", dia.isToday && "text-blue-600 font-bold")}>
                {dia.dayNumber}
              </span>
              <div className="space-y-1 overflow-y-auto flex-grow max-h-[80px] md:max-h-[100px]">
                {dia.citasDelDia.map(cita => (
                  <div 
                    key={cita.id} 
                    onClick={(e) => handleCitaClick(cita.id, e)}
                    className={cn(
                      "p-1 rounded text-[10px] md:text-xs leading-tight cursor-pointer hover:opacity-80",
                      getEstadoBadgeVariant(cita.estado) === 'destructive' ? 'bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-200' :
                      getEstadoBadgeVariant(cita.estado) === 'success' ? 'bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-200' :
                      getEstadoBadgeVariant(cita.estado) === 'warning' ? 'bg-yellow-100 dark:bg-yellow-800/50 text-yellow-700 dark:text-yellow-200' :
                      'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-200'
                    )}
                    title={`${format(parseISO(cita.fecha_hora_inicio), 'p', {locale: es})} - ${cita.pacientes?.nombre || 'Paciente Desconocido'}`}
                  >
                    <ClockIcon className="h-3 w-3 inline-block mr-1" /> 
                    {format(parseISO(cita.fecha_hora_inicio), 'p', {locale: es})}
                    <span className="font-semibold ml-1 truncate block md:inline">
                       {cita.pacientes?.nombre || 'Paciente desc.'}
                    </span>
                    {/* <Badge variant={getEstadoBadgeVariant(cita.estado)} className="text-[8px] md:text-[10px] ml-1 px-1 py-0">{cita.estado}</Badge> */}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}