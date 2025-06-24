// src/app/dashboard/propietarios/PropietariosTable.tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { eliminarPropietario } from "./actions"
import { Eye, Edit3, Trash2, User, Mail, Phone, PawPrint, AlertTriangle, Users } from "lucide-react"

// Tipo importado desde page.tsx
interface PropietarioConMascotas {
  id: string
  nombre_completo: string
  email?: string | null
  telefono?: string | null
  pacientes_count: number
}

interface PropietariosTableProps {
  propietarios: PropietarioConMascotas[]
}

export default function PropietariosTable({ propietarios }: PropietariosTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleEliminar = async (propietarioId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await eliminarPropietario(propietarioId)
      if (result?.error) {
        setError(result.error.message)
        console.error("Error al eliminar propietario:", result.error.message)
      } else {
        router.refresh()
      }
    })
  }

  if (!propietarios || propietarios.length === 0) {
    return (
      <div className="border-dashed border-2 border-gray-300 rounded-lg">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-gray-100 p-6 mb-4">
            <Users className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay propietarios registrados</h3>
          <p className="text-gray-500 text-center max-w-md">
            Comienza agregando el primer propietario para gestionar la información de las mascotas.
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
            <h4 className="text-red-800 font-medium">Error al eliminar propietario</h4>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Tabla personalizada sin usar los componentes de shadcn/ui Table */}
      <div className="shadow-lg border-0 bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden">
        {/* Encabezados de tabla */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-b-2 border-blue-200 grid grid-cols-12 gap-4 py-3 px-4">
          <div className="col-span-3 font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Propietario
            </div>
          </div>
          <div className="col-span-3 hidden sm:block font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-600" />
              Email
            </div>
          </div>
          <div className="col-span-2 hidden md:block font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-purple-600" />
              Teléfono
            </div>
          </div>
          <div className="col-span-2 font-bold text-gray-800 text-center">
            <div className="flex items-center justify-center gap-2">
              <PawPrint className="h-4 w-4 text-orange-600" />
              Mascotas
            </div>
          </div>
          <div className="col-span-2 text-right font-bold text-gray-800">Acciones</div>
        </div>

        {/* Filas de datos */}
        <div>
          {propietarios.map((propietario, index) => (
            <div
              key={propietario.id}
              className={`
                grid grid-cols-12 gap-4 py-3 px-4
                hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 
                transition-all duration-200 border-b border-gray-100
                ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
              `}
            >
              <div className="col-span-3">
                {/* --- INICIO DE LA CORRECCIÓN --- */}
                <Link
                  href={`/dashboard/propietarios/${propietario.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md flex-shrink-0">
                    {propietario.nombre_completo.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-blue-700 group-hover:underline transition-colors">
                      {propietario.nombre_completo}
                    </div>
                    <div className="text-xs text-gray-500">ID: {propietario.id.slice(0, 8)}...</div>
                  </div>
                </Link>
                {/* --- FIN DE LA CORRECCIÓN --- */}
              </div>

              <div className="col-span-3 hidden sm:flex items-center">
                {propietario.email ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">{propietario.email}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-400 italic">No registrado</span>
                  </div>
                )}
              </div>

              <div className="col-span-2 hidden md:flex items-center">
                {propietario.telefono ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-700 font-mono text-sm">{propietario.telefono}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-400 italic">No registrado</span>
                  </div>
                )}
              </div>

              <div className="col-span-2 flex items-center justify-center">
                {propietario.pacientes_count > 0 ? (
                  <Link
                    href={`/dashboard/pacientes?propietarioId=${propietario.id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 text-orange-700 hover:text-orange-800 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                    title={`Ver ${propietario.pacientes_count} mascota(s) de ${propietario.nombre_completo}`}
                  >
                    <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">
                      {propietario.pacientes_count}
                    </Badge>
                    <Eye className="h-4 w-4" />
                  </Link>
                ) : (
                  <Badge variant="outline" className="text-gray-500 border-gray-300">
                    0
                  </Badge>
                )}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Link href={`/dashboard/propietarios/${propietario.id}/editar`}>
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
                        Esta acción <strong>no se puede deshacer</strong>. Se eliminará permanentemente al propietario{" "}
                        <span className="font-semibold text-gray-900">"{propietario.nombre_completo}"</span> y todos sus
                        datos asociados.
                        {propietario.pacientes_count > 0 && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 text-amber-800">
                              <PawPrint className="h-4 w-4" />
                              <span className="font-medium">
                                Atención: Este propietario tiene {propietario.pacientes_count} mascota(s) registrada(s)
                              </span>
                            </div>
                          </div>
                        )}
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
                        onClick={() => handleEliminar(propietario.id)}
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
            <Users className="h-4 w-4" />
            Lista completa de propietarios registrados en el sistema
          </div>
        </div>
      </div>
    </div>
  )
}