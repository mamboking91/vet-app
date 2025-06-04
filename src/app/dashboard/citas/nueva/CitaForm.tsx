"use client"

import type React from "react"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { agregarCita, actualizarCita } from "../actions"
import type { PacienteParaSelector, CitaFormData } from "../types"
import { tiposDeCitaOpciones, estadosDeCitaOpciones } from "../types"
import {
  Calendar,
  Clock,
  AlertCircle,
  Stethoscope,
  FileText,
  Heart,
  Timer,
  Clipboard,
  ArrowLeft,
  Loader2,
  Save,
  CalendarPlus,
  PawPrint,
} from "lucide-react"

interface CitaFormProps {
  pacientes: PacienteParaSelector[]
  initialData?: Partial<CitaFormData>
  citaId?: string
}

type FieldErrors = { [key: string]: string[] | undefined }

const getEstadoBadgeVariant = (
  estado?: string,
): "default" | "destructive" | "outline" | "secondary" | null => {
  switch (estado?.toLowerCase()) {
    case "programada":
      return "outline"
    case "confirmada":
      return "default"
    case "completada":
      return "secondary" // Cambiado de "success" a "secondary"
    case "cancelada por clínica":
    case "cancelada por cliente":
    case "no asistió":
      return "destructive"
    case "reprogramada":
      return "secondary"
    default:
      return null
  }
}

export default function CitaForm({ pacientes, initialData, citaId }: CitaFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = Boolean(citaId && initialData)

  const [pacienteId, setPacienteId] = useState(initialData?.paciente_id || "")
  const [fechaHoraInicio, setFechaHoraInicio] = useState(initialData?.fecha_hora_inicio || "")
  const [duracion, setDuracion] = useState(initialData?.duracion_estimada_minutos || "30")
  const [tipoCita, setTipoCita] = useState(initialData?.tipo || "")
  const [estadoCita, setEstadoCita] = useState(initialData?.estado || "Programada")
  const [motivo, setMotivo] = useState(initialData?.motivo || "")
  const [notas, setNotas] = useState(initialData?.notas_cita || "")

  // Encontrar el paciente seleccionado para mostrar información adicional
  const pacienteSeleccionado = pacientes.find((p) => p.id === pacienteId)

  useEffect(() => {
    if (initialData) {
      setPacienteId(initialData.paciente_id || "")
      setFechaHoraInicio(initialData.fecha_hora_inicio || "")
      setDuracion(initialData.duracion_estimada_minutos || "30")
      setTipoCita(initialData.tipo || "")
      setEstadoCita(initialData.estado || "Programada")
      setMotivo(initialData.motivo || "")
      setNotas(initialData.notas_cita || "")
    }
  }, [initialData])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors(null)
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      let result
      if (isEditMode && citaId) {
        result = await actualizarCita(citaId, formData)
      } else {
        result = await agregarCita(formData)
      }

      setIsSubmitting(false)

      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.")
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors)
        }
      } else {
        router.push(isEditMode ? `/dashboard/citas` : "/dashboard/citas")
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {isEditMode ? "Editar Cita" : "Programar Nueva Cita"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Actualiza los detalles de la cita existente"
              : "Completa el formulario para programar una nueva cita veterinaria"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección de Paciente */}
          <Card className="overflow-hidden border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                  <PawPrint className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-green-800 dark:text-green-200">Información del Paciente</CardTitle>
                  <CardDescription>Selecciona el paciente para esta cita</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div>
                <Label htmlFor="paciente_id" className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300">
                  Paciente <span className="text-red-500">*</span>
                </Label>
                <Select
                  name="paciente_id"
                  required
                  value={pacienteId}
                  onValueChange={setPacienteId}
                  disabled={isEditMode && !!initialData?.paciente_id}
                >
                  <SelectTrigger
                    id="paciente_id"
                    className="border-green-200 dark:border-green-800 focus:ring-green-500"
                  >
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre_display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors?.paciente_id && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {fieldErrors.paciente_id[0]}
                  </p>
                )}

                {pacienteSeleccionado && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Paciente seleccionado: {pacienteSeleccionado.nombre_display}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sección de Programación */}
          <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-blue-800 dark:text-blue-200">Programación</CardTitle>
                  <CardDescription>Establece la fecha, hora y duración de la cita</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label
                    htmlFor="fecha_hora_inicio"
                    className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300"
                  >
                    Fecha y Hora de Inicio <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <Clock className="h-4 w-4" />
                    </div>
                    <Input
                      id="fecha_hora_inicio"
                      name="fecha_hora_inicio"
                      type="datetime-local"
                      value={fechaHoraInicio}
                      onChange={(e) => setFechaHoraInicio(e.target.value)}
                      required
                      className="pl-10 border-blue-200 dark:border-blue-800 focus:ring-blue-500"
                    />
                  </div>
                  {fieldErrors?.fecha_hora_inicio && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {fieldErrors.fecha_hora_inicio[0]}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="duracion_estimada_minutos"
                    className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300"
                  >
                    Duración Estimada (minutos)
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <Timer className="h-4 w-4" />
                    </div>
                    <Input
                      id="duracion_estimada_minutos"
                      name="duracion_estimada_minutos"
                      type="number"
                      value={duracion}
                      onChange={(e) => setDuracion(e.target.value)}
                      min="15"
                      step="15"
                      className="pl-10 border-blue-200 dark:border-blue-800 focus:ring-blue-500"
                    />
                  </div>
                  {fieldErrors?.duracion_estimada_minutos && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {fieldErrors.duracion_estimada_minutos[0]}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección de Detalles de Cita */}
          <Card className="overflow-hidden border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                  <Stethoscope className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-purple-800 dark:text-purple-200">Detalles de la Cita</CardTitle>
                  <CardDescription>Información sobre el tipo y estado de la cita</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label htmlFor="tipo" className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300">
                    Tipo de Cita
                  </Label>
                  <Select name="tipo" value={tipoCita} onValueChange={setTipoCita}>
                    <SelectTrigger id="tipo" className="border-purple-200 dark:border-purple-800 focus:ring-purple-500">
                      <SelectValue placeholder="Selecciona un tipo de cita" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDeCitaOpciones.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors?.tipo && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {fieldErrors.tipo[0]}
                    </p>
                  )}
                </div>
                {isEditMode && (
                  <div>
                    <Label htmlFor="estado" className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300">
                      Estado de la Cita
                    </Label>
                    <Select name="estado" value={estadoCita} onValueChange={setEstadoCita}>
                      <SelectTrigger
                        id="estado"
                        className="border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosDeCitaOpciones.map((e_val) => (
                          <SelectItem key={e_val} value={e_val}>
                            <div className="flex items-center gap-2">
                              <Badge variant={getEstadoBadgeVariant(e_val) || "secondary"} className="mr-2">
                                {e_val.charAt(0).toUpperCase()}
                              </Badge>
                              {e_val}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors?.estado && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {fieldErrors.estado[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sección de Información Adicional */}
          <Card className="overflow-hidden border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-amber-800 dark:text-amber-200">Información Adicional</CardTitle>
                  <CardDescription>Motivo de la consulta y notas adicionales</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="motivo" className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300">
                    Motivo de la Cita (opcional)
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-500">
                      <Clipboard className="h-4 w-4" />
                    </div>
                    <Textarea
                      id="motivo"
                      name="motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      rows={3}
                      placeholder="Describe el motivo de la consulta..."
                      className="pl-10 border-amber-200 dark:border-amber-800 focus:ring-amber-500"
                    />
                  </div>
                  {fieldErrors?.motivo && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {fieldErrors.motivo[0]}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="notas_cita" className="mb-1.5 block font-medium text-gray-700 dark:text-gray-300">
                    Notas Adicionales (opcional)
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-500">
                      <FileText className="h-4 w-4" />
                    </div>
                    <Textarea
                      id="notas_cita"
                      name="notas_cita"
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      rows={3}
                      placeholder="Añade cualquier información adicional relevante..."
                      className="pl-10 border-amber-200 dark:border-amber-800 focus:ring-amber-500"
                    />
                  </div>
                  {fieldErrors?.notas_cita && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {fieldErrors.notas_cita[0]}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mensajes de Error */}
          {formError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-200">Error al procesar el formulario</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{formError}</p>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isPending || isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1"
            >
              {isPending || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Actualizando Cita..." : "Programando Cita..."}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Programar Cita
                    </>
                  )}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}