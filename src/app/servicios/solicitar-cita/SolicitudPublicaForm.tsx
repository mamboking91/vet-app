"use client";

import { useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { crearSolicitudPublica } from './actions';

export default function SolicitudPublicaForm() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const form = event.currentTarget;

    startTransition(async () => {
      const result = await crearSolicitudPublica(formData);
      if (result.success) {
        toast.success("Solicitud enviada", { description: result.message });
        form.reset();
      } else {
        toast.error("Error al enviar", { description: result.error?.message || "Por favor, revisa los datos." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="nombre_cliente">Tu Nombre Completo</Label>
          <Input id="nombre_cliente" name="nombre_cliente" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="nombre_mascota">Nombre de tu Mascota</Label>
          <Input id="nombre_mascota" name="nombre_mascota" required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="email">Tu Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="telefono">Tu Teléfono</Label>
          <Input id="telefono" name="telefono" type="tel" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="descripcion_mascota">Describe a tu mascota (especie, raza, edad...)</Label>
        <Input id="descripcion_mascota" name="descripcion_mascota" placeholder="Ej: Perro, mestizo, 3 años" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="motivo_cita">Motivo de la Cita</Label>
        <Textarea id="motivo_cita" name="motivo_cita" required minLength={10} placeholder="Revisión, vacunas, parece enfermo..." />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? 'Enviando...' : 'Enviar Solicitud'}
      </Button>
    </form>
  );
}