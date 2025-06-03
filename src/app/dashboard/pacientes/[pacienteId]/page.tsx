import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChevronLeft,
  PlusCircle,
  PawPrint,
  Edit3,
  User,
  Calendar,
  Dna,
  Fingerprint,
  Palette,
  FileText,
  Heart,
  Stethoscope,
  Activity,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import HistorialMedicoTabla from "./historial/HistorialMedicoTabla"

// Tipos
type PacienteDetalle = {
  id: string
  nombre: string
  especie: string | null
  raza: string | null
  fecha_nacimiento: string | null
  sexo: string | null
  microchip_id: string | null
  color: string | null
  notas_adicionales: string | null
  propietarios: {
    id: string
    nombre_completo: string | null
  } | null
}

type HistorialMedicoEntrada = {
  id: string
  fecha_evento: string
  tipo: string
  descripcion: string
  diagnostico: string | null
  tratamiento_indicado: string | null
  notas_seguimiento: string | null
}

interface DetallePacientePageProps {
  params: {
    pacienteId: string
  }
}

export const dynamic = "force-dynamic"

export default async function DetallePacientePage({ params }: DetallePacientePageProps) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const { pacienteId } = params

  // Obtener datos del paciente
  const { data: pacienteData, error: pacienteError } = await supabase
    .from("pacientes")
    .select(`*, propietarios (id, nombre_completo)`)
    .eq("id", pacienteId)
    .single()

  if (pacienteError || !pacienteData) {
    console.error("DetallePacientePage: Error fetching paciente details or paciente not found:", pacienteError)
    notFound()
  }
  const paciente = pacienteData as PacienteDetalle

  // Obtener el historial médico del paciente
  const { data: historialData, error: historialError } = await supabase
    .from("historiales_medicos")
    .select("id, fecha_evento, tipo, descripcion, diagnostico, tratamiento_indicado, notas_seguimiento")
    .eq("paciente_id", pacienteId)
    .order("fecha_evento", { ascending: false })

  const historial = (historialData || []) as HistorialMedicoEntrada[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header con navegación */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200 rounded-lg"
            >
              <Link href="/dashboard/pacientes">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <PawPrint className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {paciente.nombre}
              </h1>
              <p className="text-gray-600 mt-1">Información completa del paciente</p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Link href={`/dashboard/pacientes/${pacienteId}/editar`}>
                <Edit3 className="mr-2 h-4 w-4" />
                Editar Paciente
              </Link>
            </Button>
          </div>
        </div>

        {/* Tarjeta de Información del Paciente */}
        <Card className="mb-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg py-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <PawPrint className="h-5 w-5" />
              Información del Paciente
            </CardTitle>
            {paciente.propietarios?.nombre_completo && (
              <CardDescription className="text-purple-100">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Propietario:
                  <Link
                    href={`/dashboard/propietarios/${paciente.propietarios.id}/editar`}
                    className="text-white hover:text-purple-200 underline ml-1 transition-colors"
                  >
                    {paciente.propietarios.nombre_completo}
                  </Link>
                </div>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Dna className="h-4 w-4 text-amber-600" />
                  Especie
                </div>
                <p className="text-gray-900">{paciente.especie || "No especificada"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Dna className="h-4 w-4 text-green-600" />
                  Raza
                </div>
                <p className="text-gray-900">{paciente.raza || "No especificada"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Fecha de Nacimiento
                </div>
                <p className="text-gray-900">
                  {paciente.fecha_nacimiento
                    ? format(new Date(paciente.fecha_nacimiento), "PPP", { locale: es })
                    : "No registrada"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Heart className="h-4 w-4 text-pink-600" />
                  Sexo
                </div>
                <p className="text-gray-900">{paciente.sexo || "No especificado"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Fingerprint className="h-4 w-4 text-indigo-600" />
                  Microchip
                </div>
                <p className="text-gray-900 font-mono text-sm">{paciente.microchip_id || "No registrado"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Palette className="h-4 w-4 text-orange-600" />
                  Color
                </div>
                <p className="text-gray-900">{paciente.color || "No especificado"}</p>
              </div>

              {paciente.notas_adicionales && (
                <div className="md:col-span-2 lg:col-span-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <FileText className="h-4 w-4 text-amber-600" />
                    Notas Adicionales
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-gray-900">{paciente.notas_adicionales}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sección de Historial Médico */}
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg py-4">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Stethoscope className="h-5 w-5" />
                Historial Médico
              </CardTitle>
              <Button
                asChild
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 transition-all duration-200"
                variant="outline"
              >
                <Link href={`/dashboard/pacientes/${pacienteId}/historial/nuevo`}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Entrada
                </Link>
              </Button>
            </div>
            <CardDescription className="text-emerald-100">
              Registro completo de consultas, tratamientos y seguimientos médicos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {historialError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <Activity className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-800 font-medium">Error al cargar el historial médico</h4>
                  <p className="text-red-700 text-sm mt-1">{historialError.message}</p>
                </div>
              </div>
            )}

            {/* Usamos el componente cliente para la tabla del historial */}
            <HistorialMedicoTabla historial={historial} pacienteId={paciente.id} nombrePaciente={paciente.nombre} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
