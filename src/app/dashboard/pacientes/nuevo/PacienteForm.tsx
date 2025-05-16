// app/dashboard/pacientes/nuevo/PacienteForm.tsx
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
import { agregarPaciente } from '../actions';
import type { PropietarioSimple } from './page';

interface PacienteFormProps {
  propietarios: PropietarioSimple[];
}

type FieldErrors = {
    [key: string]: string[] | undefined;
};

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

export default function PacienteForm({ propietarios }: PacienteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('');
  const [raza, setRaza] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState('');
  const [microchipId, setMicrochipId] = useState('');
  const [color, setColor] = useState('');
  const [notas, setNotas] = useState('');
  const [propietarioId, setPropietarioId] = useState<string | undefined>(undefined);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    const formData = new FormData(event.currentTarget);
    // No es necesario reconstruir formData si los inputs tienen el atributo 'name'
    // y la Server Action los lee con formData.get().
    // Solo asegúrate de que los nombres de los inputs coincidan con los esperados por la Server Action.

    startTransition(async () => {
      const result = await agregarPaciente(formData); // formData se construye a partir de los 'name' de los inputs
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        router.push('/dashboard/pacientes');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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

      <div>
        <Label htmlFor="notas_adicionales" className="mb-1.5 block">Notas Adicionales</Label>
        <Textarea id="notas_adicionales" name="notas_adicionales" value={notas} onChange={(e) => setNotas(e.target.value)} />
        {fieldErrors?.notas_adicionales && <p className="text-sm text-red-500 mt-1">{fieldErrors.notas_adicionales[0]}</p>}
      </div>
      
      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando Paciente..." : "Guardar Paciente"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}