// app/dashboard/citas/CitasAgendaDiaria.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <--- AÑADE ESTA LÍNEA
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3Icon, UserIcon, DogIcon, ClockIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CitaConDetalles } from './types'; 

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
  const router = useRouter(); // Ahora useRouter está definido

  const handleCitaClick = (citaId: string, event: React.MouseEvent) => {
    event.stopPropagation(); 
    router.push(`/dashboard/citas/${citaId}/editar`); 
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
      {/* Aquí podrías añadir un manejo de error si actionError existiera */}
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
              <Badge variant={getEstadoBadgeVariant(cita.estado) as "default" | "destructive" | "outline" | "secondary" | null | undefined} className="text-xs whitespace-nowrap"> {/* Ajuste de tipo para variant */}
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
                onClick={(e) => { // Para que el click en el botón no active el de la Card (si estuviera activo)
                  e.stopPropagation(); 
                  // router.push(`/dashboard/citas/${cita.id}/editar`); // También podrías hacer la navegación aquí
                }}
              >
                <Link href={`/dashboard/citas/${cita.id}/editar`}>
                  <Edit3Icon className="h-3 w-3 mr-1" />
                  Editar/Detalles
                </Link>
              </Button>
              {/* Lógica para el botón de cancelar (AlertDialog) se añadiría aquí si es necesario */}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}