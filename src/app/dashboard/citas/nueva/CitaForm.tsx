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
import { agregarCita, actualizarCita } from '../actions'; 
import type { 
  PacienteParaSelector, 
  CitaFormData 
} from '../types'; 
import { 
  tiposDeCitaOpciones, 
  estadosDeCitaOpciones 
} from '../types'; // CitaForm importa las opciones directamente

// MODIFICACIÓN AQUÍ: CitaFormProps ya no requiere tiposDeCita ni estadosDeCita
interface CitaFormProps {
  pacientes: PacienteParaSelector[];
  initialData?: Partial<CitaFormData>;
  citaId?: string;
}

type FieldErrors = { [key: string]: string[] | undefined; };

// Ya no necesitamos definir tiposDeCitaDisplay y estadosDeCitaDisplay localmente
// si importamos tiposDeCitaOpciones y estadosDeCitaOpciones de ../types.ts
// y estos ya tienen la estructura { value, label } o son un array de strings.
// (En types.ts, tiposDeCitaOpciones tiene {value, label}, estadosDeCitaOpciones es string[])

export default function CitaForm({ 
  pacientes, 
  initialData, 
  citaId 
}: CitaFormProps) { // Props actualizadas
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  const isEditMode = Boolean(citaId && initialData);

  const [pacienteId, setPacienteId] = useState(initialData?.paciente_id || '');
  const [fechaHoraInicio, setFechaHoraInicio] = useState(initialData?.fecha_hora_inicio || '');
  const [duracion, setDuracion] = useState(initialData?.duracion_estimada_minutos || '30');
  const [tipoCita, setTipoCita] = useState(initialData?.tipo || '');
  const [estadoCita, setEstadoCita] = useState(initialData?.estado || 'Programada');
  const [motivo, setMotivo] = useState(initialData?.motivo || '');
  const [notas, setNotas] = useState(initialData?.notas_cita || '');
  
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
        router.push(isEditMode ? `/dashboard/citas` : '/dashboard/citas'); 
        router.refresh(); 
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Paciente Selector */}
      <div>
        <Label htmlFor="paciente_id" className="mb-1.5 block">Paciente</Label>
        <Select name="paciente_id" required value={pacienteId} onValueChange={setPacienteId} disabled={isEditMode && !!initialData?.paciente_id}>
          <SelectTrigger id="paciente_id"><SelectValue placeholder="Selecciona un paciente" /></SelectTrigger>
          <SelectContent>
            {pacientes.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nombre_display}</SelectItem>))}
          </SelectContent>
        </Select>
        {fieldErrors?.paciente_id && <p className="text-sm text-red-500 mt-1">{fieldErrors.paciente_id[0]}</p>}
      </div>

      {/* Fecha y Hora de Inicio / Duración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="fecha_hora_inicio" className="mb-1.5 block">Fecha y Hora de Inicio</Label>
          <Input id="fecha_hora_inicio" name="fecha_hora_inicio" type="datetime-local" value={fechaHoraInicio} onChange={(e) => setFechaHoraInicio(e.target.value)} required />
          {fieldErrors?.fecha_hora_inicio && <p className="text-sm text-red-500 mt-1">{fieldErrors.fecha_hora_inicio[0]}</p>}
        </div>
        <div>
          <Label htmlFor="duracion_estimada_minutos" className="mb-1.5 block">Duración Estimada (minutos)</Label>
          <Input id="duracion_estimada_minutos" name="duracion_estimada_minutos" type="number" value={duracion} onChange={(e) => setDuracion(e.target.value)} min="15" step="15"/>
          {fieldErrors?.duracion_estimada_minutos && <p className="text-sm text-red-500 mt-1">{fieldErrors.duracion_estimada_minutos[0]}</p>}
        </div>
      </div>

      {/* Tipo de Cita y Estado de Cita (este último solo en modo edición) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="tipo" className="mb-1.5 block">Tipo de Cita</Label>
          <Select name="tipo" value={tipoCita} onValueChange={setTipoCita}>
            <SelectTrigger id="tipo"><SelectValue placeholder="Selecciona un tipo de cita" /></SelectTrigger>
            <SelectContent>
              {tiposDeCitaOpciones.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
            </SelectContent>
          </Select>
          {fieldErrors?.tipo && <p className="text-sm text-red-500 mt-1">{fieldErrors.tipo[0]}</p>}
        </div>
        {isEditMode && (
           <div>
             <Label htmlFor="estado" className="mb-1.5 block">Estado de la Cita</Label>
             <Select name="estado" value={estadoCita} onValueChange={setEstadoCita}>
               <SelectTrigger id="estado"><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
               <SelectContent>
                 {estadosDeCitaOpciones.map((e_val) => (<SelectItem key={e_val} value={e_val}>{e_val}</SelectItem>))}
               </SelectContent>
             </Select>
             {fieldErrors?.estado && <p className="text-sm text-red-500 mt-1">{fieldErrors.estado[0]}</p>}
           </div>
        )}
      </div>

      {/* Motivo y Notas */}
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
          {isPending ? (isEditMode ? "Actualizando Cita..." : "Programando Cita...") : (isEditMode ? "Guardar Cambios" : "Programar Cita")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}