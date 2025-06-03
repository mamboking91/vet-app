// app/dashboard/procedimientos/nuevo/ProcedimientoForm.tsx
"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { agregarProcedimiento, actualizarProcedimiento } from "../actions"
import type { ProcedimientoFormData, ImpuestoItemValue } from "../types"
import { impuestoItemOpciones } from "../types"
import {
  Stethoscope,
  FileText,
  Clock,
  Tag,
  Euro,
  Calculator,
  Save,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Activity,
  StickyNote,
} from "lucide-react"

const categoriasProcedimientoOpciones = [
  { value: "Consulta", label: "Consulta" },
  { value: "Cirugía", label: "Cirugía" },
  { value: "Vacunación", label: "Vacunación" },
  { value: "Desparasitación", label: "Desparasitación" },
  { value: "Diagnóstico por Imagen", label: "Diagnóstico por Imagen" },
  { value: "Laboratorio", label: "Laboratorio" },
  { value: "Peluquería", label: "Peluquería" },
  { value: "Dental", label: "Dental" },
  { value: "Otro", label: "Otro" },
] as const
type CategoriaProcedimientoValue = (typeof categoriasProcedimientoOpciones)[number]["value"]

interface ProcedimientoFormProps {
  initialData?: Partial<ProcedimientoFormData>
  procedimientoId?: string
}

type FieldErrors = {
  [key in keyof ProcedimientoFormData]?: string[] | undefined
} & { general?: string }

const DEFAULT_TAX_RATE: ImpuestoItemValue = "0"

export default function ProcedimientoForm({ initialData, procedimientoId }: ProcedimientoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null)
  const [success, setSuccess] = useState(false)

  const isEditMode = Boolean(procedimientoId && initialData)

  const [nombre, setNombre] = useState(initialData?.nombre || "")
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || "")
  const [duracion, setDuracion] = useState(initialData?.duracion_estimada_minutos || "")
  const [categoria, setCategoria] = useState(initialData?.categoria || "")
  const [notasInternas, setNotasInternas] = useState(initialData?.notas_internas || "")

  // Estados para precios e impuestos
  const [precioBaseStr, setPrecioBaseStr] = useState(initialData?.precio || "")
  const [porcentajeImpuestoStr, setPorcentajeImpuestoStr] = useState<ImpuestoItemValue | string>(
    initialData?.porcentaje_impuesto || DEFAULT_TAX_RATE,
  )
  const [precioFinalStr, setPrecioFinalStr] = useState("") // Se calculará o lo introducirá el usuario

  // Para saber qué campo de precio fue el último editado por el usuario
  const [lastPriceInput, setLastPriceInput] = useState<"base" | "final">(initialData?.precio ? "base" : "final")

  // Efecto para inicializar y recalcular precios
  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || "")
      setDescripcion(initialData.descripcion || "")
      setDuracion(initialData.duracion_estimada_minutos || "")
      setCategoria(initialData.categoria || "")
      setNotasInternas(initialData.notas_internas || "")

      const initialBasePrice = initialData.precio || ""
      const initialTax = initialData.porcentaje_impuesto || DEFAULT_TAX_RATE

      setPrecioBaseStr(initialBasePrice)
      setPorcentajeImpuestoStr(initialTax)
      setLastPriceInput("base") // Asumimos que el precio base de initialData es la autoridad

      if (initialBasePrice) {
        const base = Number.parseFloat(initialBasePrice)
        const tax = Number.parseFloat(initialTax as string)
        if (!isNaN(base) && !isNaN(tax)) {
          const final = base * (1 + tax / 100)
          setPrecioFinalStr(final.toFixed(2))
        } else {
          setPrecioFinalStr("")
        }
      } else {
        setPrecioFinalStr("")
      }
    } else {
      // Valores por defecto para un nuevo formulario
      setPrecioBaseStr("")
      setPorcentajeImpuestoStr(DEFAULT_TAX_RATE)
      setPrecioFinalStr("")
      setLastPriceInput("base")
    }
  }, [initialData])

  // Calcular precio final cuando cambia el base o el impuesto
  useEffect(() => {
    if (lastPriceInput === "base") {
      const base = Number.parseFloat(precioBaseStr)
      const tax = Number.parseFloat(porcentajeImpuestoStr as string)
      if (!isNaN(base) && !isNaN(tax)) {
        const final = base * (1 + tax / 100)
        setPrecioFinalStr(final.toFixed(2))
      } else if (precioBaseStr === "" && !isNaN(tax)) {
        setPrecioFinalStr("") // Si el precio base se borra, borrar el final
      }
    }
  }, [precioBaseStr, porcentajeImpuestoStr, lastPriceInput])

  // Calcular precio base cuando cambia el final o el impuesto
  useEffect(() => {
    if (lastPriceInput === "final") {
      const final = Number.parseFloat(precioFinalStr)
      const tax = Number.parseFloat(porcentajeImpuestoStr as string)
      if (!isNaN(final) && !isNaN(tax)) {
        const base = final / (1 + tax / 100)
        setPrecioBaseStr(base.toFixed(2))
      } else if (precioFinalStr === "" && !isNaN(tax)) {
        setPrecioBaseStr("") // Si el precio final se borra, borrar el base
      }
    }
  }, [precioFinalStr, porcentajeImpuestoStr, lastPriceInput])

  const handlePrecioBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrecioBaseStr(e.target.value)
    setLastPriceInput("base")
  }

  const handlePrecioFinalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrecioFinalStr(e.target.value)
    setLastPriceInput("final")
  }

  const handlePorcentajeImpuestoChange = (value: ImpuestoItemValue | string) => {
    setPorcentajeImpuestoStr(value)
    // El useEffect correspondiente recalculará el otro precio
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors(null)

    const formData = new FormData()
    formData.append("nombre", nombre)
    formData.append("descripcion", descripcion)
    formData.append("duracion_estimada_minutos", duracion)
    formData.append("precio", precioBaseStr) // Siempre enviamos el precioBaseStr
    formData.append("categoria", categoria)
    formData.append("porcentaje_impuesto", porcentajeImpuestoStr as string)
    formData.append("notas_internas", notasInternas)

    startTransition(async () => {
      let result
      if (isEditMode && procedimientoId) {
        result = await actualizarProcedimiento(procedimientoId, formData)
      } else {
        result = await agregarProcedimiento(formData)
      }

      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.")
        if (result.error?.errors) setFieldErrors(result.error.errors as FieldErrors)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard/procedimientos")
          router.refresh()
        }, 1500)
      }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-green-100 p-6 mb-6">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Procedimiento {isEditMode ? "actualizado" : "creado"} exitosamente!
              </h2>
              <p className="text-gray-600 text-center">
                El procedimiento ha sido {isEditMode ? "actualizado" : "registrado"} correctamente en el sistema.
              </p>
              <div className="mt-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Arrow Button */}
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200 px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Volver</span>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {isEditMode ? "Editar Procedimiento" : "Nuevo Procedimiento"}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditMode
                  ? "Modifica la información del procedimiento médico"
                  : "Registra un nuevo procedimiento o servicio"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Stethoscope className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  Nombre del Procedimiento *
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
                  placeholder="Ej: Consulta general, Vacunación antirrábica..."
                />
                {fieldErrors?.nombre && <p className="text-xs text-red-500">{fieldErrors.nombre[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Descripción
                </Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                  placeholder="Descripción detallada del procedimiento..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="duracion_estimada_minutos"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4 text-purple-600" />
                    Duración Estimada (minutos)
                  </Label>
                  <Input
                    id="duracion_estimada_minutos"
                    name="duracion_estimada_minutos"
                    type="number"
                    value={duracion}
                    onChange={(e) => setDuracion(e.target.value)}
                    min="0"
                    className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-indigo-600" />
                    Categoría
                  </Label>
                  <Select
                    name="categoria"
                    value={categoria}
                    onValueChange={(value) => setCategoria(value as CategoriaProcedimientoValue | "")}
                  >
                    <SelectTrigger
                      id="categoria"
                      className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                    >
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasProcedimientoOpciones.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Precios */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Euro className="h-5 w-5" />
                Información de Precios
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="precio_base" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Euro className="h-4 w-4 text-green-600" />
                    Precio Base (€ sin IGIC) *
                  </Label>
                  <Input
                    id="precio_base"
                    name="precio"
                    type="number"
                    value={precioBaseStr}
                    onChange={handlePrecioBaseChange}
                    required
                    step="0.01"
                    min="0"
                    className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    placeholder="25.00"
                  />
                  {fieldErrors?.precio && <p className="text-xs text-red-500">{fieldErrors.precio[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="porcentaje_impuesto"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <Calculator className="h-4 w-4 text-amber-600" />% IGIC Aplicable *
                  </Label>
                  <Select
                    name="porcentaje_impuesto"
                    value={porcentajeImpuestoStr}
                    onValueChange={handlePorcentajeImpuestoChange}
                    required
                  >
                    <SelectTrigger
                      id="porcentaje_impuesto"
                      className="h-11 border-gray-300 focus:border-amber-500 focus:ring-amber-500/20"
                    >
                      <SelectValue placeholder="IGIC %" />
                    </SelectTrigger>
                    <SelectContent>
                      {impuestoItemOpciones.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors?.porcentaje_impuesto && (
                    <p className="text-xs text-red-500">{fieldErrors.porcentaje_impuesto[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio_final" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Euro className="h-4 w-4 text-emerald-600" />
                    Precio Final (€ con IGIC)
                  </Label>
                  <Input
                    id="precio_final"
                    type="number"
                    value={precioFinalStr}
                    onChange={handlePrecioFinalChange}
                    step="0.01"
                    min="0"
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
                    placeholder="26.75"
                  />
                  <p className="text-xs text-gray-500">Modifique este campo para calcular el precio base.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas Internas */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <StickyNote className="h-5 w-5" />
                Notas Internas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label htmlFor="notas_internas" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-amber-600" />
                  Notas Internas
                </Label>
                <Textarea
                  id="notas_internas"
                  name="notas_internas"
                  value={notasInternas}
                  onChange={(e) => setNotasInternas(e.target.value)}
                  rows={3}
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200 resize-none"
                  placeholder="Notas internas para el equipo médico..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Mensaje de Error */}
          {formError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-red-800 font-medium">
                      Error al {isEditMode ? "actualizar" : "crear"} procedimiento
                    </h4>
                    <p className="text-red-700 text-sm mt-1">{formError}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de Acción */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 h-12 font-semibold"
                  size="lg"
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {isEditMode ? "Actualizando..." : "Guardando..."}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      {isEditMode ? "Guardar Cambios" : "Guardar Procedimiento"}
                    </div>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isPending}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 px-8 py-3 h-12 font-semibold"
                  size="lg"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Cancelar
                </Button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Los campos marcados con <span className="text-red-500">*</span> son obligatorios
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
