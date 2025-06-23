"use client";

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { solicitarNuevaCita } from '../actions';
import type { EntidadParaSelector } from '@/app/dashboard/pacientes/types';

interface SolicitarCitaFormProps {
  mascotas: EntidadParaSelector[];
}

export default function SolicitarCitaForm({ mascotas }: SolicitarCitaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fecha, setFecha] = useState<Date | undefined>(new Date());

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (fecha) {
        formData.set('fecha_preferida', fecha.toISOString().split('T')[0]);
    }

    startTransition(async () => {
      const result = await solicitarNuevaCita(formData);
      if (result.success) {
        toast.success("Solicitud de cita enviada", {
          description: "Nos pondremos en contacto contigo para confirmar la fecha y hora.",
        });
        router.push('/cuenta/citas');
      } else {
        toast.error("Error al enviar la solicitud", {
          description: result.error?.message,
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div>
        <Label htmlFor="paciente_id">¿Para qué mascota es la cita?</Label>
        <Select name="paciente_id" required>
          <SelectTrigger id="paciente_id"><SelectValue placeholder="Selecciona tu mascota..." /></SelectTrigger>
          <SelectContent>{mascotas.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="fecha_preferida">Fecha preferida</Label>
        <DatePicker date={fecha} onDateChange={setFecha} />
      </div>
       <div>
        <Label htmlFor="franja_horaria">Preferencia de horario</Label>
        <Select name="franja_horaria" required defaultValue="mañana">
          <SelectTrigger id="franja_horaria"><SelectValue placeholder="Selecciona una franja..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mañana">Mañana (9:00 - 14:00)</SelectItem>
            <SelectItem value="tarde">Tarde (16:00 - 20:00)</SelectItem>
          </SelectContent>
        </Select>
      </div>
       <div>
        <Label htmlFor="motivo">Motivo de la visita</Label>
        <Textarea id="motivo" name="motivo" required placeholder="Describe brevemente por qué necesitas una cita (ej: revisión anual, no come bien, cojea...)" />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? 'Enviando solicitud...' : 'Enviar Solicitud de Cita'}
      </Button>
    </form>
  );
}