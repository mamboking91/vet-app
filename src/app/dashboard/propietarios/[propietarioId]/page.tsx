// src/app/dashboard/propietarios/[propietarioId]/page.tsx
import type React from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ChevronLeft,
  Edit3,
  User,
  Mail,
  Phone,
  MapPin,
  Info,
  PawPrint,
  PlusCircle,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Rat,
  Turtle,
  HelpCircle,
  Clock,
  Eye,
  Shield, // <-- Icono para la nueva tarjeta de rol
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import type { PropietarioDetallado } from "../types"
import RoleManagementCard from "./RoleManagementCard" // <-- Importamos el nuevo componente

// Función para determinar el icono de especie
const getEspecieIcon = (especie: string | null): React.ReactNode => {
  if (!especie) return <HelpCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
  const especieLower = especie.toLowerCase()
  if (especieLower.includes("perro")) return <Dog className="h-4 w-4 text-amber-600" />
  if (especieLower.includes("gato")) return <Cat className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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

interface DetallePropietarioPageProps {
  params: {
    propietarioId: string
  }
}

export const dynamic = "force-dynamic"

export default async function DetallePropietarioPage({ params }: DetallePropietarioPageProps) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const { propietarioId } = params

  if (!propietarioId || typeof propietarioId !== "string" || propietarioId.length !== 36) {
    notFound()
  }

  const { data: propietarioData, error: propietarioError } = await supabase
    .from("propietarios")
    .select(`
      id,
      nombre_completo,
      email,
      telefono,
      direccion,
      notas, 
      created_at,
      rol, 
      pacientes (id, nombre, especie, raza)
    `)
    .eq("id", propietarioId)
    .single<PropietarioDetallado>()

  if (propietarioError || !propietarioData) {
    notFound()
  }

  const propietario = propietarioData

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header con navegación */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200 rounded-lg"
            >
              <Link href="/dashboard/propietarios">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1
                className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent truncate"
                title={propietario.nombre_completo}
              >
                {propietario.nombre_completo}
              </h1>
              <p className="text-gray-600 mt-1">Ficha de propietario</p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Link href={`/dashboard/propietarios/${propietarioId}/editar`}>
                <Edit3 className="mr-2 h-4 w-4" />
                Editar Propietario
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Tarjeta de Información del Propietario */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg py-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <User className="h-5 w-5" />
                  Información de Contacto
                </CardTitle>
                <CardDescription className="text-purple-100">Datos personales y de contacto</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {propietario.email && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <Mail className="h-4 w-4 text-purple-600" />
                        Email
                      </div>
                      <a
                        href={`mailto:${propietario.email}`}
                        className="text-purple-700 hover:text-purple-900 hover:underline transition-colors duration-200 flex items-center gap-1"
                      >
                        {propietario.email}
                      </a>
                    </div>
                  )}

                  {propietario.telefono && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <Phone className="h-4 w-4 text-green-600" />
                        Teléfono
                      </div>
                      <a
                        href={`tel:${propietario.telefono}`}
                        className="text-gray-900 hover:text-green-700 transition-colors duration-200 flex items-center gap-1"
                      >
                        {propietario.telefono}
                      </a>
                    </div>
                  )}

                  {propietario.direccion && (
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <MapPin className="h-4 w-4 text-red-600" />
                        Dirección
                      </div>
                      <p className="text-gray-900 whitespace-pre-line">{propietario.direccion}</p>
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Fecha de Registro
                    </div>
                    <p className="text-gray-900">
                      {propietario.created_at
                        ? format(parseISO(propietario.created_at), "PPP p", { locale: es })
                        : "Fecha desconocida"}
                    </p>
                  </div>
                </div>

                {propietario.notas && (
                  <div className="pt-4 mt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                      <Info className="h-4 w-4 text-amber-600" />
                      Notas Adicionales
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <p className="text-gray-800 whitespace-pre-line">{propietario.notas}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1 space-y-8">
              {/* --- NUEVA TARJETA DE GESTIÓN DE ROL --- */}
              <RoleManagementCard propietario={propietario} />
          </div>
        </div>

        {/* Sección de Mascotas */}
        <div className="mt-8">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg py-4">
                <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <PawPrint className="h-5 w-5" />
                    Mascotas Registradas ({propietario.pacientes?.length || 0})
                </CardTitle>
                <Button
                    asChild
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 transition-all duration-200"
                    variant="outline"
                >
                    <Link
                    href={`/dashboard/pacientes/nuevo?propietarioId=${propietario.id}&propietarioNombre=${encodeURIComponent(propietario.nombre_completo)}`}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Paciente
                    </Link>
                </Button>
                </div>
                <CardDescription className="text-emerald-100">
                Listado de mascotas asociadas a este propietario
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                {!propietario.pacientes || propietario.pacientes.length === 0 ? (
                <div className="text-center py-10 px-4">
                    <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <PawPrint className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Sin mascotas registradas</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Este propietario no tiene mascotas asociadas. Puedes añadir una nueva mascota usando el botón
                    superior.
                    </p>
                    <Button
                    asChild
                    className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
                    >
                    <Link
                        href={`/dashboard/pacientes/nuevo?propietarioId=${propietario.id}&propietarioNombre=${encodeURIComponent(propietario.nombre_completo)}`}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Primera Mascota
                    </Link>
                    </Button>
                </div>
                ) : (
                <div className="border rounded-lg overflow-hidden shadow-sm">
                    <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableHead className="font-medium text-gray-600">
                            <div className="flex items-center gap-2">
                            <PawPrint className="h-4 w-4 text-emerald-600" />
                            Nombre
                            </div>
                        </TableHead>
                        <TableHead className="font-medium text-gray-600">
                            <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-purple-600" />
                            Especie
                            </div>
                        </TableHead>
                        <TableHead className="font-medium text-gray-600 hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                            <Dog className="h-4 w-4 text-amber-600" />
                            Raza
                            </div>
                        </TableHead>
                        <TableHead className="text-right font-medium text-gray-600">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {propietario.pacientes.map((paciente) => (
                        <TableRow key={paciente.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                            <TableCell className="font-medium">
                            <Link
                                href={`/dashboard/pacientes/${paciente.id}`}
                                className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors duration-200 flex items-center gap-1"
                            >
                                {paciente.nombre}
                            </Link>
                            </TableCell>
                            <TableCell>
                            <span className="flex items-center gap-2">
                                {getEspecieIcon(paciente.especie)}
                                {paciente.especie || "N/A"}
                            </span>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-gray-600">{paciente.raza || "N/A"}</TableCell>
                            <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                >
                                <Link href={`/dashboard/pacientes/${paciente.id}`} title="Ver detalles">
                                    <Eye className="h-4 w-4" />
                                </Link>
                                </Button>
                                <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8 text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                                >
                                <Link href={`/dashboard/pacientes/${paciente.id}/editar`} title="Editar paciente">
                                    <Edit3 className="h-4 w-4" />
                                </Link>
                                </Button>
                            </div>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                )}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}