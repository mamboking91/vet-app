// app/dashboard/propietarios/nuevo/PropietarioForm.tsx
"use client";

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { agregarPropietario, actualizarPropietario } from '../actions';
import type { PropietarioFormData } from '../types';
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

  // Estados para los campos del formulario, incluyendo la dirección desglosada
  const [nombreCompleto, setNombreCompleto] = useState(initialData?.nombre_completo || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [telefono, setTelefono] = useState(initialData?.telefono || '');
  const [direccion, setDireccion] = useState(initialData?.direccion || '');
  const [localidad, setLocalidad] = useState(initialData?.localidad || '');
  const [provincia, setProvincia] = useState(initialData?.provincia || '');
  const [codigoPostal, setCodigoPostal] = useState(initialData?.codigo_postal || '');
  const [notas, setNotas] = useState(initialData?.notas || '');

  useEffect(() => {
    if (initialData) {
      setNombreCompleto(initialData.nombre_completo || '');
      setEmail(initialData.email || '');
      setTelefono(initialData.telefono || '');
      setDireccion(initialData.direccion || '');
      setLocalidad(initialData.localidad || '');
      setProvincia(initialData.provincia || '');
      setCodigoPostal(initialData.codigo_postal || '');
      setNotas(initialData.notas || '');
    } else {
      // Resetear para un formulario nuevo
      setNombreCompleto('');
      setEmail('');
      setTelefono('');
      setDireccion('');
      setLocalidad('');
      setProvincia('');
      setCodigoPostal('');
      setNotas('');
    }
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setFormError(null);
    setFieldErrors(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = isEditMode && propietarioId
        ? await actualizarPropietario(propietarioId, formData)
        : await agregarPropietario(formData);

      if (result.error) {
        setFormError(result.error.message || "Ocurrió un error desconocido.");
        if (result.error.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        setSuccessMessage(result.message || (isEditMode ? "Propietario actualizado." : "Propietario añadido."));
        if (!isEditMode && formRef.current) {
          formRef.current.reset();
        }
        router.refresh();
        setTimeout(() => router.push("/dashboard/propietarios"), 1500);
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
          {/* --- INFORMACIÓN PERSONAL --- */}
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre Completo <span className="text-red-500">*</span></Label>
            <Input id="nombre_completo" name="nombre_completo" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required placeholder="Ej: Juan Pérez García" />
            {fieldErrors?.nombre_completo && <p className="text-sm text-red-500 mt-1">{fieldErrors.nombre_completo[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ejemplo@correo.com" />
              {fieldErrors?.email && <p className="text-sm text-red-500 mt-1">{fieldErrors.email[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+34 123 456 789" />
              {fieldErrors?.telefono && <p className="text-sm text-red-500 mt-1">{fieldErrors.telefono[0]}</p>}
            </div>
          </div>
          
          {/* --- SECCIÓN DE DIRECCIÓN DESGLOSADA --- */}
          <div className="space-y-4 pt-4 border-t">
             <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Dirección de Contacto
            </h3>
            <div className="space-y-2">
                <Label htmlFor="direccion">Calle y Número</Label>
                <Input id="direccion" name="direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej: C/ Mayor, 24, 3ºB" />
                {fieldErrors?.direccion && <p className="text-sm text-red-500 mt-1">{fieldErrors.direccion[0]}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="localidad">Localidad</Label>
                    <Input id="localidad" name="localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} placeholder="Ej: San Sebastián" />
                    {fieldErrors?.localidad && <p className="text-sm text-red-500 mt-1">{fieldErrors.localidad[0]}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Input id="provincia" name="provincia" value={provincia} onChange={(e) => setProvincia(e.target.value)} placeholder="Ej: Santa Cruz de Tenerife" />
                    {fieldErrors?.provincia && <p className="text-sm text-red-500 mt-1">{fieldErrors.provincia[0]}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="codigo_postal">Código Postal</Label>
                    <Input id="codigo_postal" name="codigo_postal" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} placeholder="Ej: 38800" />
                    {fieldErrors?.codigo_postal && <p className="text-sm text-red-500 mt-1">{fieldErrors.codigo_postal[0]}</p>}
                </div>
            </div>
          </div>
          
          {/* --- NOTAS ADICIONALES --- */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="notas" className="flex items-center gap-2"><FileText className="h-5 w-5 text-amber-600" />Notas Adicionales</Label>
            <Textarea
              id="notas"
              name="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              placeholder="Información adicional sobre el propietario, preferencias, etc."
            />
            {fieldErrors?.notas && <p className="text-sm text-red-500 mt-1">{fieldErrors.notas[0]}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-y-3 pt-6 px-6 pb-6">
          {formError && (
            <div className="w-full text-sm text-red-700 p-3 bg-red-50 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {formError}
            </div>
          )}
          {successMessage && (
            <div className="w-full text-sm text-green-700 p-3 bg-green-50 rounded-md flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {successMessage}
            </div>
          )}
          <div className="flex w-full items-center justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
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