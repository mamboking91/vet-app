// app/dashboard/pacientes/[pacienteId]/editar/EditarPacienteForm.tsx
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
import { actualizarPaciente } from '../../actions'; // Sube dos niveles para actions.ts
import type { PropietarioSimple } from '../../nuevo/page'; // Tipo para la lista de propietarios
import type { PacienteCompleto } from './page'; // Tipo para el paciente que se edita

interface EditarPacienteFormProps {
  paciente: PacienteCompleto;
  propietarios: PropietarioSimple[];
}

// Definimos un tipo para los errores de campo de Zod
type FieldErrors = {
    [key: string]: string[] | undefined;
};

// Puedes mantener estas listas aquí o moverlas a un archivo de constantes si las usas en varios sitios
const especiesComunes = [
  { value: "Perro", label: "Perro" },
  { value: "Gato", label: "Gato" },
  { value: "Conejo", label: "Conejo" },
  { value: "Hurón", label: "Hurón" },
  { value: "Ave", label: "Ave (Loro, Canario, etc.)" },
  { value: "Reptil", label: "Reptil (Tortuga, Iguana, etc.)" },
  { value: "Roedor", label: "Pequeño Mamífero (Hámster, Cobaya, Chinchilla)" },
  { value: "Exótico/Otro", label: "Exótico / Otro" },
];

const sexosDisponibles = [
    { value: "Macho", label: "Macho" },
    { value: "Macho Castrado", label: "Macho Castrado" },
    { value: "Hembra", label: "Hembra" },
    { value: "Hembra Esterilizada", label: "Hembra Esterilizada" },
    { value: "Desconocido", label: "Desconocido" },
];

export default function EditarPacienteForm({ paciente, propietarios }: EditarPacienteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  // Estados para los campos del formulario, inicializados con los datos del paciente
  const [nombre, setNombre] = useState(paciente.nombre);
  const [propietarioId, setPropietarioId] = useState<string>(paciente.propietario_id);
  const [especie, setEspecie] = useState(paciente.especie || '');
  const [raza, setRaza] = useState(paciente.raza || '');
  // Para el input type="date", el valor debe ser en formato YYYY-MM-DD
  // Si fecha_nacimiento viene como un timestamp completo, hay que formatearlo.
  // Asumimos que ya viene como string YYYY-MM-DD o null.
  const [fechaNacimiento, setFechaNacimiento] = useState(paciente.fecha_nacimiento || '');
  const [sexo, setSexo] = useState(paciente.sexo || '');
  const [microchipId, setMicrochipId] = useState(paciente.microchip_id || '');
  const [color, setColor] = useState(paciente.color || '');
  const [notas, setNotas] = useState(paciente.notas_adicionales || '');

  // Sincronizar el estado si el prop `paciente` cambia (útil si la página se recarga con nuevos datos)
  useEffect(() => {
    setNombre(paciente.nombre);
    setPropietarioId(paciente.propietario_id);
    setEspecie(paciente.especie || '');
    setRaza(paciente.raza || '');
    setFechaNacimiento(paciente.fecha_nacimiento || '');
    setSexo(paciente.sexo || '');
    setMicrochipId(paciente.microchip_id || '');
    setColor(paciente.color || '');
    setNotas(paciente.notas_adicionales || '');
  }, [paciente]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    const formData = new FormData(event.currentTarget);
    // Los componentes controlados ya tienen los valores en el estado,
    // pero la Server Action está configurada para recibir FormData.
    // Asegúrate de que los 'name' en los inputs/selects coincidan con lo que espera la Server Action.
    // O, puedes construir el objeto de datos a partir del estado y pasarlo.
    // Por consistencia con la acción que espera FormData:
    // (Si la acción se modifica para tomar un objeto, esto puede cambiar)

    startTransition(async () => {
      // El ID del paciente se pasa como un argumento separado a la acción
      const result = await actualizarPaciente(paciente.id, formData);
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error al actualizar.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        // Éxito
        router.push('/dashboard/pacientes'); // Volver a la lista
        router.refresh(); // Asegurar que la lista y otros datos se actualicen
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Nombre del Paciente y Propietario en la misma fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="nombre" className="mb-1.5 block">Nombre del Paciente</Label>
          <Input id="nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          {fieldErrors?.nombre && <p className="text-sm text-red-500 mt-1">{fieldErrors.nombre[0]}</p>}
        </div>
        <div>
          <Label htmlFor="propietario_id" className="mb-1.5 block">Propietario</Label>
          <Select name="propietario_id" required value={propietarioId} onValueChange={setPropietarioId}>
            <SelectTrigger id="propietario_id">
              <SelectValue placeholder="Selecciona un propietario" />
            </SelectTrigger>
            <SelectContent>
              {propietarios.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors?.propietario_id && <p className="text-sm text-red-500 mt-1">{fieldErrors.propietario_id[0]}</p>}
        </div>
      </div>

      {/* Especie y Raza */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="especie" className="mb-1.5 block">Especie</Label>
          <Select name="especie" required value={especie} onValueChange={setEspecie}>
            <SelectTrigger id="especie">
              <SelectValue placeholder="Selecciona una especie" />
            </SelectTrigger>
            <SelectContent>
              {especiesComunes.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors?.especie && <p className="text-sm text-red-500 mt-1">{fieldErrors.especie[0]}</p>}
        </div>
        <div>
          <Label htmlFor="raza" className="mb-1.5 block">Raza</Label>
          <Input id="raza" name="raza" value={raza} onChange={(e) => setRaza(e.target.value)} />
          {fieldErrors?.raza && <p className="text-sm text-red-500 mt-1">{fieldErrors.raza[0]}</p>}
        </div>
      </div>

      {/* Fecha de Nacimiento y Sexo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="fecha_nacimiento" className="mb-1.5 block">Fecha de Nacimiento</Label>
          <Input id="fecha_nacimiento" name="fecha_nacimiento" type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
          {fieldErrors?.fecha_nacimiento && <p className="text-sm text-red-500 mt-1">{fieldErrors.fecha_nacimiento[0]}</p>}
        </div>
        <div>
          <Label htmlFor="sexo" className="mb-1.5 block">Sexo</Label>
          <Select name="sexo" value={sexo} onValueChange={setSexo}>
            <SelectTrigger id="sexo">
              <SelectValue placeholder="Selecciona el sexo" />
            </SelectTrigger>
            <SelectContent>
              {sexosDisponibles.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors?.sexo && <p className="text-sm text-red-500 mt-1">{fieldErrors.sexo[0]}</p>}
        </div>
      </div>

      {/* Microchip ID y Color */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="microchip_id" className="mb-1.5 block">Nº de Microchip</Label>
          <Input id="microchip_id" name="microchip_id" value={microchipId} onChange={(e) => setMicrochipId(e.target.value)} />
          {fieldErrors?.microchip_id && <p className="text-sm text-red-500 mt-1">{fieldErrors.microchip_id[0]}</p>}
        </div>
        <div>
          <Label htmlFor="color" className="mb-1.5 block">Color</Label>
          <Input id="color" name="color" value={color} onChange={(e) => setColor(e.target.value)} />
          {fieldErrors?.color && <p className="text-sm text-red-500 mt-1">{fieldErrors.color[0]}</p>}
        </div>
      </div>

      {/* Notas Adicionales */}
      <div>
        <Label htmlFor="notas_adicionales" className="mb-1.5 block">Notas Adicionales</Label>
        <Textarea id="notas_adicionales" name="notas_adicionales" value={notas} onChange={(e) => setNotas(e.target.value)} />
        {fieldErrors?.notas_adicionales && <p className="text-sm text-red-500 mt-1">{fieldErrors.notas_adicionales[0]}</p>}
      </div>

      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Actualizando Paciente..." : "Guardar Cambios"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}