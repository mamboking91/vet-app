// app/dashboard/inventario/nuevo/ProductoCatalogoForm.tsx
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { agregarProductoCatalogo, actualizarProductoCatalogo } from '../actions'; // Importa ambas acciones
// Importa las opciones y tipos desde tu archivo de tipos centralizado para inventario
import { 
  unidadesDeMedidaInventarioOpciones, 
  type ProductoCatalogoFormData,
  type UnidadMedidaInventarioValue 
} from '../types'; // Asume que types.ts está en ../inventario/types.ts

interface ProductoCatalogoFormProps {
  initialData?: Partial<ProductoCatalogoFormData>; // Datos para modo edición
  productoId?: string; // ID para modo edición y para la acción de actualizar
}

// Tipo para los errores de campo específicos devueltos por Zod
type FieldErrors = { 
  [key in keyof ProductoCatalogoFormData]?: string[] | undefined; 
} & { [key: string]: string[] | undefined };


export default function ProductoCatalogoForm({ initialData, productoId }: ProductoCatalogoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  const isEditMode = Boolean(productoId && initialData);

  // Estados para los campos del formulario, inicializados si hay initialData
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
  const [codigoProducto, setCodigoProducto] = useState(initialData?.codigo_producto || '');
  const [unidad, setUnidad] = useState<UnidadMedidaInventarioValue | ''>(
    (initialData?.unidad as UnidadMedidaInventarioValue) || 'Unidad'
  );
  const [stockMinimo, setStockMinimo] = useState(initialData?.stock_minimo || '0');
  const [precioCompra, setPrecioCompra] = useState(initialData?.precio_compra || '');
  const [precioVenta, setPrecioVenta] = useState(initialData?.precio_venta || '');
  const [requiereLote, setRequiereLote] = useState(
    initialData?.requiere_lote === undefined ? true : initialData.requiere_lote
  );
  const [notasInternas, setNotasInternas] = useState(initialData?.notas_internas || '');

  // useEffect para actualizar el estado si initialData cambia (importante para el modo edición)
  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || '');
      setDescripcion(initialData.descripcion || '');
      setCodigoProducto(initialData.codigo_producto || '');
      setUnidad((initialData.unidad as UnidadMedidaInventarioValue) || 'Unidad');
      setStockMinimo(initialData.stock_minimo || '0');
      setPrecioCompra(initialData.precio_compra || '');
      setPrecioVenta(initialData.precio_venta || '');
      setRequiereLote(initialData.requiere_lote === undefined ? true : initialData.requiere_lote);
      setNotasInternas(initialData.notas_internas || '');
    }
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    const formData = new FormData(event.currentTarget);
    // El valor del checkbox 'requiere_lote' es 'on' si está marcado, o no se envía si no lo está.
    // La Server Action (con Zod preprocess) maneja la conversión a booleano.
    // Si el checkbox no está marcado y no se envía, formData.get('requiere_lote') será null.
    // Para asegurar que siempre se envíe un valor interpretable para el booleano:
    if (!formData.has('requiere_lote')) {
        formData.append('requiere_lote', 'off'); // Zod lo interpretará como false
    }


    startTransition(async () => {
      let result;
      if (isEditMode && productoId) {
        result = await actualizarProductoCatalogo(productoId, formData);
      } else {
        result = await agregarProductoCatalogo(formData); 
      }
      
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.");
        if (result.error?.errors) {
          // Aseguramos que el tipo de errors coincida con FieldErrors
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        router.push('/dashboard/inventario');
        router.refresh(); 
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Nombre y Código de Producto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="nombre" className="mb-1.5 block">Nombre del Producto/Medicamento</Label>
          <Input id="nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          {fieldErrors?.nombre && <p className="text-sm text-red-500 mt-1">{fieldErrors.nombre[0]}</p>}
        </div>
        <div>
          <Label htmlFor="codigo_producto" className="mb-1.5 block">Código/SKU (opcional)</Label>
          <Input id="codigo_producto" name="codigo_producto" value={codigoProducto} onChange={(e) => setCodigoProducto(e.target.value)} />
          {fieldErrors?.codigo_producto && <p className="text-sm text-red-500 mt-1">{fieldErrors.codigo_producto[0]}</p>}
        </div>
      </div>

      {/* Descripción */}
      <div>
        <Label htmlFor="descripcion" className="mb-1.5 block">Descripción (opcional)</Label>
        <Textarea id="descripcion" name="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
        {fieldErrors?.descripcion && <p className="text-sm text-red-500 mt-1">{fieldErrors.descripcion[0]}</p>}
      </div>

      {/* Unidad y Stock Mínimo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="unidad" className="mb-1.5 block">Unidad de Medida</Label>
          <Select name="unidad" value={unidad} onValueChange={(value) => setUnidad(value as UnidadMedidaInventarioValue | '')} defaultValue="Unidad">
            <SelectTrigger id="unidad"><SelectValue placeholder="Selecciona unidad" /></SelectTrigger>
            <SelectContent>
              {unidadesDeMedidaInventarioOpciones.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors?.unidad && <p className="text-sm text-red-500 mt-1">{fieldErrors.unidad[0]}</p>}
        </div>
        <div>
          <Label htmlFor="stock_minimo" className="mb-1.5 block">Stock Mínimo (opcional)</Label>
          <Input id="stock_minimo" name="stock_minimo" type="number" value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} min="0" placeholder="0"/>
          {fieldErrors?.stock_minimo && <p className="text-sm text-red-500 mt-1">{fieldErrors.stock_minimo[0]}</p>}
        </div>
      </div>

      {/* Precios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Label htmlFor="precio_compra" className="mb-1.5 block">Precio de Compra (€, opcional)</Label>
          <Input id="precio_compra" name="precio_compra" type="number" value={precioCompra} onChange={(e) => setPrecioCompra(e.target.value)} step="0.01" min="0"/>
          {fieldErrors?.precio_compra && <p className="text-sm text-red-500 mt-1">{fieldErrors.precio_compra[0]}</p>}
        </div>
        <div>
          <Label htmlFor="precio_venta" className="mb-1.5 block">Precio de Venta (€, opcional)</Label>
          <Input id="precio_venta" name="precio_venta" type="number" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} step="0.01" min="0"/>
          {fieldErrors?.precio_venta && <p className="text-sm text-red-500 mt-1">{fieldErrors.precio_venta[0]}</p>}
        </div>
      </div>

      {/* Requiere Lote */}
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="requiere_lote" 
          name="requiere_lote" // Es importante que el 'name' esté aquí para FormData
          checked={requiereLote} 
          onCheckedChange={(checkedState) => {
            // checkedState puede ser boolean o 'indeterminate'
            setRequiereLote(Boolean(checkedState === true)); 
          }}
        />
        <Label htmlFor="requiere_lote" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Este producto se gestiona por lotes (ej. medicamentos, vacunas)
        </Label>
        {fieldErrors?.requiere_lote && <p className="text-sm text-red-500 ml-2">{fieldErrors.requiere_lote[0]}</p>}
      </div>

      {/* Notas Internas */}
      <div>
        <Label htmlFor="notas_internas" className="mb-1.5 block">Notas Internas (opcional)</Label>
        <Textarea id="notas_internas" name="notas_internas" value={notasInternas} onChange={(e) => setNotasInternas(e.target.value)} rows={3} />
        {fieldErrors?.notas_internas && <p className="text-sm text-red-500 mt-1">{fieldErrors.notas_internas[0]}</p>}
      </div>
      
      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending 
            ? (isEditMode ? "Actualizando..." : "Guardando Producto...") 
            : (isEditMode ? "Guardar Cambios" : "Guardar Producto")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}