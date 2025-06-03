// app/dashboard/inventario/[productoId]/lotes/[loteId]/editar/EditarLoteForm.tsx
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actualizarDatosLote } from '../../../../actions'; // Ajusta la ruta a actions.ts de inventario
// Importa el tipo para initialData desde page.tsx de esta misma carpeta
import type { LoteEditableFormData } from './page'; 

interface EditarLoteFormProps {
  initialData: LoteEditableFormData;
  loteId: string;
  productoId: string;
}

type FieldErrors = {
  numero_lote?: string[];
  fecha_entrada?: string[];
  fecha_caducidad?: string[];
  stock_lote?: string[]; 
};

export default function EditarLoteForm({ initialData, loteId, productoId }: EditarLoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  const [numeroLote, setNumeroLote] = useState(initialData.numero_lote);
  const [fechaEntrada, setFechaEntrada] = useState(initialData.fecha_entrada);
  const [fechaCaducidad, setFechaCaducidad] = useState(initialData.fecha_caducidad);
  const [stockLote, setStockLote] = useState(initialData.stock_lote); // Estado para stock_lote

  useEffect(() => {
    setNumeroLote(initialData.numero_lote || '');
    setFechaEntrada(initialData.fecha_entrada || '');
    setFechaCaducidad(initialData.fecha_caducidad || '');
    setStockLote(initialData.stock_lote || '0'); // Sincronizar stock
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);
    const formData = new FormData(event.currentTarget);
    // Asegúrate que el input de stock_lote tiene name="stock_lote"

    startTransition(async () => {
      try {
        await actualizarDatosLote(loteId, productoId, formData);
        // Si llegamos aquí sin errores, la operación fue exitosa
        router.push(`/dashboard/inventario/${productoId}`);
        router.refresh();
      } catch (error: any) {
        // Manejo de errores si la función lanza una excepción
        console.error('Error al actualizar el lote:', error);
        
        // Verificar si el error tiene la estructura esperada
        if (error && typeof error === 'object') {
          if (error.message) {
            setFormError(error.message);
          }
          if (error.errors) {
            setFieldErrors(error.errors as FieldErrors);
          }
        } else {
          setFormError("Ocurrió un error inesperado al actualizar el lote.");
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <Label htmlFor="numero_lote" className="mb-1.5 block">Número de Lote</Label>
        <Input id="numero_lote" name="numero_lote" value={numeroLote} onChange={(e) => setNumeroLote(e.target.value)} required />
        {fieldErrors?.numero_lote && <p className="text-sm text-red-500 mt-1">{fieldErrors.numero_lote[0]}</p>}
      </div>

      {/* Campo para editar el stock del lote */}
      <div>
        <Label htmlFor="stock_lote" className="mb-1.5 block">Stock Actual del Lote (Ajuste Manual)</Label>
        <Input 
          id="stock_lote" 
          name="stock_lote" // Asegúrate que el 'name' esté aquí
          type="number"
          value={stockLote}
          onChange={(e) => setStockLote(e.target.value)}
          min="0" // No puede ser negativo
          required // Hacemos que el stock actual sea un campo requerido en el form
        />
        <p className="text-xs text-muted-foreground mt-1">
          Modificar este valor registrará un movimiento de ajuste. El stock no puede ser negativo.
        </p>
        {fieldErrors?.stock_lote && <p className="text-sm text-red-500 mt-1">{fieldErrors.stock_lote[0]}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="fecha_entrada" className="mb-1.5 block">Fecha de Entrada</Label>
          <Input id="fecha_entrada" name="fecha_entrada" type="date" value={fechaEntrada} onChange={(e) => setFechaEntrada(e.target.value)} />
          {fieldErrors?.fecha_entrada && <p className="text-sm text-red-500 mt-1">{fieldErrors.fecha_entrada[0]}</p>}
        </div>
        <div>
          <Label htmlFor="fecha_caducidad" className="mb-1.5 block">Fecha de Caducidad (opcional)</Label>
          <Input id="fecha_caducidad" name="fecha_caducidad" type="date" value={fechaCaducidad} onChange={(e) => setFechaCaducidad(e.target.value)} />
          {fieldErrors?.fecha_caducidad && <p className="text-sm text-red-500 mt-1">{fieldErrors.fecha_caducidad[0]}</p>}
        </div>
      </div>

      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Actualizando Lote..." : "Guardar Cambios del Lote"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}