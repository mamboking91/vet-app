// src/app/dashboard/facturacion/[facturaId]/EditarPagoForm.tsx
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertCircle } from 'lucide-react';
import { actualizarPagoFactura } from '../actions';
import { metodosDePagoOpciones, type MetodoPagoValue, type PagoFacturaFromDB, type PagoFormData } from '../types';
import { format, parseISO, isValid } from 'date-fns';

interface EditarPagoFormProps {
  pagoAEditar: PagoFacturaFromDB; // Datos del pago que se está editando
  facturaId: string; // ID de la factura a la que pertenece el pago
  totalFactura: number; // Total de la factura para validaciones de monto
  onPagoActualizado: () => void; // Callback para cerrar el modal y refrescar
  onCancel: () => void;
}

// Usaremos PagoFormData para los campos del formulario, adaptando si es necesario
type FieldErrors = {
  [key in keyof PagoFormData]?: string[] | undefined;
} & { general?: string };

export default function EditarPagoForm({
  pagoAEditar,
  facturaId,
  totalFactura,
  onPagoActualizado,
  onCancel,
}: EditarPagoFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  // Inicializar el estado del formulario con los datos del pagoAEditar
  const [fechaPago, setFechaPago] = useState<Date | undefined>(
    pagoAEditar.fecha_pago && isValid(parseISO(pagoAEditar.fecha_pago))
      ? parseISO(pagoAEditar.fecha_pago)
      : new Date()
  );
  const [montoPagado, setMontoPagado] = useState(pagoAEditar.monto_pagado.toString());
  const [metodoPago, setMetodoPago] = useState<MetodoPagoValue | string>(pagoAEditar.metodo_pago || '');
  const [referenciaPago, setReferenciaPago] = useState(pagoAEditar.referencia_pago || '');
  const [notas, setNotas] = useState(pagoAEditar.notas || '');

  // Efecto para resetear el estado si el pagoAEditar cambia (aunque en un modal no suele cambiar)
  useEffect(() => {
    setFechaPago(
      pagoAEditar.fecha_pago && isValid(parseISO(pagoAEditar.fecha_pago))
        ? parseISO(pagoAEditar.fecha_pago)
        : new Date()
    );
    setMontoPagado(pagoAEditar.monto_pagado.toString());
    setMetodoPago(pagoAEditar.metodo_pago || '');
    setReferenciaPago(pagoAEditar.referencia_pago || '');
    setNotas(pagoAEditar.notas || '');
    setFormError(null);
    setFieldErrors(null);
  }, [pagoAEditar]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    if (!fechaPago) {
        setFieldErrors({ fecha_pago: ["La fecha de pago es requerida."] });
        return;
    }
    if (!metodoPago) {
        setFieldErrors({ metodo_pago: ["Debe seleccionar un método de pago."] });
        return;
    }
    const montoNum = parseFloat(montoPagado);
    if (isNaN(montoNum) || montoNum <= 0) {
        setFieldErrors({ monto_pagado: ["El monto debe ser un número positivo."] });
        return;
    }
    // La validación de no exceder el total de la factura (considerando otros pagos)
    // se hará más robustamente en la Server Action, ya que necesita consultar otros pagos.
    // Aquí solo validamos que no sea mayor que el total de la factura como una primera barrera.
    if (montoNum > totalFactura + 0.001) {
        setFieldErrors({ monto_pagado: [`El monto no puede exceder el total de la factura (${totalFactura.toFixed(2)}€).`] });
        return;
    }

    const formData = new FormData();
    formData.append("fecha_pago", format(fechaPago, "yyyy-MM-dd"));
    formData.append("monto_pagado", montoPagado);
    formData.append("metodo_pago", metodoPago as string);
    formData.append("referencia_pago", referenciaPago);
    formData.append("notas", notas);

    startTransition(async () => {
      // Llamar a la acción actualizarPagoFactura
      const result = await actualizarPagoFactura(pagoAEditar.id, facturaId, formData);
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error al actualizar el pago.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        onPagoActualizado(); // Llama al callback para cerrar y refrescar
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
       <div className="mb-4 p-3 bg-amber-50 dark:bg-slate-800 rounded-md border border-amber-200 dark:border-slate-700 text-sm">
        <p>Editando pago para Factura ID: <span className="font-semibold">{facturaId.substring(0,8)}...</span></p>
        <p>Total Factura: <span className="font-semibold">{totalFactura.toFixed(2)}€</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fecha_pago_edit_form">Fecha del Pago</Label>
          <DatePicker date={fechaPago} onDateChange={setFechaPago} />
          {fieldErrors?.fecha_pago && <p className="text-xs text-red-500 mt-1">{fieldErrors.fecha_pago[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="monto_pagado_edit_form">Monto Pagado (€)</Label>
          <Input
            id="monto_pagado_edit_form"
            name="monto_pagado"
            type="number"
            value={montoPagado}
            onChange={(e) => setMontoPagado(e.target.value)}
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
          />
          {fieldErrors?.monto_pagado && <p className="text-xs text-red-500 mt-1">{fieldErrors.monto_pagado[0]}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="metodo_pago_edit_form">Método de Pago</Label>
        <Select
          name="metodo_pago"
          required
          value={metodoPago}
          onValueChange={(value) => setMetodoPago(value as MetodoPagoValue | string)}
        >
          <SelectTrigger id="metodo_pago_edit_form">
            <SelectValue placeholder="Selecciona método" />
          </SelectTrigger>
          <SelectContent>
            {metodosDePagoOpciones.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors?.metodo_pago && <p className="text-xs text-red-500 mt-1">{fieldErrors.metodo_pago[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="referencia_pago_edit_form">Referencia del Pago (Opcional)</Label>
        <Input
          id="referencia_pago_edit_form"
          name="referencia_pago"
          value={referenciaPago}
          onChange={(e) => setReferenciaPago(e.target.value)}
          placeholder="Ej: ID Transacción, Nº Cheque"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notas_pago_edit_form">Notas (Opcional)</Label>
        <Textarea
          id="notas_pago_edit_form"
          name="notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          placeholder="Notas internas sobre el pago..."
        />
      </div>

      {formError && (
        <div className="p-3 bg-red-100 text-red-700 border border-red-200 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {formError}
        </div>
      )}

      <DialogFooter className="pt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Actualizando Pago..." : "Guardar Cambios del Pago"}
        </Button>
      </DialogFooter>
    </form>
  );
}