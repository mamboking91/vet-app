// app/dashboard/citas/nueva/CitaForm.tsx
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { agregarCita, actualizarCita } from '../actions'; // Importamos ambas acciones
import type { PacienteParaSelector } from './page'; // Tipo para el selector de pacientes

// Tipo para los datos del formulario, todos los campos como string para los inputs
type CitaFormData = {
  paciente_id: string;
  fecha_hora_inicio: string;
  duracion_estimada_minutos: string;
  motivo: string;
  tipo: string;
  estado: string; // Añadimos estado al formulario
  notas_cita: string;
};

// Opciones para el tipo de cita (podrían venir de un archivo de constantes)
const tiposDeCitaOpciones = [
  { value: "Consulta General", label: "Consulta General" },
  { value: "Vacunación", label: "Vacunación" },
  { value: "Desparasitación", label: "Desparasitación" },
  { value: "Revisión", label: "Revisión" },
  { value: "Cirugía Programada", label: "Cirugía Programada" },
  { value: "Urgencia", label: "Urgencia" },
  { value: "Peluquería", label: "Peluquería" },
  { value: "Otro", label: "Otro" },
];
export type TipoCitaValue = typeof tiposDeCitaOpciones[number]['value'];

// Opciones para el estado de la cita
const estadosDeCitaOpciones = [
  "Programada", "Confirmada", "Cancelada por Clínica", 
  "Cancelada por Cliente", "Completada", "No Asistió", "Reprogramada"
] as const;
export type EstadoCitaValue = typeof estadosDeCitaOpciones[number];


interface CitaFormProps {
  pacientes: PacienteParaSelector[];
  tiposDeCita: readonly TipoCitaValue[]; // Array de strings (los values)
  estadosDeCita?: readonly EstadoCitaValue[]; // Opcional, para el selector de estado
  initialData?: Partial<CitaFormData>;
  citaId?: string;
}

type FieldErrors = { [key: string]: string[] | undefined; };

export default function CitaForm({ 
  pacientes, 
  tiposDeCita, // Ya no usamos este prop, usamos tiposDeCitaOpciones directamente
  estadosDeCita, // Recibimos los estados
  initialData, 
  citaId 
}: CitaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  const isEditMode = Boolean(citaId && initialData);

  // Estados para los campos controlados
  const [pacienteId, setPacienteId] = useState(initialData?.paciente_id || '');
  const [fechaHoraInicio, setFechaHoraInicio] = useState(initialData?.fecha_hora_inicio || '');
  const [duracion, setDuracion] = useState(initialData?.duracion_estimada_minutos || '30');
  const [tipoCita, setTipoCita] = useState(initialData?.tipo || '');
  const [estadoCita, setEstadoCita] = useState(initialData?.estado || 'Programada'); // Estado por defecto para nuevas citas
  const [motivo, setMotivo] = useState(initialData?.motivo || '');
  const [notas, setNotas] = useState(initialData?.notas_cita || '');
  
  // Sincronizar el estado si initialData cambia (importante para el modo edición)
  useEffect(() => {
    if (initialData) {
      setPacienteId(initialData.paciente_id || '');
      setFechaHoraInicio(initialData.fecha_hora_inicio || '');
      setDuracion(initialData.duracion_estimada_minutos || '30');
      setTipoCita(initialData.tipo || '');
      setEstadoCita(initialData.estado || 'Programada');
      setMotivo(initialData.motivo || '');
      setNotas(initialData.notas_cita || '');
    }
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    const formData = new FormData(event.currentTarget);
    // Los componentes Select de shadcn/ui actualizan su valor a través de onValueChange.
    // Si sus 'name' props están bien puestas, FormData debería recogerlos.
    // Si no, necesitaríamos añadirlos manualmente como hicimos antes:
    // formData.set('paciente_id', pacienteId); // Si el Select no tiene 'name' o su valor no se coge bien
    // formData.set('tipo', tipoCita);
    // formData.set('estado', estadoCita);


    startTransition(async () => {
      let result;
      if (isEditMode && citaId) {
        result = await actualizarCita(citaId, formData);
      } else {
        result = await agregarCita(formData);
      }
      
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        // Si es modo edición, podríamos querer volver a la página de detalle de esa cita,
        // o a la lista general. Por ahora, a la lista general.
        router.push(isEditMode ? `/dashboard/citas` : '/dashboard/citas'); // O `/dashboard/citas/${citaId}` si volvemos al detalle
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <Label htmlFor="paciente_id" className="mb-1.5 block">Paciente</Label>
        <Select name="paciente_id" required value={pacienteId} onValueChange={setPacienteId} disabled={isEditMode && !!initialData?.paciente_id}>
          <SelectTrigger id="paciente_id">
            <SelectValue placeholder="Selecciona un paciente" />
          </SelectTrigger>
          <SelectContent>
            {pacientes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nombre_display}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors?.paciente_id && <p className="text-sm text-red-500 mt-1">{fieldErrors.paciente_id[0]}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="fecha_hora_inicio" className="mb-1.5 block">Fecha y Hora de Inicio</Label>
          <Input 
            id="fecha_hora_inicio" 
            name="fecha_hora_inicio" 
            type="datetime-local" 
            value={fechaHoraInicio}
            onChange={(e) => setFechaHoraInicio(e.target.value)}
            required 
          />
          {fieldErrors?.fecha_hora_inicio && <p className="text-sm text-red-500 mt-1">{fieldErrors.fecha_hora_inicio[0]}</p>}
        </div>
        <div>
          <Label htmlFor="duracion_estimada_minutos" className="mb-1.5 block">Duración Estimada (minutos)</Label>
          <Input 
            id="duracion_estimada_minutos" 
            name="duracion_estimada_minutos" 
            type="number" 
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            min="15" 
            step="15"
          />
          {fieldErrors?.duracion_estimada_minutos && <p className="text-sm text-red-500 mt-1">{fieldErrors.duracion_estimada_minutos[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="tipo" className="mb-1.5 block">Tipo de Cita</Label>
          <Select name="tipo" value={tipoCita} onValueChange={setTipoCita}>
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Selecciona un tipo de cita" />
            </SelectTrigger>
            <SelectContent>
              {tiposDeCitaOpciones.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors?.tipo && <p className="text-sm text-red-500 mt-1">{fieldErrors.tipo[0]}</p>}
        </div>
        {/* Solo mostramos el selector de estado si estamos en modo edición */}
        {isEditMode && (
           <div>
             <Label htmlFor="estado" className="mb-1.5 block">Estado de la Cita</Label>
             <Select name="estado" value={estadoCita} onValueChange={setEstadoCita}>
               <SelectTrigger id="estado">
                 <SelectValue placeholder="Selecciona un estado" />
               </SelectTrigger>
               <SelectContent>
                 {(estadosDeCita || estadosDeCitaOpciones).map((e) => ( // Usa el prop o el local
                   <SelectItem key={e} value={e}> 
                     {e} {/* Asumiendo que los valores son los mismos que los labels */}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
             {fieldErrors?.estado && <p className="text-sm text-red-500 mt-1">{fieldErrors.estado[0]}</p>}
           </div>
        )}
      </div>


      <div>
        <Label htmlFor="motivo" className="mb-1.5 block">Motivo de la Cita (opcional)</Label>
        <Textarea id="motivo" name="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} />
        {fieldErrors?.motivo && <p className="text-sm text-red-500 mt-1">{fieldErrors.motivo[0]}</p>}
      </div>

      <div>
        <Label htmlFor="notas_cita" className="mb-1.5 block">Notas Adicionales (opcional)</Label>
        <Textarea id="notas_cita" name="notas_cita" value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
        {fieldErrors?.notas_cita && <p className="text-sm text-red-500 mt-1">{fieldErrors.notas_cita[0]}</p>}
      </div>
      
      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending 
            ? (isEditMode ? "Actualizando Cita..." : "Programando Cita...") 
            : (isEditMode ? "Guardar Cambios" : "Programar Cita")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}