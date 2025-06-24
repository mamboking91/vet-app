// src/app/dashboard/propietarios/[propietarioId]/RoleManagementCard.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Shield } from "lucide-react";
import { actualizarRolPropietario } from "../actions";
import type { PropietarioDetallado } from "../types";

interface RoleManagementCardProps {
  propietario: PropietarioDetallado;
}

type Rol = 'cliente' | 'administrador';

export default function RoleManagementCard({ propietario }: RoleManagementCardProps) {
  const [isPending, startTransition] = useTransition();
  // El rol por defecto será 'cliente' si no viene definido
  const [selectedRol, setSelectedRol] = useState<Rol>(propietario.rol || 'cliente');

  const handleRoleChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await actualizarRolPropietario(propietario.id, selectedRol);

      if (result.success) {
        toast.success(`Rol de ${propietario.nombre_completo} actualizado a "${selectedRol}".`);
      } else {
        toast.error("Error al cambiar el rol", {
          description: result.error?.message || "Ocurrió un error inesperado.",
        });
      }
    });
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg py-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Shield className="h-5 w-5" />
          Gestión de Rol
        </CardTitle>
        <CardDescription className="text-amber-100">
          Asigna el rol del usuario en el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleRoleChange} className="space-y-4">
          <div>
            <Label htmlFor="rol-selector" className="text-sm font-medium text-gray-700">
              Rol del Usuario
            </Label>
            <Select
              name="rol"
              value={selectedRol}
              onValueChange={(value: Rol) => setSelectedRol(value)}
              disabled={isPending}
            >
              <SelectTrigger id="rol-selector" className="mt-1">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isPending || selectedRol === (propietario.rol || 'cliente')}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isPending ? "Guardando..." : "Guardar Rol"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}