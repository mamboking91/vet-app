// app/dashboard/propietarios/nuevo/PropietarioForm.tsx
"use client";

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { agregarPropietario, actualizarPropietario } from '../actions'; // Ajusta la ruta si es necesario
import type { PropietarioFormData } from '../types'; // Ajusta la ruta si es necesario
import { User, Mail, Phone, MapPin, FileText, Save, ArrowLeft, AlertTriangle, CheckCircle, UserPlus, Edit3 } from "lucide-react";

interface PropietarioFormProps {
  initialData?: Partial<PropietarioFormData>;
  propietarioId?: string;
}

type FieldErrors = {
  [key in keyof PropietarioFormData]?: string[] | undefined;
} & { general?: string };

export default function PropietarioForm({ initialData, propietarioId }: PropietarioFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isEditMode = Boolean(propietarioId && initialData);
  const formRef = useRef<HTMLFormElement>(null);

  // Estados para los campos del formulario
  const [nombreCompleto, setNombreCompleto] = useState(initialData?.nombre_completo || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [telefono, setTelefono] = useState(initialData?.telefono || '');
  const [direccion, setDireccion] = useState(initialData?.direccion || '');
  const [notas, setNotas] = useState(initialData?.notas || ''); // Usamos 'notas'

  useEffect(() => {
    if (initialData) {
      setNombreCompleto(initialData.nombre_completo || '');
      setEmail(initialData.email || '');
      setTelefono(initialData.telefono || '');
      setDireccion(initialData.direccion || '');
      setNotas(initialData.notas || ''); // Usamos 'notas'
    } else {
      // Resetear para nuevo formulario si initialData es undefined (ej. al navegar de editar a nuevo)
      setNombreCompleto(''); setEmail(''); setTelefono('');
      setDireccion(''); setNotas('');
    }
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setFormError(null);
    setFieldErrors(null);
    setSuccessMessage(null);

    startTransition(async () => {
      let result;
      if (isEditMode && propietarioId) {
        result = await actualizarPropietario(propietarioId, formData);
      } else {
        result = await agregarPropietario(formData);
      }

      if (result.error) {
        setFormError(result.error.message || "Ocurrió un error desconocido.");
        if (result.error.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
        console.error("Error al guardar propietario:", result.error.message, result.error.errors);
      } else {
        setSuccessMessage(result.message || (isEditMode ? "Propietario actualizado." : "Propietario añadido."));
        if (!isEditMode && formRef.current) {
          formRef.current.reset(); // Limpiar formulario en modo creación
          setNombreCompleto(''); setEmail(''); setTelefono('');
          setDireccion(''); setNotas('');
        }
        router.refresh(); // Refresca los datos de la página de listado
        // Opcional: redirigir después de un delay
        // setTimeout(() => {
        //   router.push("/dashboard/propietarios");
        // }, 1500);
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-white/90 backdrop-blur-sm dark:bg-slate-900/90 dark:border-slate-700">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700/50 rounded-t-lg py-5 px-6">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800 dark:text-gray-100">
          {isEditMode ? <Edit3 className="h-6 w-6 text-primary" /> : <UserPlus className="h-6 w-6 text-primary" />}
          {isEditMode ? "Editar Datos del Propietario" : "Añadir Nuevo Propietario"}
        </CardTitle>
        <CardDescription className="dark:text-slate-400">
          {isEditMode 
            ? "Modifica la información del propietario." 
            : "Completa los detalles para registrar un nuevo propietario."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} ref={formRef}>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nombre_completo" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Nombre Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre_completo"
              name="nombre_completo"
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              required
              className="h-10 border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-primary focus:ring-primary/30"
              placeholder="Ej: Juan Pérez García"
            />
            {fieldErrors?.nombre_completo && <p className="text-sm text-red-500 mt-1">{fieldErrors.nombre_completo[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-600" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-green-500 focus:ring-green-500/30"
                placeholder="ejemplo@correo.com"
              />
              {fieldErrors?.email && <p className="text-sm text-red-500 mt-1">{fieldErrors.email[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Phone className="h-4 w-4 text-purple-600" />
                Teléfono
              </Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="h-10 border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-purple-500 focus:ring-purple-500/30"
                placeholder="+34 123 456 789"
              />
              {fieldErrors?.telefono && <p className="text-sm text-red-500 mt-1">{fieldErrors.telefono[0]}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Dirección
            </Label>
            <Textarea
              id="direccion"
              name="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              rows={3}
              className="border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-emerald-500 focus:ring-emerald-500/30 resize-none"
              placeholder="Calle, número, ciudad, código postal"
            />
            {fieldErrors?.direccion && <p className="text-sm text-red-500 mt-1">{fieldErrors.direccion[0]}</p>}
          </div>
          
          {/* Campo DNI/CIF eliminado */}

          <div className="space-y-2">
            <Label htmlFor="notas" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600" />
              Notas Adicionales
            </Label>
            <Textarea
              id="notas"
              name="notas" // Nombre del campo corregido a 'notas'
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              className="border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:border-amber-500 focus:ring-amber-500/30 resize-none"
              placeholder="Información adicional sobre el propietario..."
            />
            {fieldErrors?.notas && <p className="text-sm text-red-500 mt-1">{fieldErrors.notas[0]}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-y-3 pt-6 px-6 pb-6">
          {formError && (
            <div className="w-full text-sm text-red-700 dark:text-red-300 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {formError}
            </div>
          )}
          {successMessage && (
            <div className="w-full text-sm text-green-700 dark:text-green-300 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMessage}
            </div>
          )}
          <div className="flex w-full items-center justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending} className="dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80">
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isEditMode ? "Actualizando..." : "Guardando..."}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isEditMode ? "Guardar Cambios" : "Guardar Propietario"}
                </div>
              )}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}