// src/app/dashboard/citas/nueva/CitaForm.tsx
"use client"

import type React from "react"
import { useState, useTransition, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { agregarCita, actualizarCita } from "../actions"
import type { PacienteConPropietario, CitaDBRecord, TipoCitaValue, EstadoCitaValue } from "../types"
import { tiposDeCitaOpciones, estadosDeCitaOpciones } from "../types"
import { User, PawPrint, ArrowLeft, Loader2, Save, CalendarPlus } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"

interface CitaFormProps {
  pacientes: PacienteConPropietario[];
  citaExistente?: CitaDBRecord;
  initialPropietarioId?: string;
  initialPacienteId?: string;
  solicitudId?: string;
}

const formatDateTimeForInput = (isoString: string): string => {
    if (!isoString || !isValid(parseISO(isoString))) {
        // Devuelve el momento actual formateado si la fecha de entrada no es válida
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    const date = new Date(isoString);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
};


export default function CitaForm({ pacientes, citaExistente, initialPropietarioId, initialPacienteId, solicitudId }: CitaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditMode = Boolean(citaExistente);

  const propietariosUnicos = useMemo(() => {
    if (!pacientes) return [];
    const ownersMap = new Map<string, string>();
    pacientes.forEach(p => {
      if (p.propietario_id && !ownersMap.has(p.propietario_id)) {
        ownersMap.set(p.propietario_id, p.propietario_nombre);
      }
    });
    return Array.from(ownersMap, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [pacientes]);
  
  const getInitialOwnerId = () => {
    if (initialPropietarioId) return initialPropietarioId;
    if (citaExistente) {
      const pacienteDeCita = pacientes?.find(p => p.paciente_id === citaExistente.paciente_id);
      return pacienteDeCita?.propietario_id || "";
    }
    return "";
  };

  const [propietarioId, setPropietarioId] = useState(getInitialOwnerId);
  const [pacienteId, setPacienteId] = useState(initialPacienteId || citaExistente?.paciente_id || "");
  const [fechaHoraInicio, setFechaHoraInicio] = useState(citaExistente ? formatDateTimeForInput(citaExistente.fecha_hora_inicio) : new Date().toISOString().substring(0, 16));
  const [duracion, setDuracion] = useState(citaExistente?.duracion_estimada_minutos?.toString() || "");
  const [tipo, setTipo] = useState<TipoCitaValue | undefined>(citaExistente?.tipo || undefined);
  const [motivo, setMotivo] = useState(citaExistente?.motivo || "");
  const [estado, setEstado] = useState<EstadoCitaValue | undefined>(citaExistente?.estado || undefined);
  const [notas, setNotas] = useState(citaExistente?.notas_cita || "");
  
  const pacientesFiltrados = useMemo(() => {
    if (!propietarioId || !pacientes) return [];
    return pacientes.filter(p => p.propietario_id === propietarioId);
  }, [propietarioId, pacientes]);
  
  const handlePropietarioChange = (newOwnerId: string) => {
    setPropietarioId(newOwnerId);
    setPacienteId(''); 
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const actionToExecute = isEditMode && citaExistente ? () => actualizarCita(citaExistente.id, formData) : () => agregarCita(formData);
      const result = await actionToExecute();
      if (result.success) {
        toast.success(isEditMode ? "Cita actualizada correctamente." : "Cita creada correctamente.");
        router.push("/dashboard/citas");
        router.refresh();
      } else {
        toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} la cita`, { description: result.error?.message });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {solicitudId && <input type="hidden" name="solicitud_id" value={solicitudId} />}
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Información del Paciente</CardTitle>
            <CardDescription>Selecciona primero al propietario para filtrar la lista de sus mascotas.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propietario_id">Propietario *</Label>
                <Select name="propietario_id" required value={propietarioId} onValueChange={handlePropietarioChange}>
                  <SelectTrigger id="propietario_id"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>{propietariosUnicos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paciente_id">Paciente *</Label>
                <Select name="paciente_id" required value={pacienteId} onValueChange={setPacienteId} disabled={!propietarioId || pacientesFiltrados.length === 0}>
                  <SelectTrigger id="paciente_id"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>{pacientesFiltrados.map((p) => <SelectItem key={p.paciente_id} value={p.paciente_id}>{p.paciente_nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
            <CardHeader><CardTitle>Detalles de la Cita</CardTitle></CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label htmlFor="fecha_hora_inicio">Fecha y Hora de Inicio *</Label>
                  <Input id="fecha_hora_inicio" name="fecha_hora_inicio" type="datetime-local" value={fechaHoraInicio} onChange={e => setFechaHoraInicio(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="duracion_estimada_minutos">Duración (minutos)</Label>
                  <Input id="duracion_estimada_minutos" name="duracion_estimada_minutos" type="number" min="0" value={duracion} onChange={e => setDuracion(e.target.value)} placeholder="Ej: 30" />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo de Cita</Label>
                  <Select name="tipo" value={tipo} onValueChange={value => setTipo(value as TipoCitaValue)}>
                    <SelectTrigger id="tipo"><SelectValue placeholder="Selecciona tipo..."/></SelectTrigger>
                    <SelectContent>{tiposDeCitaOpciones.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {isEditMode && (
                    <div>
                        <Label htmlFor="estado">Estado de la Cita</Label>
                        <Select name="estado" value={estado} onValueChange={value => setEstado(value as EstadoCitaValue)}>
                            <SelectTrigger id="estado"><SelectValue placeholder="Selecciona estado..."/></SelectTrigger>
                            <SelectContent>{estadosDeCitaOpciones.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                )}
              </div>
              <div className="mt-4">
                <Label htmlFor="motivo">Motivo de la Cita</Label>
                <Textarea id="motivo" name="motivo" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Motivo principal de la visita..." />
              </div>
               <div className="mt-4">
                <Label htmlFor="notas_cita">Notas Internas de la Cita</Label>
                <Textarea id="notas_cita" name="notas_cita" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas internas, preparativos, etc." />
              </div>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4"/>Cancelar</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? <><Save className="mr-2 h-4 w-4"/>Guardar Cambios</> : <><CalendarPlus className="mr-2 h-4 w-4"/>Programar Cita</>}
          </Button>
        </div>
      </form>
    </div>
  );
}