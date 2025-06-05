// src/app/dashboard/facturacion/[facturaId]/RegistrarPagoForm.tsx
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter, DialogClose } from "@/components/ui/dialog"; // DialogClose para el botón Cancelar
import { AlertCircle, CalendarIcon, DollarSignIcon, CreditCardIcon, InfoIcon } from 'lucide-react';
import { registrarPagoFactura } from '../actions'; // Ajusta la ruta si es necesario
import { metodosDePagoOpciones, type MetodoPagoValue, type PagoFormData } from '../types'; // Ajusta la ruta si es necesario
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface RegistrarPagoFormProps {
  facturaId: string;
  totalFactura: number;
  saldoPendienteActual: number; // Calculado en el componente padre
  onPagoRegistrado: () => void; // Callback para cerrar el modal y refrescar
  onCancel: () => void;
}

type FieldErrors = {
  [key in keyof Omit<PagoFormData, 'factura_id'>]?: string[] | undefined;
} & { general?: string };


export default function RegistrarPagoForm({
  facturaId,
  totalFactura,
  saldoPendienteActual,
  onPagoRegistrado,
  onCancel,
}: RegistrarPagoFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  const [fechaPago, setFechaPago] = useState<Date | undefined>(new Date());
  const [montoPagado, setMontoPagado] = useState(saldoPendienteActual > 0 ? saldoPendienteActual.toFixed(2) : '');
  const [metodoPago, setMetodoPago] = useState<MetodoPagoValue | string>('');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    // Actualizar el monto si el saldo pendiente cambia (ej. otro pago se registra mientras el modal está abierto)
    setMontoPagado(saldoPendienteActual > 0 ? saldoPendienteActual.toFixed(2) : '');
  }, [saldoPendienteActual]);


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
    if (montoNum > saldoPendienteActual + 0.001) { // Margen para errores de flotantes
        setFieldErrors({ monto_pagado: [`El monto no puede exceder el saldo pendiente de ${saldoPendienteActual.toFixed(2)}€.`] });
        return;
    }


    const formData = new FormData();
    formData.append("fecha_pago", format(fechaPago, "yyyy-MM-dd"));
    formData.append("monto_pagado", montoPagado);
    formData.append("metodo_pago", metodoPago as string);
    formData.append("referencia_pago", referenciaPago);
    formData.append("notas", notas);

    startTransition(async () => {
      const result = await registrarPagoFactura(facturaId, formData);
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error al registrar el pago.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        onPagoRegistrado(); // Llama al callback para cerrar y refrescar
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="mb-4 p-3 bg-blue-50 dark:bg-slate-800 rounded-md border border-blue-200 dark:border-slate-700 text-sm">
        <p>Total Factura: <span className="font-semibold">{totalFactura.toFixed(2)}€</span></p>
        <p>Saldo Pendiente: <span className="font-semibold text-blue-600 dark:text-blue-400">{saldoPendienteActual.toFixed(2)}€</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fecha_pago_form">Fecha del Pago</Label>
          <DatePicker date={fechaPago} onDateChange={setFechaPago} />
          {fieldErrors?.fecha_pago && <p className="text-xs text-red-500 mt-1">{fieldErrors.fecha_pago[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="monto_pagado_form">Monto Pagado (€)</Label>
          <Input
            id="monto_pagado_form"
            name="monto_pagado"
            type="number"
            value={montoPagado}
            onChange={(e) => setMontoPagado(e.target.value)}
            step="0.01"
            min="0.01"
            max={saldoPendienteActual.toFixed(2)}
            required
            placeholder="0.00"
          />
          {fieldErrors?.monto_pagado && <p className="text-xs text-red-500 mt-1">{fieldErrors.monto_pagado[0]}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="metodo_pago_form">Método de Pago</Label>
        <Select
          name="metodo_pago"
          required
          value={metodoPago}
          onValueChange={(value) => setMetodoPago(value as MetodoPagoValue | string)}
        >
          <SelectTrigger id="metodo_pago_form">
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
        <Label htmlFor="referencia_pago_form">Referencia del Pago (Opcional)</Label>
        <Input
          id="referencia_pago_form"
          name="referencia_pago"
          value={referenciaPago}
          onChange={(e) => setReferenciaPago(e.target.value)}
          placeholder="Ej: ID Transacción, Nº Cheque"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notas_pago_form">Notas (Opcional)</Label>
        <Textarea
          id="notas_pago_form"
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
        <Button type="submit" disabled={isPending || saldoPendienteActual <= 0}>
          {isPending ? "Registrando..." : "Registrar Pago"}
        </Button>
      </DialogFooter>
    </form>
  );
}