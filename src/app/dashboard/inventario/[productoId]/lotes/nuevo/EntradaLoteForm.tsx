// app/dashboard/inventario/[productoId]/lotes/nuevo/EntradaLoteForm.tsx
"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registrarEntradaLote } from '../../../actions'; // Ajusta la ruta a tu archivo actions.ts de inventario
import { format } from 'date-fns'; // Para formatear la fecha por defecto

interface EntradaLoteFormProps {
  productoId: string;
}

// Tipo para los errores de campo específicos devueltos por Zod
type FieldErrors = {
  numero_lote?: string[];
  stock_lote?: string[];
  fecha_entrada?: string[];
  fecha_caducidad?: string[];
  // producto_id no vendrá del formulario, se pasa como argumento
};

export default function EntradaLoteForm({ productoId }: EntradaLoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const getTodayDateString = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  // Estados para los campos del formulario
  const [numeroLote, setNumeroLote] = useState('');
  const [stockLote, setStockLote] = useState(''); // Cantidad que entra
  const [fechaEntrada, setFechaEntrada] = useState(getTodayDateString());
  const [fechaCaducidad, setFechaCaducidad] = useState('');


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    const formData = new FormData(event.currentTarget);
    // productoId se pasa como argumento a la Server Action, no necesita estar en FormData aquí.

    startTransition(async () => {
      try {
        await registrarEntradaLote(productoId, formData);
        // Si llegamos aquí sin errores, la operación fue exitosa
        router.push(`/dashboard/inventario/${productoId}`);
        router.refresh(); 
        // Aquí podrías mostrar un "toast" de éxito
      } catch (error: any) {
        // Manejo de errores si la función lanza una excepción
        console.error('Error al registrar el lote:', error);
        
        // Verificar si el error tiene la estructura esperada
        if (error && typeof error === 'object') {
          if (error.message) {
            setFormError(error.message);
          }
          if (error.errors) {
            setFieldErrors(error.errors as FieldErrors);
          }
        } else {
          setFormError("Ocurrió un error inesperado al registrar el lote.");
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <Label htmlFor="numero_lote" className="mb-1.5 block">Número de Lote</Label>
        <Input 
          id="numero_lote" 
          name="numero_lote" 
          value={numeroLote}
          onChange={(e) => setNumeroLote(e.target.value)}
          required 
        />
        {fieldErrors?.numero_lote && <p className="text-sm text-red-500 mt-1">{fieldErrors.numero_lote[0]}</p>}
      </div>

      <div>
        <Label htmlFor="stock_lote" className="mb-1.5 block">Cantidad Entrante (Stock del Lote)</Label>
        <Input 
          id="stock_lote" 
          name="stock_lote" 
          type="number" 
          value={stockLote}
          onChange={(e) => setStockLote(e.target.value)}
          min="1" // Asumimos que la entrada debe ser al menos 1
          required 
        />
        {fieldErrors?.stock_lote && <p className="text-sm text-red-500 mt-1">{fieldErrors.stock_lote[0]}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="fecha_entrada" className="mb-1.5 block">Fecha de Entrada</Label>
          <Input 
            id="fecha_entrada" 
            name="fecha_entrada" 
            type="date" 
            value={fechaEntrada}
            onChange={(e) => setFechaEntrada(e.target.value)}
            required 
          />
          {fieldErrors?.fecha_entrada && <p className="text-sm text-red-500 mt-1">{fieldErrors.fecha_entrada[0]}</p>}
        </div>
        <div>
          <Label htmlFor="fecha_caducidad" className="mb-1.5 block">Fecha de Caducidad (opcional)</Label>
          <Input 
            id="fecha_caducidad" 
            name="fecha_caducidad" 
            type="date" 
            value={fechaCaducidad}
            onChange={(e) => setFechaCaducidad(e.target.value)}
          />
          {fieldErrors?.fecha_caducidad && <p className="text-sm text-red-500 mt-1">{fieldErrors.fecha_caducidad[0]}</p>}
        </div>
      </div>

      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Registrando Lote..." : "Registrar Entrada de Lote"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}