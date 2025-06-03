// app/dashboard/pacientes/nuevo/PacienteForm.tsx
"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { agregarPaciente } from "../actions"
import {
  PawPrint,
  Save,
  ArrowLeft,
  AlertTriangle,
  User,
  Calendar,
  Dna,
  Fingerprint,
  Palette,
  FileText,
  CheckCircle,
} from "lucide-react"
import type { PropietarioSimple } from "./page"

interface PacienteFormProps {
  propietarios: PropietarioSimple[]
}

type FieldErrors = {
  [key: string]: string[] | undefined
}

const especiesComunes = [
  { value: "Perro", label: "Perro" },
  { value: "Gato", label: "Gato" },
  { value: "Conejo", label: "Conejo" },
  { value: "Hurón", label: "Hurón" },
  { value: "Ave", label: "Ave (Loro, Canario, etc.)" },
  { value: "Reptil", label: "Reptil (Tortuga, Iguana, etc.)" },
  { value: "Roedor", label: "Pequeño Mamífero (Hámster, Cobaya, Chinchilla)" },
  { value: "Exótico/Otro", label: "Exótico / Otro" },
]

const sexosDisponibles = [
  { value: "Macho", label: "Macho" },
  { value: "Macho Castrado", label: "Macho Castrado" },
  { value: "Hembra", label: "Hembra" },
  { value: "Hembra Esterilizada", label: "Hembra Esterilizada" },
  { value: "Desconocido", label: "Desconocido" },
]

export default function PacienteForm({ propietarios }: PacienteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null)
  const [success, setSuccess] = useState(false)

  const [nombre, setNombre] = useState("")
  const [especie, setEspecie] = useState("")
  const [raza, setRaza] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [sexo, setSexo] = useState("")
  const [microchipId, setMicrochipId] = useState("")
  const [color, setColor] = useState("")
  const [notas, setNotas] = useState("")
  const [propietarioId, setPropietarioId] = useState<string | undefined>(undefined)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await agregarPaciente(formData)
      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.")
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors)
        }
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard/pacientes")
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Paciente creado exitosamente!</h2>
              <p className="text-gray-600 text-center">El paciente ha sido registrado correctamente en el sistema.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-3xl mx-auto">
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
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <PawPrint className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Nuevo Paciente
              </h1>
              <p className="text-gray-600 mt-1">Registra la información de la mascota</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <PawPrint className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <PawPrint className="h-4 w-4 text-purple-600" />
                    Nombre del Paciente *
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                    placeholder="Ej: Luna, Rocky, Simba..."
                  />
                  {fieldErrors?.nombre && <p className="text-xs text-red-500">{fieldErrors.nombre[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propietario_id" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Propietario *
                  </Label>
                  <Select
                    name="propietario_id"
                    required
                    value={propietarioId}
                    onValueChange={(value) => setPropietarioId(value)}
                  >
                    <SelectTrigger
                      id="propietario_id"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                    >
                      <SelectValue placeholder="Selecciona un propietario" />
                    </SelectTrigger>
                    <SelectContent>
                      {propietarios.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors?.propietario_id && (
                    <p className="text-xs text-red-500">{fieldErrors.propietario_id[0]}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="especie" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Dna className="h-4 w-4 text-amber-600" />
                    Especie *
                  </Label>
                  <Select name="especie" required value={especie} onValueChange={setEspecie}>
                    <SelectTrigger
                      id="especie"
                      className="h-11 border-gray-300 focus:border-amber-500 focus:ring-amber-500/20"
                    >
                      <SelectValue placeholder="Selecciona una especie" />
                    </SelectTrigger>
                    <SelectContent>
                      {especiesComunes.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors?.especie && <p className="text-xs text-red-500">{fieldErrors.especie[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="raza" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Dna className="h-4 w-4 text-green-600" />
                    Raza
                  </Label>
                  <Input
                    id="raza"
                    name="raza"
                    value={raza}
                    onChange={(e) => setRaza(e.target.value)}
                    className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    placeholder="Ej: Labrador, Siamés, Angora..."
                  />
                  {fieldErrors?.raza && <p className="text-xs text-red-500">{fieldErrors.raza[0]}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Fingerprint className="h-5 w-5" />
                Características
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="fecha_nacimiento"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Fecha de Nacimiento
                  </Label>
                  <Input
                    id="fecha_nacimiento"
                    name="fecha_nacimiento"
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  {fieldErrors?.fecha_nacimiento && (
                    <p className="text-xs text-red-500">{fieldErrors.fecha_nacimiento[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sexo" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Dna className="h-4 w-4 text-purple-600" />
                    Sexo
                  </Label>
                  <Select name="sexo" value={sexo} onValueChange={setSexo}>
                    <SelectTrigger
                      id="sexo"
                      className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
                    >
                      <SelectValue placeholder="Selecciona el sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      {sexosDisponibles.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors?.sexo && <p className="text-xs text-red-500">{fieldErrors.sexo[0]}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="microchip_id" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-amber-600" />
                    Nº de Microchip
                  </Label>
                  <Input
                    id="microchip_id"
                    name="microchip_id"
                    value={microchipId}
                    onChange={(e) => setMicrochipId(e.target.value)}
                    className="h-11 border-gray-300 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200"
                    placeholder="Ej: 123456789012345"
                  />
                  {fieldErrors?.microchip_id && <p className="text-xs text-red-500">{fieldErrors.microchip_id[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-pink-600" />
                    Color
                  </Label>
                  <Input
                    id="color"
                    name="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-11 border-gray-300 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-200"
                    placeholder="Ej: Negro, Blanco, Atigrado..."
                  />
                  {fieldErrors?.color && <p className="text-xs text-red-500">{fieldErrors.color[0]}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas Adicionales */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5" />
                Notas Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label
                  htmlFor="notas_adicionales"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-amber-600" />
                  Notas Adicionales
                </Label>
                <Textarea
                  id="notas_adicionales"
                  name="notas_adicionales"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={4}
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200 resize-none"
                  placeholder="Información adicional sobre el paciente, alergias, comportamiento, observaciones especiales..."
                />
                {fieldErrors?.notas_adicionales && (
                  <p className="text-xs text-red-500">{fieldErrors.notas_adicionales[0]}</p>
                )}
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
                    <h4 className="text-red-800 font-medium">Error al crear paciente</h4>
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
                  className="bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 h-12 font-semibold"
                  size="lg"
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Guardando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      Guardar Paciente
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
