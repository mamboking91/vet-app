// app/dashboard/propietarios/[propietarioId]/editar/EditarPropietarioForm.tsx
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// Importaremos la Server Action para actualizar (la crearemos en el siguiente paso)
import { actualizarPropietario } from '../../actions'; // Sube dos niveles para llegar a actions.ts

// Reutilizamos el tipo Propietario o lo definimos si es necesario
type Propietario = {
  id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  notas_adicionales: string | null;
};

interface EditarPropietarioFormProps {
  propietario: Propietario;
}

export default function EditarPropietarioForm({ propietario }: EditarPropietarioFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Estado para los campos del formulario, inicializados con los datos del propietario
  const [nombreCompleto, setNombreCompleto] = useState(propietario.nombre_completo);
  const [email, setEmail] = useState(propietario.email || '');
  const [telefono, setTelefono] = useState(propietario.telefono || '');
  const [direccion, setDireccion] = useState(propietario.direccion || '');
  const [notasAdicionales, setNotasAdicionales] = useState(propietario.notas_adicionales || '');

  // Sincronizar estado si el prop propietario cambia (aunque en este flujo no debería)
  useEffect(() => {
    setNombreCompleto(propietario.nombre_completo);
    setEmail(propietario.email || '');
    setTelefono(propietario.telefono || '');
    setDireccion(propietario.direccion || '');
    setNotasAdicionales(propietario.notas_adicionales || '');
  }, [propietario]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Crear un objeto FormData o pasar los datos directamente
    // Aquí pasaremos los datos directamente ya que los tenemos en el estado
    const updatedData = {
      nombre_completo: nombreCompleto,
      email: email,
      telefono: telefono,
      direccion: direccion,
      notas_adicionales: notasAdicionales,
    };

    startTransition(async () => {
      // La Server Action necesitará el ID del propietario y los nuevos datos
      const result = await actualizarPropietario(propietario.id, updatedData);
      if (result?.error) { // result puede ser undefined si la acción no devuelve nada en éxito sin error
        setError(result.error.message);
        console.error("Error al actualizar propietario:", result.error.message);
      } else {
        // Éxito
        router.push('/dashboard/propietarios'); // Volver a la lista
        router.refresh(); // Asegurar que la lista se actualice
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <Label htmlFor="nombre_completo">Nombre Completo</Label>
        <Input 
          id="nombre_completo" 
          name="nombre_completo" 
          type="text" 
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          required 
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="telefono">Teléfono</Label>
        <Input 
          id="telefono" 
          name="telefono" 
          type="tel" 
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input 
          id="direccion" 
          name="direccion" 
          type="text" 
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="notas_adicionales">Notas Adicionales</Label>
        <Textarea 
          id="notas_adicionales" 
          name="notas_adicionales" 
          value={notasAdicionales}
          onChange={(e) => setNotasAdicionales(e.target.value)}
        />
      </div>
      
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Actualizando..." : "Guardar Cambios"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
