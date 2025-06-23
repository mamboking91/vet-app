"use client";

import { useState, useTransition, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import type { Propietario } from '@/app/dashboard/propietarios/types';
import { actualizarMisDatos } from './actions';

interface EditarDatosFormProps {
  propietario: Propietario;
}

export default function EditarDatosForm({ propietario }: EditarDatosFormProps) {
  const [isPending, startTransition] = useTransition();

  // Usamos el `key` prop en el formulario para forzar el reseteo del estado
  // cuando los datos iniciales cambian, es una forma más limpia.

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await actualizarMisDatos(formData);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error("Error al actualizar", {
          description: result.error?.message,
        });
      }
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} key={propietario.id}>
        <CardHeader>
          <CardTitle>Mis Datos Personales y de Envío</CardTitle>
          <CardDescription>Aquí puedes actualizar tu información de contacto y dirección.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre Completo</Label>
            <Input id="nombre_completo" name="nombre_completo" defaultValue={propietario.nombre_completo || ''} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={propietario.email || ''} disabled readOnly />
               <p className="text-xs text-muted-foreground">El email no se puede modificar.</p>
            </div>
             <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" type="tel" defaultValue={propietario.telefono || ''} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" name="direccion" defaultValue={propietario.direccion || ''} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="localidad">Localidad</Label>
              <Input id="localidad" name="localidad" defaultValue={propietario.localidad || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia</Label>
              <Input id="provincia" name="provincia" defaultValue={propietario.provincia || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_postal">Código Postal</Label>
              <Input id="codigo_postal" name="codigo_postal" defaultValue={propietario.codigo_postal || ''} />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}