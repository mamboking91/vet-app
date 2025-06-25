// src/app/dashboard/descuentos/nuevo/DescuentoForm.tsx
"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { crearCodigoDescuento } from '../actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DatePickerConEstado } from '@/components/ui/date-picker-con-estado';
import { Loader2 } from 'lucide-react';

export default function DescuentoForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fechaExpiracion, setFechaExpiracion] = useState<Date | undefined>();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (fechaExpiracion) {
      formData.append('fecha_expiracion', fechaExpiracion.toISOString());
    }
    
    startTransition(async () => {
      const result = await crearCodigoDescuento(formData);
      if (result.success) {
        toast.success(result.message);
        router.push('/dashboard/descuentos');
      } else {
        toast.error("Error al crear el código", {
          description: result.error?.message,
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Código</CardTitle>
          <CardDescription>Define las reglas y el valor de tu nuevo código de descuento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" name="codigo" placeholder="VERANO20" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="activo-switch">Activo</Label>
                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="activo-switch" name="activo" defaultChecked/>
                    <Label htmlFor="activo-switch">El código se puede usar</Label>
                </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tipo_descuento">Tipo de Descuento</Label>
              <Select name="tipo_descuento" required>
                <SelectTrigger><SelectValue placeholder="Selecciona un tipo"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                  <SelectItem value="fijo">Cantidad Fija (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input id="valor" name="valor" type="number" step="0.01" placeholder="10" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Condiciones (Opcional)</Label>
            <div className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="compra_minima">Compra Mínima (€)</Label>
                    <Input id="compra_minima" name="compra_minima" type="number" step="0.01" placeholder="50" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="usos_maximos">Límite de Usos Totales</Label>
                    <Input id="usos_maximos" name="usos_maximos" type="number" placeholder="100" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="fecha_expiracion">Fecha de Expiración</Label>
                    <DatePickerConEstado 
                      date={fechaExpiracion}
                      onSelect={setFechaExpiracion}
                    />
                 </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Crear Código
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
