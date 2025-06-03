// app/dashboard/propietarios/[propietarioId]/editar/EditarPropietarioForm.tsx
"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { actualizarPropietario } from "../../actions"
import { User, Mail, Phone, MapPin, FileText, Save, ArrowLeft, AlertTriangle, Edit3, CheckCircle } from "lucide-react"

type Propietario = {
  id: string
  nombre_completo: string
  email: string | null
  telefono: string | null
  direccion: string | null
  notas_adicionales: string | null
}

interface EditarPropietarioFormProps {
  propietario: Propietario
}

export default function EditarPropietarioForm({ propietario }: EditarPropietarioFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Estado para los campos del formulario, inicializados con los datos del propietario
  const [nombreCompleto, setNombreCompleto] = useState(propietario.nombre_completo)
  const [email, setEmail] = useState(propietario.email || "")
  const [telefono, setTelefono] = useState(propietario.telefono || "")
  const [direccion, setDireccion] = useState(propietario.direccion || "")
  const [notasAdicionales, setNotasAdicionales] = useState(propietario.notas_adicionales || "")

  // Sincronizar estado si el prop propietario cambia
  useEffect(() => {
    setNombreCompleto(propietario.nombre_completo)
    setEmail(propietario.email || "")
    setTelefono(propietario.telefono || "")
    setDireccion(propietario.direccion || "")
    setNotasAdicionales(propietario.notas_adicionales || "")
  }, [propietario])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    // Crear FormData en lugar de objeto plano
    const formData = new FormData()
    formData.append("nombre_completo", nombreCompleto)
    formData.append("email", email)
    formData.append("telefono", telefono)
    formData.append("direccion", direccion)
    formData.append("notas_adicionales", notasAdicionales)

    startTransition(async () => {
      const result = await actualizarPropietario(propietario.id, formData)
      if (result?.error) {
        setError(result.error.message)
        console.error("Error al actualizar propietario:", result.error.message)
      } else {
        setSuccess(true)
        // Pequeño delay para mostrar el éxito antes de redirigir
        setTimeout(() => {
          router.push("/dashboard/propietarios")
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Propietario actualizado exitosamente!</h2>
              <p className="text-gray-600 text-center">Los cambios han sido guardados correctamente en el sistema.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
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
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <Edit3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Editar Propietario
              </h1>
              <p className="text-gray-600 mt-1">
                Modifica la información de{" "}
                <span className="font-semibold text-gray-800">{propietario.nombre_completo}</span>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombre_completo" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Nombre Completo *
                </Label>
                <Input
                  id="nombre_completo"
                  name="nombre_completo"
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="Ej: Juan Pérez García"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    placeholder="ejemplo@correo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-600" />
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                    placeholder="+34 123 456 789"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="h-5 w-5" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="direccion" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  name="direccion"
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
                  placeholder="Calle, número, ciudad, código postal"
                />
              </div>

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
                  value={notasAdicionales}
                  onChange={(e) => setNotasAdicionales(e.target.value)}
                  rows={4}
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200 resize-none"
                  placeholder="Información adicional sobre el propietario, preferencias, observaciones especiales..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Información del Registro */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>
                    ID del propietario: <span className="font-mono text-gray-800">{propietario.id}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mensaje de Error */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-red-800 font-medium">Error al actualizar propietario</h4>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
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
                  className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 h-12 font-semibold"
                  size="lg"
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Actualizando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      Guardar Cambios
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