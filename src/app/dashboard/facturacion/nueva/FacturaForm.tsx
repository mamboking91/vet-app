// app/dashboard/facturacion/nueva/FacturaForm.tsx
"use client";

import React, { useState, useTransition, useEffect, useCallback } from 'react';
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
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XIcon, PlusCircleIcon } from 'lucide-react';
import { crearFacturaConItems /*, actualizarFactura */ } from '../actions'; 
import type { 
  EntidadParaSelector, 
  FacturaItemFormData, 
  FacturaHeaderFormData, // Este tipo necesitará ajustarse si eliminamos porcentaje_impuesto_predeterminado
  EstadoFacturaPagoValue,
  ImpuestoItemValue,
  NuevaFacturaPayload,
  ItemParaPayload
} from '../types';
import { estadosFacturaPagoOpciones, impuestoItemOpciones } from '../types'; 
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number | null | undefined): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0,00 €';
  }
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

interface FacturaFormProps {
  propietarios: EntidadParaSelector[];
  pacientes: (EntidadParaSelector & { propietario_id: string, especie?: string | null })[];
  // Ya no pasamos porcentaje_impuesto_predeterminado como prop si se elimina del header
  initialData?: Partial<Omit<FacturaHeaderFormData, 'porcentaje_impuesto_predeterminado'> & { items: FacturaItemFormData[] }>;
  facturaId?: string;
}

type FieldErrors = {
  [key in keyof Omit<FacturaHeaderFormData, 'porcentaje_impuesto_predeterminado'>]?: string[] | undefined;
} & {
  items?: ({ [key in keyof Omit<FacturaItemFormData, 'id_temporal'>]?: string[] | undefined; } | string)[];
  general?: string;
};

const DEFAULT_ITEM_TAX_RATE: ImpuestoItemValue = "7"; // IGIC General Canario 7% por defecto para nuevos ítems

export default function FacturaForm({ 
  propietarios, 
  pacientes: todosLosPacientes, 
  initialData, 
  facturaId 
}: FacturaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  const isEditMode = Boolean(facturaId && initialData);

  const [numeroFactura, setNumeroFactura] = useState(initialData?.numero_factura || '');
  const [propietarioId, setPropietarioId] = useState(initialData?.propietario_id || '');
  const [pacienteId, setPacienteId] = useState(initialData?.paciente_id || '');
  const [fechaEmision, setFechaEmision] = useState<Date | undefined>(() => 
    initialData?.fecha_emision && isValidDate(parseISO(initialData.fecha_emision)) 
      ? parseISO(initialData.fecha_emision) 
      : new Date()
  );
  const [fechaVencimiento, setFechaVencimiento] = useState<Date | undefined>(() =>
    initialData?.fecha_vencimiento && isValidDate(parseISO(initialData.fecha_vencimiento))
      ? parseISO(initialData.fecha_vencimiento)
      : undefined
  );
  const [estadoFactura, setEstadoFactura] = useState<EstadoFacturaPagoValue>(initialData?.estado || 'Borrador');
  // Eliminamos porcentajeImpuestoPredeterminado del estado de la cabecera
  const [notasCliente, setNotasCliente] = useState(initialData?.notas_cliente || '');
  const [notasInternas, setNotasInternas] = useState(initialData?.notas_internas || '');

  const [items, setItems] = useState<FacturaItemFormData[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items 
      : [{ 
          id_temporal: crypto.randomUUID(), 
          descripcion: '', 
          cantidad: '1', 
          precio_unitario: '0', 
          porcentaje_impuesto_item: DEFAULT_ITEM_TAX_RATE
        }]
  );

  const [pacientesFiltrados, setPacientesFiltrados] = useState<(EntidadParaSelector & { propietario_id: string, especie?: string | null })[]>([]);

  useEffect(() => {
    if (propietarioId) {
      const filtered = todosLosPacientes.filter(p => p.propietario_id === propietarioId);
      setPacientesFiltrados(filtered);
      if (!isEditMode || (initialData && propietarioId !== initialData.propietario_id)) {
         if (!filtered.find(p => p.id === pacienteId)) {
             setPacienteId('');
         }
      }
    } else {
      setPacientesFiltrados([]);
       if (!isEditMode) {
         setPacienteId('');
       }
    }
  }, [propietarioId, todosLosPacientes, isEditMode, initialData, pacienteId]);
  
  useEffect(() => {
    if (isEditMode && initialData) {
      setNumeroFactura(initialData.numero_factura || '');
      setPropietarioId(initialData.propietario_id || '');
      setPacienteId(initialData.paciente_id || '');
      setFechaEmision(initialData.fecha_emision && isValidDate(parseISO(initialData.fecha_emision)) ? parseISO(initialData.fecha_emision) : new Date());
      setFechaVencimiento(initialData.fecha_vencimiento && isValidDate(parseISO(initialData.fecha_vencimiento)) ? parseISO(initialData.fecha_vencimiento) : undefined);
      setEstadoFactura(initialData.estado || 'Borrador');
      // Ya no inicializamos porcentajeImpuestoPredeterminado aquí
      setNotasCliente(initialData.notas_cliente || '');
      setNotasInternas(initialData.notas_internas || '');
      setItems(
        initialData.items && initialData.items.length > 0
        ? initialData.items.map(item => ({
            ...item, 
            id_temporal: item.id_temporal || crypto.randomUUID(),
            porcentaje_impuesto_item: item.porcentaje_impuesto_item || DEFAULT_ITEM_TAX_RATE 
          }))
        : [{ 
            id_temporal: crypto.randomUUID(), 
            descripcion: '', 
            cantidad: '1', 
            precio_unitario: '0', 
            porcentaje_impuesto_item: DEFAULT_ITEM_TAX_RATE
          }]
      );
    }
  }, [initialData, isEditMode]);

  const handleItemChange = (index: number, field: keyof Omit<FacturaItemFormData, 'id_temporal'>, value: string) => {
    const newItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { 
      id_temporal: crypto.randomUUID(), 
      descripcion: '', 
      cantidad: '1', 
      precio_unitario: '0',
      porcentaje_impuesto_item: DEFAULT_ITEM_TAX_RATE // Usar el default para nuevos ítems
    }]);
  };

  const removeItem = (id_temporal: string) => {
    setItems(items.filter(item => item.id_temporal !== id_temporal));
  };

  const itemsCalculados = items.map(item => {
    const cantidad = parseFloat(item.cantidad) || 0;
    const precioUnitario = parseFloat(item.precio_unitario) || 0;
    const porcentajeImpuestoItem = parseFloat(item.porcentaje_impuesto_item) || 0;

    const baseImponibleItem = cantidad * precioUnitario;
    const montoImpuestoItem = baseImponibleItem * (porcentajeImpuestoItem / 100);
    const totalItem = baseImponibleItem + montoImpuestoItem;
    return { ...item, baseImponibleItem, porcentajeImpuestoItem, montoImpuestoItem, totalItem };
  });

  const subtotalGeneralFactura = itemsCalculados.reduce((sum, item) => sum + item.baseImponibleItem, 0);
  const montoTotalImpuestos = itemsCalculados.reduce((sum, item) => sum + item.montoImpuestoItem, 0);
  const totalFactura = subtotalGeneralFactura + montoTotalImpuestos;

  // Calcular desglose de impuestos para el resumen
  const desgloseImpuestosUI: { [rate: string]: { base: number; impuesto: number } } = {};
  itemsCalculados.forEach(item => {
    const tasaKey = `${item.porcentajeImpuestoItem}%`; // Usamos el % del ítem
    if (!desgloseImpuestosUI[tasaKey]) {
      desgloseImpuestosUI[tasaKey] = { base: 0, impuesto: 0 };
    }
    desgloseImpuestosUI[tasaKey].base += item.baseImponibleItem;
    desgloseImpuestosUI[tasaKey].impuesto += item.montoImpuestoItem;
  });
  // Filtrar tasas con base 0 para no mostrarlas si no aplican
  const tasasRelevantes = Object.keys(desgloseImpuestosUI).filter(tasa => desgloseImpuestosUI[tasa].base > 0 || desgloseImpuestosUI[tasa].impuesto > 0);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    const payloadItems: ItemParaPayload[] = items.map(item => ({
        descripcion: item.descripcion,
        cantidad: item.cantidad, 
        precio_unitario: item.precio_unitario,
        porcentaje_impuesto_item: item.porcentaje_impuesto_item,
    }));

    const payload: Omit<NuevaFacturaPayload, 'porcentaje_impuesto_header_info'> = { // Ajustado
      numero_factura: numeroFactura,
      propietario_id: propietarioId,
      paciente_id: pacienteId || undefined,
      fecha_emision: fechaEmision ? format(fechaEmision, 'yyyy-MM-dd') : '',
      fecha_vencimiento: fechaVencimiento ? format(fechaVencimiento, 'yyyy-MM-dd') : undefined,
      estado: estadoFactura,
      notas_cliente: notasCliente,
      notas_internas: notasInternas,
      items: payloadItems,
    };
    
    startTransition(async () => {
      let result;
      if (isEditMode && facturaId) {
        setFormError("La funcionalidad de editar factura aún no está implementada para impuestos por ítem."); return;
        // result = await actualizarFactura(facturaId, payload as any); 
      } else {
        result = await crearFacturaConItems(payload as any); 
      }
      
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors); 
        }
      } else {
        router.push('/dashboard/facturacion');
        router.refresh(); 
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader><CardTitle>Datos de la Factura</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Campos de cabecera: Numero, Fechas, Propietario, Paciente, Estado */}
          {/* SE ELIMINÓ EL INPUT DE "IGIC Predeterminado para Nuevos Ítems (%)" */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="numero_factura" className="mb-1.5 block">Número de Factura</Label>
              <Input id="numero_factura" name="numero_factura" value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} required />
              {fieldErrors?.numero_factura && <p className="text-sm text-red-500 mt-1">{fieldErrors.numero_factura[0]}</p>}
            </div>
            <div>
              <Label htmlFor="fecha_emision" className="mb-1.5 block">Fecha de Emisión</Label>
              <DatePicker date={fechaEmision} onDateChange={setFechaEmision} />
              <input type="hidden" name="fecha_emision" value={fechaEmision ? format(fechaEmision, 'yyyy-MM-dd') : ''} />
              {fieldErrors?.fecha_emision && <p className="text-sm text-red-500 mt-1">{fieldErrors.fecha_emision[0]}</p>}
            </div>
            <div>
              <Label htmlFor="fecha_vencimiento" className="mb-1.5 block">Fecha de Vencimiento (opc)</Label>
              <DatePicker date={fechaVencimiento} onDateChange={setFechaVencimiento} />
              <input type="hidden" name="fecha_vencimiento" value={fechaVencimiento ? format(fechaVencimiento, 'yyyy-MM-dd') : ''} />
              {fieldErrors?.fecha_vencimiento && <p className="text-sm text-red-500 mt-1">{fieldErrors.fecha_vencimiento[0]}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="propietario_id_form" className="mb-1.5 block">Propietario</Label>
              <Select name="propietario_id" required value={propietarioId} onValueChange={setPropietarioId}>
                <SelectTrigger id="propietario_id_form"><SelectValue placeholder="Selecciona propietario" /></SelectTrigger>
                <SelectContent>{propietarios.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
              {fieldErrors?.propietario_id && <p className="text-sm text-red-500 mt-1">{fieldErrors.propietario_id[0]}</p>}
            </div>
            <div>
              <Label htmlFor="paciente_id_form" className="mb-1.5 block">Paciente (opcional)</Label>
              <Select name="paciente_id" value={pacienteId} onValueChange={setPacienteId} disabled={!propietarioId || pacientesFiltrados.length === 0}>
                <SelectTrigger id="paciente_id_form"><SelectValue placeholder="Selecciona paciente" /></SelectTrigger>
                <SelectContent>{pacientesFiltrados.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="estado_form" className="mb-1.5 block">Estado</Label>
              <Select name="estado" required value={estadoFactura} onValueChange={(value) => setEstadoFactura(value as EstadoFacturaPagoValue)}>
                <SelectTrigger id="estado_form"><SelectValue placeholder="Selecciona estado" /></SelectTrigger>
                <SelectContent>{estadosFacturaPagoOpciones.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
              {fieldErrors?.estado && <p className="text-sm text-red-500 mt-1">{fieldErrors.estado[0]}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ítems de la Factura</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {itemsCalculados.map((item, index) => (
              <div key={item.id_temporal} className="grid grid-cols-[minmax(0,3fr)_repeat(3,minmax(0,1fr))_minmax(0,1.5fr)_auto] items-end gap-2 border-b pb-4 mb-2">
                {/* Descripción */}
                <div className="space-y-1">
                  <Label htmlFor={`item_descripcion_${index}`} className="text-xs">Descripción</Label>
                  <Textarea id={`item_descripcion_${index}`} placeholder="Servicio o Producto" value={item.descripcion} onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)} required rows={1} className="text-sm"/>
                </div>
                {/* Cantidad */}
                <div className="space-y-1">
                  <Label htmlFor={`item_cantidad_${index}`} className="text-xs">Cant.</Label>
                  <Input id={`item_cantidad_${index}`} type="number" value={item.cantidad} onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)} required min="1" className="text-sm h-9 text-center"/>
                </div>
                {/* Precio Base */}
                <div className="space-y-1">
                  <Label htmlFor={`item_precio_${index}`} className="text-xs">Precio Base (€)</Label>
                  <Input id={`item_precio_${index}`} type="number" value={item.precio_unitario} onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)} required step="0.01" min="0" className="text-sm h-9 text-right"/>
                </div>
                {/* % IGIC Item */}
                <div className="space-y-1">
                  <Label htmlFor={`item_impuesto_${index}`} className="text-xs">IGIC (%)</Label>
                  <Select value={item.porcentaje_impuesto_item} onValueChange={(value) => handleItemChange(index, 'porcentaje_impuesto_item', value as ImpuestoItemValue)}>
                    <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {impuestoItemOpciones.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Resumen del ítem */}
                <div className="text-right text-xs space-y-0.5 pt-1 self-center">
                  <p>Base: {formatCurrency(item.baseImponibleItem)}</p>
                  <p>IGIC: {formatCurrency(item.montoImpuestoItem)}</p>
                  <p className="font-semibold">Total: {formatCurrency(item.totalItem)}</p>
                </div>
                {/* Botón Eliminar Ítem */}
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id_temporal)} className="text-destructive self-center">
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-4">
            <PlusCircleIcon className="h-4 w-4 mr-2" /> Añadir Ítem
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Resumen y Totales</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between font-semibold">
            <span>Total Base Imponible General:</span>
            <span>{formatCurrency(subtotalGeneralFactura)}</span>
          </div>
          
          {/* Desglose de IGIC por tasa */}
          {tasasRelevantes.length > 0 && <p className="font-medium mt-2 mb-1">Desglose de IGIC:</p>}
          {tasasRelevantes.map((tasaKey) => (
            <div key={tasaKey} className="flex justify-between pl-4 text-xs">
              <span>Base {tasaKey}: {formatCurrency(desgloseImpuestosUI[tasaKey].base)}</span>
              <span>Monto {tasaKey}: {formatCurrency(desgloseImpuestosUI[tasaKey].impuesto)}</span>
            </div>
          ))}
          
          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
            <span>Total Impuestos (IGIC):</span>
            <span>{formatCurrency(montoTotalImpuestos)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t-2 border-primary pt-2 mt-2">
            <span>TOTAL FACTURA:</span>
            <span>{formatCurrency(totalFactura)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ... (Notas y botones de acción del formulario como antes) ... */}
      <Card>
            <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notas_cliente" className="mb-1.5 block">Notas para el Cliente</Label>
                <Textarea id="notas_cliente" name="notas_cliente" value={notasCliente} onChange={(e) => setNotasCliente(e.target.value)} rows={3} />
              </div>
              <div>
                <Label htmlFor="notas_internas" className="mb-1.5 block">Notas Internas</Label>
                <Textarea id="notas_internas" name="notas_internas" value={notasInternas} onChange={(e) => setNotasInternas(e.target.value)} rows={3} />
              </div>
            </CardContent>
      </Card>
      
      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}
      {fieldErrors?.general && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{fieldErrors.general[0]}</p>}


      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? (isEditMode ? "Actualizando Factura..." : "Creando Factura...") : (isEditMode ? "Guardar Cambios" : "Crear Factura")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}