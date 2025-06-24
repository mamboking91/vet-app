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
import { agregarCita, actualizarCita } from "../actions"
import type { PacienteConPropietario, CitaDBRecord, TipoCitaValue } from "../types"
import { tiposDeCitaOpciones } from "../types"
import { User, PawPrint, ArrowLeft, Loader2, Save, CalendarPlus } from "lucide-react"

interface CitaFormProps {
  pacientes: PacienteConPropietario[];
  citaExistente?: CitaDBRecord;
  initialPropietarioId?: string;
  initialPacienteId?: string;
  solicitudId?: string;
}

export default function CitaForm({ pacientes, citaExistente, initialPropietarioId, initialPacienteId, solicitudId }: CitaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEditMode = Boolean(citaExistente);

  // --- LÓGICA DE ESTADO REFACTORIZADA ---

  // 1. Derivamos la lista de propietarios únicos de forma segura.
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
  
  // 2. Función para determinar el propietario inicial de forma segura
  const getInitialOwnerId = () => {
    if (initialPropietarioId) return initialPropietarioId;
    if (citaExistente) {
      const pacienteDeCita = pacientes?.find(p => p.paciente_id === citaExistente.paciente_id);
      return pacienteDeCita?.propietario_id || "";
    }
    return "";
  };

  // 3. Inicializamos los estados directamente con los valores de las props
  const [propietarioId, setPropietarioId] = useState(getInitialOwnerId);
  const [pacienteId, setPacienteId] = useState(initialPacienteId || citaExistente?.paciente_id || "");

  // 4. Derivamos la lista de mascotas filtradas. Se actualizará cada vez que propietarioId cambie.
  const pacientesFiltrados = useMemo(() => {
    if (!propietarioId || !pacientes) return [];
    return pacientes.filter(p => p.propietario_id === propietarioId);
  }, [propietarioId, pacientes]);
  
  const handlePropietarioChange = (newOwnerId: string) => {
    setPropietarioId(newOwnerId);
    setPacienteId(''); 
  };
  
  // El resto de la lógica del componente no necesita cambios
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const actionToExecute = isEditMode && citaExistente ? () => actualizarCita(citaExistente.id, formData) : () => agregarCita(formData);
      const result = await actionToExecute();
      if (result.success) {
        router.push("/dashboard/citas");
        router.refresh();
      }
      // Manejar errores...
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{isEditMode ? "Editar Cita" : "Programar Nueva Cita"}</h1>
        <p className="text-muted-foreground">
          {isEditMode ? "Actualiza los detalles de la cita existente." : "Completa el formulario para programar una nueva cita."}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {solicitudId && <input type="hidden" name="solicitud_id" value={solicitudId} />}
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Información del Paciente</CardTitle>
            <CardDescription>Selecciona primero al propietario para filtrar la lista de sus mascotas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
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
                <Select name="paciente_id" required value={pacienteId} onValueChange={setPacienteId} disabled={!propietarioId}>
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
                  <Input id="fecha_hora_inicio" name="fecha_hora_inicio" type="datetime-local" defaultValue={new Date().toISOString().substring(0, 16)} required />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo de Cita</Label>
                  <Select name="tipo" defaultValue="">
                    <SelectTrigger id="tipo"><SelectValue placeholder="Selecciona tipo..."/></SelectTrigger>
                    <SelectContent>{tiposDeCitaOpciones.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="motivo">Motivo de la Cita</Label>
                <Textarea id="motivo" name="motivo" placeholder="Motivo principal de la visita..." />
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