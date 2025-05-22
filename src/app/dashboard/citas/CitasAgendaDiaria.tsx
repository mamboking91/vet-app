// app/dashboard/citas/CitasAgendaDiaria.tsx
"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3Icon, UserIcon, DogIcon, ClockIcon, XCircleIcon } from 'lucide-react'; // Añadido XCircleIcon
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { CitaConDetalles, EstadoCitaValue } from './types'; // Importa el tipo de estado
import { cambiarEstadoCita } from './actions'; // Importa la acción para cambiar estado

interface CitasAgendaDiariaProps {
  citas: CitaConDetalles[];
  fechaSeleccionada: Date;
}

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

export default function CitasAgendaDiaria({ citas, fechaSeleccionada }: CitasAgendaDiariaProps) {
  const router = useRouter();
  const [isCanceling, startCancelTransition] = useTransition(); // Transición para cancelar
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCitaClick = (citaId: string) => {
    console.log("Ver detalles de cita ID:", citaId);
    // Futuro: router.push(`/dashboard/citas/${citaId}`); // Para ver detalle si se implementa
  };

  const handleCancelarCita = async (cita: CitaConDetalles) => {
    setActionError(null);
    startCancelTransition(async () => {
      // Asumimos que tenemos el pacienteId disponible para revalidar su página.
      // El tipo CitaConDetalles tiene pacientes.id
      const pacienteId = cita.pacientes?.id;
      const result = await cambiarEstadoCita(cita.id, "Cancelada por Clínica", pacienteId || undefined);
      if (!result.success) {
        setActionError(result.error?.message || "Error al cancelar la cita.");
        console.error("Error al cancelar cita (cliente):", result.error);
      } else {
        router.refresh(); // Refresca la vista actual para mostrar el estado actualizado
      }
    });
  };


  if (citas.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">
          No hay citas programadas para el {format(fechaSeleccionada, 'PPP', { locale: es })}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md" role="alert">
          Error: {actionError}
        </div>
      )}
      {citas.map((cita) => (
        <Card 
          key={cita.id} 
          className="hover:shadow-md transition-shadow"
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-primary" />
                  {format(parseISO(cita.fecha_hora_inicio), 'p', { locale: es })}
                  {cita.fecha_hora_fin && ` - ${format(parseISO(cita.fecha_hora_fin), 'p', { locale: es })}`}
                  {cita.duracion_estimada_minutos && !cita.fecha_hora_fin && ` (${cita.duracion_estimada_minutos} min)`}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {cita.tipo || 'Cita General'}
                </CardDescription>
              </div>
              <Badge variant={getEstadoBadgeVariant(cita.estado)} className="text-xs whitespace-nowrap">
                {cita.estado}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-2 pt-0">
            {cita.pacientes?.nombre && (
              <div className="flex items-center">
                <DogIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">Paciente:</span>&nbsp;
                <Link 
                  href={`/dashboard/pacientes/${cita.pacientes.id}`} 
                  className="text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {cita.pacientes.nombre}
                </Link>
              </div>
            )}
            {cita.pacientes?.propietarios?.nombre_completo && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <UserIcon className="h-3 w-3 mr-2" />
                <span>Dueño: {cita.pacientes.propietarios.nombre_completo}</span>
              </div>
            )}
            {cita.motivo && <p className="text-xs mt-1"><span className="font-medium">Motivo:</span> {cita.motivo}</p>}
            
            <div className="pt-3 flex justify-end space-x-2">
              <Button 
                asChild 
                variant="outline" 
                size="sm" 
                className="px-2 py-1 h-auto text-xs"
              >
                <Link href={`/dashboard/citas/${cita.id}/editar`}>
                  <Edit3Icon className="h-3 w-3 mr-1" />
                  Editar/Ver
                </Link>
              </Button>
              {/* Botón y AlertDialog para Cancelar Cita */}
              {/* Solo mostrar si la cita no está ya Cancelada o Completada */}
              {cita.estado !== 'Completada' && 
               !cita.estado.toLowerCase().includes('cancelada') && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="px-2 py-1 h-auto text-xs"
                      disabled={isCanceling}
                    >
                      <XCircleIcon className="h-3 w-3 mr-1" />
                      Cancelar Cita
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Seguro que quieres cancelar esta cita?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cita para: {cita.pacientes?.nombre || 'N/A'} el {format(parseISO(cita.fecha_hora_inicio), 'PPP p', { locale: es })}.
                        Esta acción cambiará el estado de la cita a "Cancelada por Clínica".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isCanceling}>No, mantener</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleCancelarCita(cita)}
                        disabled={isCanceling}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {isCanceling ? "Cancelando..." : "Sí, cancelar cita"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}