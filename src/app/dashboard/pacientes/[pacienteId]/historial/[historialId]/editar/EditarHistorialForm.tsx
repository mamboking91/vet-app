"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, FileText, Stethoscope, Pill, AlertCircle, Save, X, Edit3 } from "lucide-react"
import { actualizarEntradaHistorial } from "../../actions"
import type { HistorialMedicoEditable } from "./page"

interface EditarHistorialFormProps {
  entradaHistorial: HistorialMedicoEditable
  pacienteId: string
}

const tiposRegistroMedicoOpciones = [
  { value: "Consulta", label: "Consulta", icon: Stethoscope },
  { value: "Vacunación", label: "Vacunación", icon: Pill },
  { value: "Desparasitación", label: "Desparasitación", icon: Pill },
  { value: "Procedimiento", label: "Procedimiento", icon: Edit3 },
  { value: "Observación", label: "Observación", icon: FileText },
  { value: "Análisis Laboratorio", label: "Análisis Laboratorio", icon: FileText },
  { value: "Imagenología", label: "Imagenología (Rayos X, Eco)", icon: FileText },
  { value: "Cirugía", label: "Cirugía", icon: Edit3 },
  { value: "Otro", label: "Otro", icon: FileText },
]

type FieldErrors = { [key: string]: string[] | undefined }

export default function EditarHistorialForm({ entradaHistorial, pacienteId }: EditarHistorialFormProps) {
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

  useEffect(() => {
    setFechaEvento(entradaHistorial.fecha_evento)
    setTipo(entradaHistorial.tipo)
    setDescripcion(entradaHistorial.descripcion)
    setDiagnostico(entradaHistorial.diagnostico || "")
    setTratamientoIndicado(entradaHistorial.tratamiento_indicado || "")
    setNotasSeguimiento(entradaHistorial.notas_seguimiento || "")
  }, [entradaHistorial])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors(null)
    const formData = new FormData(event.currentTarget)

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
            <CardTitle className="flex items-center gap-3 text-xl font-semibold">
              <div className="p-2 bg-white/20 rounded-lg">
                <Edit3 className="h-6 w-6" />
              </div>
              Editar Entrada del Historial Médico
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fecha_evento" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    Fecha del Evento
                  </Label>
                  <Input
                    id="fecha_evento"
                    name="fecha_evento"
                    type="date"
                    value={fechaEvento}
                    onChange={(e) => setFechaEvento(e.target.value)}
                    required
                    className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
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
                    <Stethoscope className="h-4 w-4 text-purple-600" />
                    Tipo de Registro
                  </Label>
                  <Select name="tipo" required value={tipo} onValueChange={setTipo}>
                    <SelectTrigger id="tipo" className="border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposRegistroMedicoOpciones.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <t.icon className="h-4 w-4 text-purple-600" />
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

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Descripción Detallada
                </Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  rows={5}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
                  placeholder="Describe detalladamente el evento médico..."
                />
                {fieldErrors?.descripcion && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.descripcion[0]}
                  </p>
                )}
              </div>

              {/* Diagnóstico y Tratamiento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="diagnostico" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Stethoscope className="h-4 w-4 text-emerald-600" />
                    Diagnóstico
                    <span className="text-xs text-gray-500">(opcional)</span>
                  </Label>
                  <Textarea
                    id="diagnostico"
                    name="diagnostico"
                    rows={3}
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                    className="border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
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
                  <Label
                    htmlFor="tratamiento_indicado"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <Pill className="h-4 w-4 text-blue-600" />
                    Tratamiento Indicado
                    <span className="text-xs text-gray-500">(opcional)</span>
                  </Label>
                  <Textarea
                    id="tratamiento_indicado"
                    name="tratamiento_indicado"
                    rows={3}
                    value={tratamientoIndicado}
                    onChange={(e) => setTratamientoIndicado(e.target.value)}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
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

              {/* Notas de seguimiento */}
              <div className="space-y-2">
                <Label
                  htmlFor="notas_seguimiento"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <FileText className="h-4 w-4 text-amber-600" />
                  Notas de Seguimiento
                  <span className="text-xs text-gray-500">(opcional)</span>
                </Label>
                <Textarea
                  id="notas_seguimiento"
                  name="notas_seguimiento"
                  rows={3}
                  value={notasSeguimiento}
                  onChange={(e) => setNotasSeguimiento(e.target.value)}
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

              {/* Error general */}
              {formError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-red-800 font-medium">Error al actualizar</h4>
                    <p className="text-red-700 text-sm mt-1">{formError}</p>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Actualizando..." : "Guardar Cambios"}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
