// app/dashboard/procedimientos/nuevo/ProcedimientoForm.tsx
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
import { agregarProcedimiento, actualizarProcedimiento } from '../actions'; 

type ProcedimientoFormData = {
  nombre: string;
  descripcion: string;
  duracion_estimada_minutos: string;
  precio: string;
  categoria: string;
  notas_internas: string;
};

interface ProcedimientoFormProps {
  initialData?: Partial<ProcedimientoFormData>;
  procedimientoId?: string;
}

type FieldErrors = {
    [key: string]: string[] | undefined;
};

const categoriasProcedimientoOpciones = [
  { value: "Consulta", label: "Consulta" },
  { value: "Cirugía", label: "Cirugía" },
  { value: "Vacunación", label: "Vacunación" },
  { value: "Desparasitación", label: "Desparasitación" },
  { value: "Diagnóstico por Imagen", label: "Diagnóstico por Imagen" },
  { value: "Laboratorio", label: "Laboratorio" },
  { value: "Peluquería", label: "Peluquería" },
  { value: "Dental", label: "Dental" },
  { value: "Otro", label: "Otro" },
];

export default function ProcedimientoForm({ initialData, procedimientoId }: ProcedimientoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  const isEditMode = Boolean(procedimientoId && initialData);

  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
  const [duracion, setDuracion] = useState(initialData?.duracion_estimada_minutos || '');
  const [precio, setPrecio] = useState(initialData?.precio || '');
  const [categoria, setCategoria] = useState(initialData?.categoria || '');
  const [notasInternas, setNotasInternas] = useState(initialData?.notas_internas || '');

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '');
      setDescripcion(initialData.descripcion || '');
      setDuracion(initialData.duracion_estimada_minutos || '');
      setPrecio(initialData.precio || '');
      setCategoria(initialData.categoria || '');
      setNotasInternas(initialData.notas_internas || '');
    }
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      let result;
      if (isEditMode && procedimientoId) {
        result = await actualizarProcedimiento(procedimientoId, formData);
      } else {
        result = await agregarProcedimiento(formData); 
      }
      
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        router.push('/dashboard/procedimientos');
        router.refresh(); 
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <Label htmlFor="nombre" className="mb-1.5 block">Nombre del Procedimiento</Label>
        <Input id="nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        {fieldErrors?.nombre && <p className="text-sm text-red-500 mt-1">{fieldErrors.nombre[0]}</p>}
      </div>
      <div>
        <Label htmlFor="descripcion" className="mb-1.5 block">Descripción (opcional)</Label>
        <Textarea id="descripcion" name="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
        {fieldErrors?.descripcion && <p className="text-sm text-red-500 mt-1">{fieldErrors.descripcion[0]}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="duracion_estimada_minutos" className="mb-1.5 block">Duración Estimada (minutos, opcional)</Label>
          <Input id="duracion_estimada_minutos" name="duracion_estimada_minutos" type="number" value={duracion} onChange={(e) => setDuracion(e.target.value)} min="0"/>
          {fieldErrors?.duracion_estimada_minutos && <p className="text-sm text-red-500 mt-1">{fieldErrors.duracion_estimada_minutos[0]}</p>}
        </div>
        <div>
          <Label htmlFor="precio" className="mb-1.5 block">Precio (€)</Label>
          <Input id="precio" name="precio" type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} required step="0.01" min="0"/>
          {fieldErrors?.precio && <p className="text-sm text-red-500 mt-1">{fieldErrors.precio[0]}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="categoria" className="mb-1.5 block">Categoría (opcional)</Label>
        <Select name="categoria" value={categoria} onValueChange={setCategoria}>
          <SelectTrigger id="categoria"><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
          <SelectContent>
            {categoriasProcedimientoOpciones.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
          </SelectContent>
        </Select>
        {fieldErrors?.categoria && <p className="text-sm text-red-500 mt-1">{fieldErrors.categoria[0]}</p>}
      </div>
      <div>
        <Label htmlFor="notas_internas" className="mb-1.5 block">Notas Internas (opcional)</Label>
        <Textarea id="notas_internas" name="notas_internas" value={notasInternas} onChange={(e) => setNotasInternas(e.target.value)} rows={3} />
        {fieldErrors?.notas_internas && <p className="text-sm text-red-500 mt-1">{fieldErrors.notas_internas[0]}</p>}
      </div>
      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? (isEditMode ? "Actualizando..." : "Guardando...") : (isEditMode ? "Guardar Cambios" : "Guardar Procedimiento")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}