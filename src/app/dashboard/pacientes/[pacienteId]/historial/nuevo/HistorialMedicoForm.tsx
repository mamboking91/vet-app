"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, FileText, Stethoscope, Pill, AlertCircle, Save, X, Plus, Trash2, ShoppingCart, CheckCircle, StethoscopeIcon } from "lucide-react"

import { agregarEntradaHistorial } from "../actions"
import { tiposDeCitaOpciones } from "../../../../citas/types"
import type { ProcedimientoParaFactura, ProductoInventarioParaFactura } from "@/app/dashboard/facturacion/types"

// Tipos locales para el estado del formulario
interface HistorialMedicoFormProps {
  pacienteId: string;
  productosDisponibles: ProductoInventarioParaFactura[];
  procedimientosDisponibles: ProcedimientoParaFactura[];
}

interface ConsumedItem {
  id_temporal: string;
  producto_id: string;
  cantidad: string;
}

interface PerformedProcedure {
  id_temporal: string;
  procedimiento_id: string;
  cantidad: string;
}

type FieldErrors = {
    [key: string]: string[] | undefined;
} & {
    consumed_items?: string;
    procedimientos_realizados?: string;
    general?: string;
};

export default function HistorialMedicoForm({ pacienteId, productosDisponibles, procedimientosDisponibles }: HistorialMedicoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [successResult, setSuccessResult] = useState<{ id: string } | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [consumedItems, setConsumedItems] = useState<ConsumedItem[]>([]);
  const [performedProcedures, setPerformedProcedures] = useState<PerformedProcedure[]>([]);

  const handleItemChange = (index: number, field: 'producto_id' | 'cantidad' | 'procedimiento_id', value: string, type: 'product' | 'procedure') => {
    if (type === 'product') {
        const newItems = [...consumedItems];
        newItems[index] = { ...newItems[index], [field as 'producto_id' | 'cantidad']: value };
        setConsumedItems(newItems);
    } else {
        const newProcedures = [...performedProcedures];
        newProcedures[index] = { ...newProcedures[index], [field as 'procedimiento_id' | 'cantidad']: value };
        setPerformedProcedures(newProcedures);
    }
  };

  const addItem = (type: 'product' | 'procedure') => {
    if (type === 'product') {
        setConsumedItems([...consumedItems, { id_temporal: crypto.randomUUID(), producto_id: "", cantidad: "1" }]);
    } else {
        setPerformedProcedures([...performedProcedures, { id_temporal: crypto.randomUUID(), procedimiento_id: "", cantidad: "1" }]);
    }
  };

  const removeItem = (id: string, type: 'product' | 'procedure') => {
    if (type === 'product') {
        setConsumedItems(consumedItems.filter((item) => item.id_temporal !== id));
    } else {
        setPerformedProcedures(performedProcedures.filter((proc) => proc.id_temporal !== id));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);
    setSuccessResult(null);

    const formData = new FormData(event.currentTarget);
    formData.append("paciente_id", pacienteId);
    formData.append("consumed_items", JSON.stringify(consumedItems.filter(item => item.producto_id && item.cantidad)));
    formData.append("procedimientos_realizados", JSON.stringify(performedProcedures.filter(proc => proc.procedimiento_id && proc.cantidad)));

    startTransition(async () => {
      const result = await agregarEntradaHistorial(formData);
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        // --- CORRECCIÓN AQUÍ ---
        // Verificamos que result.data y result.data.id existan antes de usarlos.
        if (result.data?.id) {
          setSuccessResult({ id: result.data.id });
        } else {
          // Esto es un fallback en caso de que la acción del servidor tenga éxito
          // pero no devuelva los datos esperados, para evitar que la app se rompa.
          setFormError("La entrada se guardó, pero hubo un error al obtener la confirmación. Por favor, vuelve a la página del paciente.");
        }
        // --- FIN DE LA CORRECCIÓN ---
      }
    });
  };

  if (successResult) {
    return (
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-green-100 rounded-full mb-4"><CheckCircle className="h-12 w-12 text-green-600" /></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Historial guardado!</h2>
            <p className="text-gray-600 mb-6">La entrada del historial médico se ha guardado correctamente.</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="outline" size="lg"><Link href={`/dashboard/pacientes/${pacienteId}`}>Volver al Paciente</Link></Button>
                <Button asChild size="lg"><Link href={`/dashboard/facturacion/nueva?fromHistorial=${successResult.id}`}><FileText className="mr-2 h-4 w-4"/>Generar Factura</Link></Button>
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg py-6">
              <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Plus className="h-6 w-6" />
                </div>
                Nueva Entrada del Historial Médico
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* SECCIÓN INFORMACIÓN BÁSICA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fecha_evento" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Fecha del Evento
                  </Label>
                  <Input 
                    id="fecha_evento" 
                    name="fecha_evento" 
                    type="date" 
                    defaultValue={today} 
                    required 
                    className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  {fieldErrors?.fecha_evento && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.fecha_evento[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                    Tipo de Registro
                  </Label>
                  <Select name="tipo" required>
                    <SelectTrigger id="tipo" className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDeCitaOpciones.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <t.icon className="h-4 w-4 text-emerald-600" />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors?.tipo && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.tipo[0]}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Descripción Detallada
                </Label>
                <Textarea 
                  id="descripcion" 
                  name="descripcion" 
                  rows={5} 
                  required 
                  className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none" 
                  placeholder="Describe detalladamente el evento médico..."
                />
                {fieldErrors?.descripcion && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.descripcion[0]}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="diagnostico" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Stethoscope className="h-4 w-4 text-blue-600" />
                    Diagnóstico 
                    <span className="text-xs text-gray-500">(opcional)</span>
                  </Label>
                  <Textarea 
                    id="diagnostico" 
                    name="diagnostico" 
                    rows={3} 
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none" 
                    placeholder="Diagnóstico médico..."
                  />
                  {fieldErrors?.diagnostico && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.diagnostico[0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tratamiento_indicado" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Pill className="h-4 w-4 text-purple-600" />
                    Tratamiento Indicado 
                    <span className="text-xs text-gray-500">(opcional)</span>
                  </Label>
                  <Textarea 
                    id="tratamiento_indicado" 
                    name="tratamiento_indicado" 
                    rows={3} 
                    className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none" 
                    placeholder="Tratamiento recomendado..."
                  />
                  {fieldErrors?.tratamiento_indicado && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors.tratamiento_indicado[0]}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notas_seguimiento" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-amber-600" />
                  Notas de Seguimiento 
                  <span className="text-xs text-gray-500">(opcional)</span>
                </Label>
                <Textarea 
                  id="notas_seguimiento" 
                  name="notas_seguimiento" 
                  rows={3} 
                  className="border-gray-200 focus:border-amber-500 focus:ring-amber-500 resize-none" 
                  placeholder="Notas adicionales para seguimiento..."
                />
                {fieldErrors?.notas_seguimiento && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.notas_seguimiento[0]}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <StethoscopeIcon className="h-5 w-5" />
                Procedimientos Adicionales
              </CardTitle>
              <CardDescription className="text-purple-100">
                Añade otros procedimientos realizados durante la visita.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {performedProcedures.map((proc, index) => (
                <div key={proc.id_temporal} className="flex items-end gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`procedimiento-${index}`} className="text-xs">Procedimiento</Label>
                    <Select value={proc.procedimiento_id} onValueChange={(value) => handleItemChange(index, "procedimiento_id", value, 'procedure')}>
                      <SelectTrigger id={`procedimiento-${index}`}>
                        <SelectValue placeholder="Selecciona un procedimiento" />
                      </SelectTrigger>
                      <SelectContent>
                        {procedimientosDisponibles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1.5">
                    <Label htmlFor={`proc-cantidad-${index}`} className="text-xs">Cantidad</Label>
                    <Input 
                      id={`proc-cantidad-${index}`} 
                      type="number" 
                      min="1" 
                      value={proc.cantidad} 
                      onChange={(e) => handleItemChange(index, "cantidad", e.target.value, 'procedure')} 
                      placeholder="1"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItem(proc.id_temporal, 'procedure')} 
                    className="h-9 w-9 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addItem('procedure')} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Procedimiento
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <ShoppingCart className="h-5 w-5" />
                Productos Utilizados
              </CardTitle>
              <CardDescription className="text-blue-100">
                Añade los productos consumidos para descontar el stock automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {consumedItems.map((item, index) => (
                <div key={item.id_temporal} className="flex items-end gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`producto-${index}`} className="text-xs">Producto</Label>
                    <Select value={item.producto_id} onValueChange={(value) => handleItemChange(index, "producto_id", value, 'product')}>
                      <SelectTrigger id={`producto-${index}`}>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productosDisponibles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1.5">
                    <Label htmlFor={`cantidad-${index}`} className="text-xs">Cantidad</Label>
                    <Input 
                      id={`cantidad-${index}`} 
                      type="number" 
                      min="1" 
                      value={item.cantidad} 
                      onChange={(e) => handleItemChange(index, "cantidad", e.target.value, 'product')} 
                      placeholder="1"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItem(item.id_temporal, 'product')} 
                    className="h-9 w-9 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addItem('product')} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Producto
              </Button>
            </CardContent>
          </Card>

          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-800 font-medium">Error al guardar</h4>
                <p className="text-red-700 text-sm mt-1">{formError}</p>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Button 
              type="submit" 
              disabled={isPending} 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Guardando..." : "Guardar Entrada"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()} 
              className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
