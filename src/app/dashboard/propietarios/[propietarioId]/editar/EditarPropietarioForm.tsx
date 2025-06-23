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
// --- CORRECCIÓN: Importamos el tipo Propietario desde el archivo central de tipos ---
import type { Propietario } from '../../types';

interface EditarPropietarioFormProps {
  propietario: Propietario;
}

export default function EditarPropietarioForm({ propietario }: EditarPropietarioFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estados para todos los campos del formulario, incluyendo los desglosados
  const [nombreCompleto, setNombreCompleto] = useState(propietario.nombre_completo);
  const [email, setEmail] = useState(propietario.email || "");
  const [telefono, setTelefono] = useState(propietario.telefono || "");
  const [direccion, setDireccion] = useState(propietario.direccion || "");
  const [localidad, setLocalidad] = useState(propietario.localidad || "");
  const [provincia, setProvincia] = useState(propietario.provincia || "");
  const [codigoPostal, setCodigoPostal] = useState(propietario.codigo_postal || "");
  const [notas, setNotas] = useState(propietario.notas || "");

  // Sincronizar estado si el prop 'propietario' cambia
  useEffect(() => {
    setNombreCompleto(propietario.nombre_completo);
    setEmail(propietario.email || "");
    setTelefono(propietario.telefono || "");
    setDireccion(propietario.direccion || "");
    setLocalidad(propietario.localidad || "");
    setProvincia(propietario.provincia || "");
    setCodigoPostal(propietario.codigo_postal || "");
    setNotas(propietario.notas || "");
  }, [propietario]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    // Crear FormData para la server action
    const formData = new FormData();
    formData.append("nombre_completo", nombreCompleto);
    formData.append("email", email);
    formData.append("telefono", telefono);
    formData.append("direccion", direccion);
    formData.append("localidad", localidad);
    formData.append("provincia", provincia);
    formData.append("codigo_postal", codigoPostal);
    formData.append("notas", notas);

    startTransition(async () => {
      const result = await actualizarPropietario(propietario.id, formData);
      if (result?.error) {
        setError(result.error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/propietarios");
          router.refresh();
        }, 1500);
      }
    });
  };

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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Botón Volver */}
        <div className="mb-6">
          <Button type="button" variant="ghost" onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Volver</span>
          </Button>
        </div>

        {/* Encabezado */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg">
              <Edit3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Editar Propietario
              </h1>
              <p className="text-gray-600 mt-1">Modifica la información de <span className="font-semibold text-gray-800">{propietario.nombre_completo}</span></p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <Card className="shadow-lg border-0 bg-white/90">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold"><User className="h-5 w-5" />Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                <Input id="nombre_completo" name="nombre_completo" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required className="h-11" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" name="telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="h-11" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto Actualizada */}
          <Card className="shadow-lg border-0 bg-white/90">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5" />Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="direccion">Calle y Número</Label>
                <Input id="direccion" name="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="h-11" placeholder="Ej: C/ Mayor, 24, 3ºB" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="localidad">Localidad</Label>
                  <Input id="localidad" name="localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} placeholder="Ej: San Sebastián" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input id="provincia" name="provincia" value={provincia} onChange={(e) => setProvincia(e.target.value)} placeholder="Ej: Santa Cruz de Tenerife" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo_postal">Código Postal</Label>
                  <Input id="codigo_postal" name="codigo_postal" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} placeholder="Ej: 38800" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notas">Notas Adicionales</Label>
                <Textarea id="notas" name="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={4} className="resize-none" placeholder="Información adicional..." />
              </div>
            </CardContent>
          </Card>
          
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4"><div className="flex items-start gap-3"><AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" /><p className="text-red-700 text-sm mt-1">{error}</p></div></CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-0 bg-white/90">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button type="submit" disabled={isPending} size="lg" className="bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg">
                  {isPending ? (<div className="flex items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>Actualizando...</div>) : (<div className="flex items-center gap-2"><Save className="h-5 w-5" />Guardar Cambios</div>)}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending} size="lg">
                  <ArrowLeft className="h-5 w-5 mr-2" />Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}