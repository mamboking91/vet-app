// app/dashboard/pedidos/[pedidoId]/editar/EditarPedidoForm.tsx
"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateOrderDetails } from '@/app/dashboard/pedidos/actions';
import type { Pedido } from '@/app/dashboard/pedidos/types';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

interface EditarPedidoFormProps {
  pedido: Pedido;
}

export default function EditarPedidoForm({ pedido }: EditarPedidoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [direccionEnvio, setDireccionEnvio] = useState(pedido.direccion_envio || {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDireccionEnvio(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateOrderDetails(pedido.id, formData);
      if (result.success) {
        toast.success(result.message);
        router.push(`/dashboard/pedidos/${pedido.id}`);
      } else {
        toast.error(result.error?.message || "Error al actualizar.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
        <Card>
            <CardHeader>
                <CardTitle>Dirección de Envío</CardTitle>
                <CardDescription>Actualiza los datos de envío del cliente para este pedido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                    <Input id="nombre_completo" name="nombre_completo" value={direccionEnvio.nombre_completo || ''} onChange={handleChange} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección (Calle y Número) *</Label>
                    <Input id="direccion" name="direccion" value={direccionEnvio.direccion || ''} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label htmlFor="localidad">Localidad *</Label><Input id="localidad" name="localidad" value={direccionEnvio.localidad || ''} onChange={handleChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="provincia">Provincia *</Label><Input id="provincia" name="provincia" value={direccionEnvio.provincia || ''} onChange={handleChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="codigo_postal">Cód. Postal *</Label><Input id="codigo_postal" name="codigo_postal" value={direccionEnvio.codigo_postal || ''} onChange={handleChange} required /></div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono (Opcional)</Label>
                    <Input id="telefono" name="telefono" value={direccionEnvio.telefono || ''} onChange={handleChange} />
                </div>
            </CardContent>
        </Card>
        <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Actualizando...</> : <><Save className="mr-2 h-4 w-4"/>Guardar Cambios</>}
            </Button>
        </div>
    </form>
  );
}
