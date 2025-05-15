// app/dashboard/propietarios/nuevo/PropietarioForm.tsx
"use client"; // Directiva para marcarlo como Client Component

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation'; // Para redireccionar
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Si tienes notas adicionales
// Importar la Server Action (la crearemos en el siguiente paso)
import { agregarPropietario } from '../actions'; // Ajusta la ruta si es necesario

export default function PropietarioForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition(); // Para estados de carga de la acción
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setError(null); // Limpiar errores previos

    startTransition(async () => {
      const result = await agregarPropietario(formData);
      if (result.error) {
        setError(result.error.message);
        console.error("Error al añadir propietario:", result.error.message);
      } else {
        // Éxito, redirigir a la lista de propietarios
        router.push('/dashboard/propietarios');
        // Opcional: mostrar un mensaje de éxito (toast notification)
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <Label htmlFor="nombre_completo">Nombre Completo</Label>
        <Input id="nombre_completo" name="nombre_completo" type="text" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div>
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" name="telefono" type="tel" />
      </div>
      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" name="direccion" type="text" />
      </div>
      <div>
        <Label htmlFor="notas_adicionales">Notas Adicionales</Label>
        <Textarea id="notas_adicionales" name="notas_adicionales" />
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar Propietario"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}