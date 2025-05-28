// app/dashboard/inventario/[productoId]/MovimientoStockForm.tsx
"use client";

import React, { useState, useTransition } from 'react';
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
import { DialogFooter } from "@/components/ui/dialog";
import { registrarMovimientoStock } from '../actions';
import type { LoteDeProducto, TipoMovimientoInventarioValue, UnidadMedidaInventarioValue } from '../types';
import { tiposDeMovimientoInventarioOpciones } from '../types';
import { format } from 'date-fns'; // <--- IMPORTACIÓN AÑADIDA
import { es } from 'date-fns/locale'; // <--- IMPORTACIÓN AÑADIDA

interface MovimientoStockFormProps {
  productoId: string;
  lote: LoteDeProducto;
  unidadProducto: UnidadMedidaInventarioValue | null | undefined;
  nombreProducto: string;
  onFormSubmit: () => void;
  onCancel: () => void;
}

type FieldErrors = {
  tipo_movimiento?: string[];
  cantidad?: string[];
  notas?: string[];
};

export default function MovimientoStockForm({ 
    productoId, 
    lote, 
    unidadProducto,
    nombreProducto,
    onFormSubmit, 
    onCancel 
}: MovimientoStockFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimientoInventarioValue | ''>('');
  const [cantidad, setCantidad] = useState('');
  const [notas, setNotas] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);
    const formData = new FormData(event.currentTarget);
    if (tipoMovimiento && !formData.has('tipo_movimiento')) {
        formData.set('tipo_movimiento', tipoMovimiento);
    }

    startTransition(async () => {
      const result = await registrarMovimientoStock(productoId, lote.id, formData);
      
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error al registrar el movimiento.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        onFormSubmit(); 
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="text-sm mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-md border">
        <p><strong>Producto:</strong> {nombreProducto}</p>
        <p><strong>Lote Nº:</strong> {lote.numero_lote}</p>
        <p><strong>Stock Actual del Lote:</strong> {lote.stock_lote} {unidadProducto || ''}</p>
        {lote.fecha_caducidad && (
            // AHORA 'format' Y 'es' ESTÁN DEFINIDOS
            <p><strong>Caducidad del Lote:</strong> {format(new Date(lote.fecha_caducidad), 'PPP', {locale: es})}</p>
        )}
      </div>

      <div>
        <Label htmlFor="tipo_movimiento" className="mb-1.5 block">Tipo de Movimiento</Label>
        <Select 
          name="tipo_movimiento" 
          required 
          value={tipoMovimiento} 
          onValueChange={(value) => setTipoMovimiento(value as TipoMovimientoInventarioValue)}
        >
          <SelectTrigger id="tipo_movimiento">
            <SelectValue placeholder="Selecciona un tipo de movimiento" />
          </SelectTrigger>
          <SelectContent>
            {tiposDeMovimientoInventarioOpciones.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors?.tipo_movimiento && <p className="text-sm text-red-500 mt-1">{fieldErrors.tipo_movimiento[0]}</p>}
      </div>

      <div>
        <Label htmlFor="cantidad" className="mb-1.5 block">Cantidad a Mover</Label>
        <Input 
          id="cantidad" 
          name="cantidad" 
          type="number" 
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          min="1" 
          required 
          placeholder="Ej: 5 (para salida), 10 (para ajuste positivo)"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Introduce un número positivo. El tipo de movimiento determinará si suma o resta al stock.
        </p>
        {fieldErrors?.cantidad && <p className="text-sm text-red-500 mt-1">{fieldErrors.cantidad[0]}</p>}
      </div>
      
      <div>
        <Label htmlFor="notas" className="mb-1.5 block">Notas (opcional)</Label>
        <Textarea 
          id="notas" 
          name="notas" 
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          placeholder="Ej: Venta factura #123, Uso en consulta, Rotura..."
        />
        {fieldErrors?.notas && <p className="text-sm text-red-500 mt-1">{fieldErrors.notas[0]}</p>}
      </div>
      
      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Registrando..." : "Registrar Movimiento"}
        </Button>
      </DialogFooter>
    </form>
  );
}