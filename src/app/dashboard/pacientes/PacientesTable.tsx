// app/dashboard/pacientes/PacientesTable.tsx
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
import { eliminarPaciente } from "./actions"
import {
  PawPrint,
  Edit3,
  Trash2,
  AlertTriangle,
  Cat,
  Dog,
  Bird,
  Rabbit,
  Rat,
  Turtle,
  HelpCircle,
  User,
  Calendar,
  Dna,
} from "lucide-react"
import type { PacienteConPropietario } from "./types"

interface PacientesTableProps {
  pacientes: PacienteConPropietario[]
}

// Función para determinar el icono de especie
const getEspecieIcon = (especie: string | null): React.ReactElement => {
  if (!especie) return <HelpCircle className="h-4 w-4 text-gray-400" />

  const especieLower = especie.toLowerCase()
  if (especieLower.includes("perro")) return <Dog className="h-4 w-4 text-amber-600" />
  if (especieLower.includes("gato")) return <Cat className="h-4 w-4 text-gray-600" />
  if (
    especieLower.includes("ave") ||
    especieLower.includes("pájaro") ||
    especieLower.includes("loro") ||
    especieLower.includes("canario")
  )
    return <Bird className="h-4 w-4 text-blue-600" />
  if (especieLower.includes("conejo")) return <Rabbit className="h-4 w-4 text-pink-600" />
  if (
    especieLower.includes("roedor") ||
    especieLower.includes("hámster") ||
    especieLower.includes("cobaya") ||
    especieLower.includes("rata")
  )
    return <Rat className="h-4 w-4 text-orange-600" />
  if (especieLower.includes("reptil") || especieLower.includes("tortuga") || especieLower.includes("iguana"))
    return <Turtle className="h-4 w-4 text-green-600" />

  return <PawPrint className="h-4 w-4 text-purple-600" />
}

// Función para obtener clases de color para el Badge de especie
const getEspecieBadgeClasses = (especie: string | null): string => {
  if (!especie) return "bg-gray-100 text-gray-700 border-gray-300"

  const especieLower = especie.toLowerCase()
  if (especieLower.includes("perro")) return "bg-amber-100 text-amber-700 border-amber-300"
  if (especieLower.includes("gato")) return "bg-gray-100 text-gray-700 border-gray-300"
  if (
    especieLower.includes("ave") ||
    especieLower.includes("pájaro") ||
    especieLower.includes("loro") ||
    especieLower.includes("canario")
  )
    return "bg-blue-100 text-blue-700 border-blue-300"
  if (especieLower.includes("conejo")) return "bg-pink-100 text-pink-700 border-pink-300"
  if (
    especieLower.includes("roedor") ||
    especieLower.includes("hámster") ||
    especieLower.includes("cobaya") ||
    especieLower.includes("rata")
  )
    return "bg-orange-100 text-orange-700 border-orange-300"
  if (especieLower.includes("reptil") || especieLower.includes("tortuga") || especieLower.includes("iguana"))
    return "bg-green-100 text-green-700 border-green-300"

  return "bg-purple-100 text-purple-700 border-purple-300"
}

export default function PacientesTable({ pacientes }: PacientesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleEliminarConfirmado = async (pacienteId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await eliminarPaciente(pacienteId)
      if (!result.success) {
        console.error("Error al eliminar paciente:", result.error?.message)
        setError(result.error?.message || "Ocurrió un error al eliminar el paciente.")
      } else {
        router.refresh()
      }
    })
  }

  if (!pacientes || pacientes.length === 0) {
    return (
      <div className="border-dashed border-2 border-gray-300 rounded-lg">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-gray-100 p-6 mb-4">
            <PawPrint className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pacientes registrados</h3>
          <p className="text-gray-500 text-center max-w-md">
            Comienza agregando el primer paciente para gestionar la información de las mascotas.
          </p>
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
            <h4 className="text-red-800 font-medium">Error al eliminar paciente</h4>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Tabla personalizada usando la misma estructura que propietarios-table */}
      <div className="shadow-lg border-0 bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden">
        {/* Encabezados de tabla */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-b-2 border-purple-200 grid grid-cols-12 gap-4 py-3 px-4">
          <div className="col-span-3 font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <PawPrint className="h-4 w-4 text-purple-600" />
              Paciente
            </div>
          </div>
          <div className="col-span-2 font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <Dna className="h-4 w-4 text-amber-600" />
              Especie
            </div>
          </div>
          <div className="col-span-2 hidden md:block font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Raza
            </div>
          </div>
          <div className="col-span-3 font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              Propietario
            </div>
          </div>
          <div className="col-span-2 text-right font-bold text-gray-800">Acciones</div>
        </div>

        {/* Filas de datos */}
        <div>
          {pacientes.map((paciente, index) => (
            <div
              key={paciente.id}
              className={`
                grid grid-cols-12 gap-4 py-3 px-4
                hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 
                transition-all duration-200 border-b border-gray-100
                ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
              `}
            >
              <div className="col-span-3">
                <Link
                  href={`/dashboard/pacientes/${paciente.id}`}
                  className="flex items-center gap-3 hover:text-purple-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {paciente.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{paciente.nombre}</div>
                    <div className="text-xs text-gray-500">ID: {paciente.id.slice(0, 8)}...</div>
                  </div>
                </Link>
              </div>

              <div className="col-span-2 flex items-center">
                {paciente.especie ? (
                  <Badge variant="outline" className={`px-2 py-1 ${getEspecieBadgeClasses(paciente.especie)}`}>
                    <span className="flex items-center gap-1.5">
                      {getEspecieIcon(paciente.especie)}
                      {paciente.especie}
                    </span>
                  </Badge>
                ) : (
                  <span className="text-gray-400 italic">No especificado</span>
                )}
              </div>

              <div className="col-span-2 hidden md:flex items-center">
                {paciente.raza ? (
                  <span className="text-gray-700">{paciente.raza}</span>
                ) : (
                  <span className="text-gray-400 italic">No especificado</span>
                )}
              </div>

              <div className="col-span-3 flex items-center">
                {paciente.propietarios ? (
                  <Link
                    href={`/dashboard/propietarios/${paciente.propietarios.id}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-3 w-3 text-blue-600" />
                    </div>
                    <span>{paciente.propietarios.nombre_completo || "Nombre no disponible"}</span>
                  </Link>
                ) : (
                  <span className="text-gray-400 italic">Sin propietario</span>
                )}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 bg-white hover:bg-purple-50 border-purple-200 text-purple-700 hover:text-purple-800 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Link href={`/dashboard/pacientes/${paciente.id}/editar`}>
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
                        Esta acción <strong>no se puede deshacer</strong>. Se eliminará permanentemente al paciente{" "}
                        <span className="font-semibold text-gray-900">"{paciente.nombre}"</span> y todos sus datos
                        asociados.
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2 text-amber-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">
                              Los datos del historial médico también podrían eliminarse si la base de datos está
                              configurada para borrado en cascada.
                            </span>
                          </div>
                        </div>
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
                        onClick={() => handleEliminarConfirmado(paciente.id)}
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
          ))}
        </div>

        {/* Pie de tabla */}
        <div className="py-6 text-gray-600 bg-gray-50/50 text-center">
          <div className="flex items-center justify-center gap-2">
            <PawPrint className="h-4 w-4" />
            Lista completa de pacientes registrados en la clínica
          </div>
        </div>
      </div>
    </div>
  )
}
