// app/dashboard/pacientes/[pacienteId]/historial/HistorialMedicoTabla.tsx
"use client"
import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { Edit3, Trash2, FileText, AlertTriangle, Stethoscope, Calendar } from "lucide-react"

interface HistorialMedicoTablaProps {
  historial: {
    id: string
    fecha_evento: string
    tipo: string
    descripcion: string
    diagnostico: string | null
    tratamiento_indicado: string | null
    notas_seguimiento: string | null
  }[]
  pacienteId: string
  nombrePaciente: string
}

export default function HistorialMedicoTabla({ historial, pacienteId, nombrePaciente }: HistorialMedicoTablaProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleEliminarEntrada = async (entradaId: string) => {
    setError(null)
    startTransition(async () => {
      // TODO: Implementar la función eliminarEntradaHistorialMedico
      // const result = await eliminarEntradaHistorialMedico(entradaId);
      // if (!result.success) {
      //   setError(result.error?.message || "Ocurrió un error al eliminar la entrada.");
      // } else {
      router.refresh()
      // }
    })
  }

  if (!historial || historial.length === 0) {
    return (
      <div className="border-dashed border-2 border-gray-300 rounded-lg">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-gray-100 p-6 mb-4">
            <Stethoscope className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay entradas en el historial médico</h3>
          <p className="text-gray-500 text-center max-w-md">
            Comienza agregando la primera entrada para registrar la información médica del paciente.
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
            <h4 className="text-red-800 font-medium">Error al eliminar entrada</h4>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Tabla personalizada sin usar los componentes de shadcn/ui Table */}
      <div className="shadow-lg border-0 bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden">
        {/* Encabezados de tabla */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-b-2 border-emerald-200 grid grid-cols-12 gap-4 py-3 px-4">
          <div className="col-span-2 font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Fecha
            </div>
          </div>
          <div className="col-span-2 font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              Tipo
            </div>
          </div>
          <div className="col-span-5 hidden md:block font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Descripción
            </div>
          </div>
          <div className="col-span-3 text-right font-bold text-gray-800">Acciones</div>
        </div>

        {/* Filas de datos */}
        <div>
          {historial.map((entrada, index) => (
            <div
              key={entrada.id}
              className={`
                grid grid-cols-12 gap-4 py-3 px-4
                hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 
                transition-all duration-200 border-b border-gray-100
                ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
              `}
            >
              <div className="col-span-2">{entrada.fecha_evento}</div>
              <div className="col-span-2">{entrada.tipo}</div>
              <div className="col-span-5 hidden md:block">{entrada.descripcion}</div>
              <div className="col-span-3 flex items-center justify-end gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Link href={`/dashboard/pacientes/${pacienteId}/historial/${entrada.id}/editar`}>
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
                        Esta acción <strong>no se puede deshacer</strong>. Se eliminará permanentemente la entrada del
                        historial médico.
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
                        onClick={() => handleEliminarEntrada(entrada.id)}
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
            <Stethoscope className="h-4 w-4" />
            Historial médico completo de {nombrePaciente}
          </div>
        </div>
      </div>
    </div>
  )
}
