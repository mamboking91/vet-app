// app/dashboard/pacientes/[pacienteId]/historial/nuevo/HistorialMedicoForm.tsx
"use client";

import React, { useState, useTransition } from 'react';
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
import { agregarEntradaHistorial } from '../actions'; // La Server Action que creamos

interface HistorialMedicoFormProps {
  pacienteId: string;
}

// Estos son los valores de tu ENUM tipo_registro_medico
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

type FieldErrors = {
    [key: string]: string[] | undefined;
};

export default function HistorialMedicoForm({ pacienteId }: HistorialMedicoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  // Obtener la fecha actual en formato YYYY-MM-DD para el valor por defecto
  const today = new Date().toISOString().split('T')[0];
  const [fechaEvento, setFechaEvento] = useState(today);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    const formData = new FormData(event.currentTarget);
    formData.append("paciente_id", pacienteId); // Añadimos el pacienteId al FormData

    startTransition(async () => {
      const result = await agregarEntradaHistorial(formData);
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        // Éxito, redirigir a la página de detalles del paciente
        router.push(`/dashboard/pacientes/${pacienteId}`);
        router.refresh(); 
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Campo oculto para paciente_id si la acción lo espera en FormData */}
      {/* <input type="hidden" name="paciente_id" value={pacienteId} /> */}
      {/* No es necesario si lo añadimos programáticamente al FormData como arriba */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="fecha_evento" className="mb-1.5 block">Fecha del Evento</Label>
          <Input 
            id="fecha_evento" 
            name="fecha_evento" 
            type="date" 
            defaultValue={fechaEvento} // Usar defaultValue para inputs no completamente controlados por React state si pasas FormData
                                       // o value={fechaEvento} onChange={e => setFechaEvento(e.target.value)} si es controlado
            required 
          />
          {fieldErrors?.fecha_evento && <p className="text-sm text-red-500 mt-1">{fieldErrors.fecha_evento[0]}</p>}
        </div>

        <div>
          <Label htmlFor="tipo" className="mb-1.5 block">Tipo de Registro</Label>
          <Select name="tipo" required>
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposRegistroMedicoOpciones.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors?.tipo && <p className="text-sm text-red-500 mt-1">{fieldErrors.tipo[0]}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="descripcion" className="mb-1.5 block">Descripción Detallada</Label>
        <Textarea id="descripcion" name="descripcion" rows={5} required />
        {fieldErrors?.descripcion && <p className="text-sm text-red-500 mt-1">{fieldErrors.descripcion[0]}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="diagnostico" className="mb-1.5 block">Diagnóstico (opcional)</Label>
          <Textarea id="diagnostico" name="diagnostico" rows={3} />
          {fieldErrors?.diagnostico && <p className="text-sm text-red-500 mt-1">{fieldErrors.diagnostico[0]}</p>}
        </div>
        <div>
          <Label htmlFor="tratamiento_indicado" className="mb-1.5 block">Tratamiento Indicado (opcional)</Label>
          <Textarea id="tratamiento_indicado" name="tratamiento_indicado" rows={3} />
          {fieldErrors?.tratamiento_indicado && <p className="text-sm text-red-500 mt-1">{fieldErrors.tratamiento_indicado[0]}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="notas_seguimiento" className="mb-1.5 block">Notas de Seguimiento (opcional)</Label>
        <Textarea id="notas_seguimiento" name="notas_seguimiento" rows={3} />
        {fieldErrors?.notas_seguimiento && <p className="text-sm text-red-500 mt-1">{fieldErrors.notas_seguimiento[0]}</p>}
      </div>

      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando Entrada..." : "Guardar Entrada"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}