// app/dashboard/configuracion/perfil/CambioContrasenaForm.tsx
"use client";

import React, { useState, useTransition, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from 'lucide-react'; // Iconos para mostrar/ocultar contraseña
// Ajusta la ruta si tu archivo actions.ts está en un lugar diferente
import { cambiarContrasenaUsuario } from '../actions'; 

// Tipo para los errores de campo específicos devueltos por Zod
type FieldErrors = {
  nueva_contrasena?: string[];
  confirmar_contrasena?: string[];
  // contrasena_actual?: string[]; // Si la añadieras
};

export default function CambioContrasenaForm() {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados para controlar la visibilidad de las contraseñas
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Ref para el formulario para poder resetearlo
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await cambiarContrasenaUsuario(formData);

      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error al cambiar la contraseña.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        setSuccessMessage(result.message || "Contraseña actualizada correctamente.");
        // Limpiar los campos del formulario tras el éxito
        formRef.current?.reset(); 
        // También podrías resetear los estados de los inputs controlados si los usaras
        // setNuevaContrasena(''); setConfirmarContrasena('');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
      {/* Contraseña Nueva */}
      <div>
        <Label htmlFor="nueva_contrasena" className="mb-1.5 block">Nueva Contraseña</Label>
        <div className="relative">
          <Input 
            id="nueva_contrasena" 
            name="nueva_contrasena" 
            type={showNewPassword ? "text" : "password"}
            required 
            minLength={6} // Coincide con la validación de Zod
            className="pr-10" // Padding a la derecha para el icono
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {fieldErrors?.nueva_contrasena && <p className="text-sm text-red-500 mt-1">{fieldErrors.nueva_contrasena[0]}</p>}
      </div>

      {/* Confirmar Contraseña Nueva */}
      <div>
        <Label htmlFor="confirmar_contrasena" className="mb-1.5 block">Confirmar Nueva Contraseña</Label>
        <div className="relative">
          <Input 
            id="confirmar_contrasena" 
            name="confirmar_contrasena" 
            type={showConfirmPassword ? "text" : "password"}
            required 
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {fieldErrors?.confirmar_contrasena && <p className="text-sm text-red-500 mt-1">{fieldErrors.confirmar_contrasena[0]}</p>}
      </div>

      {formError && <p className="text-sm text-red-600 p-3 bg-red-100 rounded-md">{formError}</p>}
      {successMessage && <p className="text-sm text-green-600 p-3 bg-green-100 rounded-md">{successMessage}</p>}

      <div className="pt-2">
        <Button type="submit" disabled={isPending} className="w-full md:w-auto">
          {isPending ? "Actualizando Contraseña..." : "Actualizar Contraseña"}
        </Button>
      </div>
    </form>
  );
}