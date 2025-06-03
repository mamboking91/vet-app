// app/dashboard/procedimientos/ProcedimientosTable.tsx
"use client"

import type React from "react"
import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Edit3,
  Trash2,
  PlusCircle,
  AlertTriangle,
  Stethoscope,
  Clock,
  Euro,
  Calculator,
  Activity,
  Scissors,
  Syringe,
  Camera,
  TestTube,
  Zap,
  Heart,
  HelpCircle,
} from "lucide-react"
import type { Procedimiento } from "./types"
import { eliminarProcedimiento } from "./actions"

interface ProcedimientosTableProps {
  procedimientos: Procedimiento[]
}

const formatCurrency = (amount: number | null | undefined): string => {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "-"
  }
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

// Función para obtener el icono según la categoría
const getCategoriaIcon = (categoria: string | null): React.ReactElement => {
  if (!categoria) return <HelpCircle className="h-4 w-4 text-gray-400" />

  const categoriaLower = categoria.toLowerCase()
  if (categoriaLower.includes("consulta")) return <Stethoscope className="h-4 w-4 text-blue-600" />
  if (categoriaLower.includes("cirugía")) return <Scissors className="h-4 w-4 text-red-600" />
  if (categoriaLower.includes("vacunación")) return <Syringe className="h-4 w-4 text-green-600" />
  if (categoriaLower.includes("desparasitación")) return <Zap className="h-4 w-4 text-yellow-600" />
  if (categoriaLower.includes("diagnóstico") || categoriaLower.includes("imagen"))
    return <Camera className="h-4 w-4 text-purple-600" />
  if (categoriaLower.includes("laboratorio")) return <TestTube className="h-4 w-4 text-indigo-600" />
  if (categoriaLower.includes("peluquería")) return <Scissors className="h-4 w-4 text-pink-600" />
  if (categoriaLower.includes("dental")) return <Heart className="h-4 w-4 text-teal-600" />

  return <Activity className="h-4 w-4 text-gray-600" />
}

// Función para obtener clases de color para badges de categoría
const getCategoriaBadgeClasses = (categoria: string | null): string => {
  if (!categoria) return "bg-gray-100 text-gray-700 border-gray-300"

  const categoriaLower = categoria.toLowerCase()
  if (categoriaLower.includes("consulta")) return "bg-blue-100 text-blue-700 border-blue-300"
  if (categoriaLower.includes("cirugía")) return "bg-red-100 text-red-700 border-red-300"
  if (categoriaLower.includes("vacunación")) return "bg-green-100 text-green-700 border-green-300"
  if (categoriaLower.includes("desparasitación")) return "bg-yellow-100 text-yellow-700 border-yellow-300"
  if (categoriaLower.includes("diagnóstico") || categoriaLower.includes("imagen"))
    return "bg-purple-100 text-purple-700 border-purple-300"
  if (categoriaLower.includes("laboratorio")) return "bg-indigo-100 text-indigo-700 border-indigo-300"
  if (categoriaLower.includes("peluquería")) return "bg-pink-100 text-pink-700 border-pink-300"
  if (categoriaLower.includes("dental")) return "bg-teal-100 text-teal-700 border-teal-300"

  return "bg-gray-100 text-gray-700 border-gray-300"
}

export default function ProcedimientosTable({ procedimientos }: ProcedimientosTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleEliminarConfirmado = async (procedimientoId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await eliminarProcedimiento(procedimientoId)
      if (!result.success) {
        setError(result.error?.message || "Ocurrió un error al eliminar el procedimiento.")
        console.error("Error al eliminar procedimiento (cliente):", result.error)
      } else {
        router.refresh()
      }
    })
  }

  if (!procedimientos || procedimientos.length === 0) {
    return (
      <div className="border-dashed border-2 border-gray-300 rounded-lg">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 p-6 mb-6">
            <Stethoscope className="h-12 w-12 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No hay procedimientos registrados</h3>
          <p className="text-gray-600 text-center max-w-md mb-6 leading-relaxed">
            Comienza agregando el primer procedimiento para gestionar los servicios de la clínica.
          </p>
          <Button
            asChild
            className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
          >
            <Link href="/dashboard/procedimientos/nuevo">
              <PlusCircle className="mr-2 h-5 w-5" />
              Añadir Primer Procedimiento
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-red-800 font-medium">Error al eliminar procedimiento</h4>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Tabla personalizada usando grid */}
      <div className="shadow-lg border-0 bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden">
        {/* Encabezados de tabla */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-b-2 border-emerald-200 grid grid-cols-12 gap-6 py-4 px-6">
          <div className="col-span-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <Stethoscope className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800">Procedimiento</span>
            </div>
          </div>
          <div className="col-span-2 hidden md:block text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800">Duración</span>
            </div>
          </div>
          <div className="col-span-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Euro className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800">Precio Base</span>
            </div>
          </div>
          <div className="col-span-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <Calculator className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800">% IGIC</span>
            </div>
          </div>
          <div className="col-span-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Euro className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800">Precio Final</span>
            </div>
          </div>
          <div className="col-span-2 text-center">
            <span className="text-sm font-medium text-gray-800">Acciones</span>
          </div>
        </div>

        {/* Filas de datos */}
        <div>
          {procedimientos.map((procedimiento, index) => {
            const precioBase = procedimiento.precio
            const impuesto = procedimiento.porcentaje_impuesto
            const montoImpuesto = precioBase * (impuesto / 100)
            const precioFinal = precioBase + montoImpuesto

            return (
              <div
                key={procedimiento.id}
                className={`
                  grid grid-cols-12 gap-6 py-4 px-6
                  hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 
                  transition-all duration-200 border-b border-gray-100
                  ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
                `}
              >
                <div className="col-span-3 flex items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {procedimiento.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 truncate">{procedimiento.nombre}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-xs text-gray-500">ID: {procedimiento.id.slice(0, 8)}...</div>
                        {procedimiento.categoria && (
                          <Badge
                            variant="outline"
                            className={`px-2 py-0.5 text-xs ${getCategoriaBadgeClasses(procedimiento.categoria)}`}
                          >
                            <span className="flex items-center gap-1">
                              {getCategoriaIcon(procedimiento.categoria)}
                              {procedimiento.categoria}
                            </span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 hidden md:flex items-center justify-center">
                  {procedimiento.duracion_estimada_minutos ? (
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                      <Clock className="h-3 w-3 mr-1" />
                      {procedimiento.duracion_estimada_minutos}m
                    </Badge>
                  ) : (
                    <span className="text-gray-400 italic text-sm">-</span>
                  )}
                </div>

                <div className="col-span-2 flex items-center justify-center">
                  <span className="font-semibold text-gray-900">{formatCurrency(precioBase)}</span>
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                    {impuesto}%
                  </Badge>
                </div>

                <div className="col-span-2 flex items-center justify-center">
                  <span className="font-bold text-emerald-700">{formatCurrency(precioFinal)}</span>
                </div>

                <div className="col-span-2 flex items-center justify-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700 hover:text-emerald-800 hover:border-emerald-300 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Link href={`/dashboard/procedimientos/${procedimiento.id}/editar`}>
                      <Edit3 className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        className="h-9 px-3 bg-white hover:bg-red-50 border-red-200 text-red-700 hover:text-red-800 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                              Confirmar eliminación
                            </AlertDialogTitle>
                          </div>
                        </div>
                        <AlertDialogDescription className="text-gray-600 leading-relaxed">
                          Esta acción <strong>no se puede deshacer</strong>. Se eliminará permanentemente el
                          procedimiento <span className="font-semibold text-gray-900">"{procedimiento.nombre}"</span>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                          disabled={isPending}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                        >
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleEliminarConfirmado(procedimiento.id)}
                          disabled={isPending}
                          className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          {isPending ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Eliminando...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              Sí, eliminar
                            </div>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pie de tabla */}
        <div className="py-6 text-gray-600 bg-gray-50/50 text-center">
          <div className="flex items-center justify-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Catálogo de procedimientos y servicios ofrecidos
          </div>
        </div>
      </div>
    </div>
  )
}
