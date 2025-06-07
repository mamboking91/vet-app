"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, FileText, Stethoscope, Pill, AlertCircle, Save, X, Edit3, Trash2, Plus, ShoppingCart, StethoscopeIcon } from "lucide-react"
import { actualizarEntradaHistorial } from "../../actions"
import type { HistorialMedicoEditableConItems } from "./page"
import { tiposDeCitaOpciones } from "../../../../../citas/types"
// --- CORRECCIÓN: La ruta de importación ahora apunta a 'facturacion/types' ---
import type { ProcedimientoParaFactura, ProductoInventarioParaFactura } from "@/app/dashboard/facturacion/types"


interface EditarHistorialFormProps {
  entradaHistorial: HistorialMedicoEditableConItems;
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

type FieldErrors = { [key: string]: string[] | undefined } & {
    consumed_items?: string;
    procedimientos_realizados?: string;
};

export default function EditarHistorialForm({ entradaHistorial, pacienteId, productosDisponibles, procedimientosDisponibles }: EditarHistorialFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null)

  const [fechaEvento, setFechaEvento] = useState(entradaHistorial.fecha_evento)
  const [tipo, setTipo] = useState(entradaHistorial.tipo)
  const [descripcion, setDescripcion] = useState(entradaHistorial.descripcion)
  const [diagnostico, setDiagnostico] = useState(entradaHistorial.diagnostico || "")
  const [tratamientoIndicado, setTratamientoIndicado] = useState(entradaHistorial.tratamiento_indicado || "")
  const [notasSeguimiento, setNotasSeguimiento] = useState(entradaHistorial.notas_seguimiento || "")
  const [consumedItems, setConsumedItems] = useState<ConsumedItem[]>([]);
  const [performedProcedures, setPerformedProcedures] = useState<PerformedProcedure[]>([]);

  useEffect(() => {
    setFechaEvento(entradaHistorial.fecha_evento)
    setTipo(entradaHistorial.tipo)
    setDescripcion(entradaHistorial.descripcion)
    setDiagnostico(entradaHistorial.diagnostico || "")
    setTratamientoIndicado(entradaHistorial.tratamiento_indicado || "")
    setNotasSeguimiento(entradaHistorial.notas_seguimiento || "")

    const initialItems = (entradaHistorial.consumed_items || []).map(item => ({
        id_temporal: crypto.randomUUID(),
        producto_id: item.producto_id,
        cantidad: item.cantidad.toString(),
    }));
    setConsumedItems(initialItems);

    const initialProcedures = (entradaHistorial.procedimientos_realizados || []).map(proc => ({
        id_temporal: crypto.randomUUID(),
        procedimiento_id: proc.procedimiento_id,
        cantidad: proc.cantidad.toString(),
    }));
    setPerformedProcedures(initialProcedures);
  }, [entradaHistorial])

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
    event.preventDefault()
    setFormError(null)
    setFieldErrors(null)
    const formData = new FormData(event.currentTarget)
    formData.append("consumed_items", JSON.stringify(consumedItems.filter(item => item.producto_id && item.cantidad)));
    formData.append("procedimientos_realizados", JSON.stringify(performedProcedures.filter(proc => proc.procedimiento_id && proc.cantidad)));

    startTransition(async () => {
      const result = await actualizarEntradaHistorial(entradaHistorial.id, formData)
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error al actualizar.")
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors)
        }
      } else {
        router.push(`/dashboard/pacientes/${pacienteId}`)
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg py-6">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold"><div className="p-2 bg-white/20 rounded-lg"><Edit3 className="h-6 w-6" /></div>Editar Entrada del Historial Médico</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* --- Sección de Información Básica --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fecha_evento" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Calendar className="h-4 w-4 text-purple-600" />Fecha del Evento</Label>
                  <Input id="fecha_evento" name="fecha_evento" type="date" value={fechaEvento} onChange={(e) => setFechaEvento(e.target.value)} required className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"/>
                  {fieldErrors?.fecha_evento && (<p className="text-sm text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{fieldErrors.fecha_evento[0]}</p>)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Stethoscope className="h-4 w-4 text-purple-600" />Tipo de Registro</Label>
                  <Select name="tipo" required value={tipo} onValueChange={setTipo}><SelectTrigger id="tipo" className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger><SelectContent>{tiposDeCitaOpciones.map((t) => (<SelectItem key={t.value} value={t.value}><div className="flex items-center gap-2"><t.icon className="h-4 w-4 text-purple-600" />{t.label}</div></SelectItem>))}</SelectContent></Select>
                  {fieldErrors?.tipo && (<p className="text-sm text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{fieldErrors.tipo[0]}</p>)}
                </div>
              </div>

              {/* --- Sección de Detalles Médicos --- */}
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="flex items-center gap-2 text-sm font-medium text-gray-700"><FileText className="h-4 w-4 text-purple-600" />Descripción Detallada</Label>
                <Textarea id="descripcion" name="descripcion" rows={5} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none" placeholder="Describe detalladamente el evento médico..."/>
                {fieldErrors?.descripcion && <p className="text-sm text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{fieldErrors.descripcion[0]}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="diagnostico" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Stethoscope className="h-4 w-4 text-emerald-600" />Diagnóstico <span className="text-xs text-gray-500">(opcional)</span></Label>
                    <Textarea id="diagnostico" name="diagnostico" rows={3} value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none" placeholder="Diagnóstico médico..."/>
                    {fieldErrors?.diagnostico && <p className="text-sm text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{fieldErrors.diagnostico[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tratamiento_indicado" className="flex items-center gap-2 text-sm font-medium text-gray-700"><Pill className="h-4 w-4 text-blue-600" />Tratamiento Indicado <span className="text-xs text-gray-500">(opcional)</span></Label>
                    <Textarea id="tratamiento_indicado" name="tratamiento_indicado" rows={3} value={tratamientoIndicado} onChange={(e) => setTratamientoIndicado(e.target.value)} className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none" placeholder="Tratamiento recomendado..."/>
                    {fieldErrors?.tratamiento_indicado && <p className="text-sm text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{fieldErrors.tratamiento_indicado[0]}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notas_seguimiento" className="flex items-center gap-2 text-sm font-medium text-gray-700"><FileText className="h-4 w-4 text-amber-600" />Notas de Seguimiento <span className="text-xs text-gray-500">(opcional)</span></Label>
                <Textarea id="notas_seguimiento" name="notas_seguimiento" rows={3} value={notasSeguimiento} onChange={(e) => setNotasSeguimiento(e.target.value)} className="border-gray-200 focus:border-amber-500 focus:ring-amber-500 resize-none" placeholder="Notas adicionales para seguimiento..."/>
                {fieldErrors?.notas_seguimiento && <p className="text-sm text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{fieldErrors.notas_seguimiento[0]}</p>}
              </div>

              {/* --- Sección de Procedimientos --- */}
              <Card className="shadow-inner bg-slate-50 border-slate-200">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800"><StethoscopeIcon className="h-5 w-5 text-purple-600" />Procedimientos Adicionales</CardTitle><CardDescription>Modifica los procedimientos realizados.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    {performedProcedures.map((proc, index) => (
                        <div key={proc.id_temporal} className="flex items-end gap-3 p-3 bg-white rounded-lg border">
                            <div className="flex-1 space-y-1.5"><Label htmlFor={`procedimiento-${index}`} className="text-xs">Procedimiento</Label><Select value={proc.procedimiento_id} onValueChange={(value) => handleItemChange(index, "procedimiento_id", value, 'procedure')}><SelectTrigger id={`procedimiento-${index}`}><SelectValue placeholder="Selecciona un procedimiento" /></SelectTrigger><SelectContent>{procedimientosDisponibles.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>))}</SelectContent></Select></div>
                            <div className="w-24 space-y-1.5"><Label htmlFor={`proc-cantidad-${index}`} className="text-xs">Cantidad</Label><Input id={`proc-cantidad-${index}`} type="number" min="1" value={proc.cantidad} onChange={(e) => handleItemChange(index, "cantidad", e.target.value, 'procedure')} placeholder="1"/></div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(proc.id_temporal, 'procedure')} className="h-9 w-9 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addItem('procedure')} className="mt-4"><Plus className="h-4 w-4 mr-2" />Añadir Procedimiento</Button>
                </CardContent>
              </Card>

              {/* --- Sección de Productos --- */}
              <Card className="shadow-inner bg-slate-50 border-slate-200">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800"><ShoppingCart className="h-5 w-5 text-blue-600" />Productos Utilizados</CardTitle><CardDescription>Modifica los productos consumidos.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    {consumedItems.map((item, index) => (
                        <div key={item.id_temporal} className="flex items-end gap-3 p-3 bg-white rounded-lg border">
                            <div className="flex-1 space-y-1.5"><Label htmlFor={`producto-${index}`} className="text-xs">Producto</Label><Select value={item.producto_id} onValueChange={(value) => handleItemChange(index, "producto_id", value, 'product')}><SelectTrigger id={`producto-${index}`}><SelectValue placeholder="Selecciona un producto" /></SelectTrigger><SelectContent>{productosDisponibles.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>))}</SelectContent></Select></div>
                            <div className="w-24 space-y-1.5"><Label htmlFor={`cantidad-${index}`} className="text-xs">Cantidad</Label><Input id={`cantidad-${index}`} type="number" min="1" value={item.cantidad} onChange={(e) => handleItemChange(index, "cantidad", e.target.value, 'product')} placeholder="1"/></div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id_temporal, 'product')} className="h-9 w-9 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addItem('product')} className="mt-4"><Plus className="h-4 w-4 mr-2" />Añadir Producto</Button>
                </CardContent>
              </Card>

              {formError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div><h4 className="text-red-800 font-medium">Error al actualizar</h4><p className="text-red-700 text-sm mt-1">{formError}</p></div>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"><Save className="h-4 w-4" />{isPending ? "Actualizando..." : "Guardar Cambios"}</Button>
                <Button type="button" variant="outline" onClick={() => router.back()} className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><X className="h-4 w-4" />Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
