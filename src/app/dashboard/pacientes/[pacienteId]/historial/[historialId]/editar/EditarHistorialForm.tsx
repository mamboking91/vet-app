// app/dashboard/pacientes/[pacienteId]/historial/[historialId]/editar/EditarHistorialForm.tsx
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
import { actualizarEntradaHistorial } from '../../actions'; // Ajusta la ruta si actions.ts está en ../historial/actions.ts
import type { HistorialMedicoEditable } from './page';

interface EditarHistorialFormProps {
  entradaHistorial: HistorialMedicoEditable;
  pacienteId: string;
}

const tiposRegistroMedicoOpciones = [
  { value: "Consulta", label: "Consulta" },
  { value: "Vacunación", label: "Vacunación" },
  { value: "Desparasitación", label: "Desparasitación" },
  { value: "Procedimiento", label: "Procedimiento" },
  { value: "Observación", label: "Observación" },
  { value: "Análisis Laboratorio", label: "Análisis Laboratorio" },
  { value: "Imagenología", label: "Imagenología (Rayos X, Eco)" },
  { value: "Cirugía", label: "Cirugía" },
  { value: "Otro", label: "Otro" },
];

type FieldErrors = { [key: string]: string[] | undefined; };

export default function EditarHistorialForm({ entradaHistorial, pacienteId }: EditarHistorialFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  const [fechaEvento, setFechaEvento] = useState(entradaHistorial.fecha_evento);
  const [tipo, setTipo] = useState(entradaHistorial.tipo);
  const [descripcion, setDescripcion] = useState(entradaHistorial.descripcion);
  const [diagnostico, setDiagnostico] = useState(entradaHistorial.diagnostico || '');
  const [tratamientoIndicado, setTratamientoIndicado] = useState(entradaHistorial.tratamiento_indicado || '');
  const [notasSeguimiento, setNotasSeguimiento] = useState(entradaHistorial.notas_seguimiento || '');

  useEffect(() => {
    setFechaEvento(entradaHistorial.fecha_evento);
    setTipo(entradaHistorial.tipo);
    setDescripcion(entradaHistorial.descripcion);
    setDiagnostico(entradaHistorial.diagnostico || '');
    setTratamientoIndicado(entradaHistorial.tratamiento_indicado || '');
    setNotasSeguimiento(entradaHistorial.notas_seguimiento || '');
  }, [entradaHistorial]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await actualizarEntradaHistorial(entradaHistorial.id, formData);
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error al actualizar.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        router.push(`/dashboard/pacientes/${pacienteId}`);
        router.refresh(); 
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="fecha_evento" className="mb-1.5 block">Fecha del Evento</Label>
          <Input id="fecha_evento" name="fecha_evento" type="date" value={fechaEvento} onChange={(e) => setFechaEvento(e.target.value)} required />
          {fieldErrors?.fecha_evento && <p className="text-sm text-red-500 mt-1">{fieldErrors.fecha_evento[0]}</p>}
        </div>
        <div>
          <Label htmlFor="tipo" className="mb-1.5 block">Tipo de Registro</Label>
          <Select name="tipo" required value={tipo} onValueChange={setTipo}>
            <SelectTrigger id="tipo"><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
            <SelectContent>
              {tiposRegistroMedicoOpciones.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
            </SelectContent>
          </Select>
          {fieldErrors?.tipo && <p className="text-sm text-red-500 mt-1">{fieldErrors.tipo[0]}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="descripcion" className="mb-1.5 block">Descripción Detallada</Label>
        <Textarea id="descripcion" name="descripcion" rows={5} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
        {fieldErrors?.descripcion && <p className="text-sm text-red-500 mt-1">{fieldErrors.descripcion[0]}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="diagnostico" className="mb-1.5 block">Diagnóstico (opcional)</Label>
          <Textarea id="diagnostico" name="diagnostico" rows={3} value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
          {fieldErrors?.diagnostico && <p className="text-sm text-red-500 mt-1">{fieldErrors.diagnostico[0]}</p>}
        </div>
        <div>
          <Label htmlFor="tratamiento_indicado" className="mb-1.5 block">Tratamiento Indicado (opcional)</Label>
          <Textarea id="tratamiento_indicado" name="tratamiento_indicado" rows={3} value={tratamientoIndicado} onChange={(e) => setTratamientoIndicado(e.target.value)} />
          {fieldErrors?.tratamiento_indicado && <p className="text-sm text-red-500 mt-1">{fieldErrors.tratamiento_indicado[0]}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="notas_seguimiento" className="mb-1.5 block">Notas de Seguimiento (opcional)</Label>
        <Textarea id="notas_seguimiento" name="notas_seguimiento" rows={3} value={notasSeguimiento} onChange={(e) => setNotasSeguimiento(e.target.value)} />
        {fieldErrors?.notas_seguimiento && <p className="text-sm text-red-500 mt-1">{fieldErrors.notas_seguimiento[0]}</p>}
      </div>
      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>{isPending ? "Actualizando Entrada..." : "Guardar Cambios"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}