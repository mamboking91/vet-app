"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ESTADOS_PEDIDO, type EstadoPedido } from './types';
import { updateOrderStatus } from './actions';
import { toast } from 'sonner';

interface UpdateOrderStatusProps {
  pedidoId: string;
  currentStatus: EstadoPedido;
  onStatusUpdate: () => void; // <-- AÑADIMOS EL CALLBACK
}

export default function UpdateOrderStatus({ pedidoId, currentStatus, onStatusUpdate }: UpdateOrderStatusProps) {
  const [status, setStatus] = useState<EstadoPedido>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('estado', status);

    startTransition(async () => {
      const result = await updateOrderStatus(pedidoId, formData);
      if (result.success) {
        toast.success(result.message);
        onStatusUpdate(); // <-- LLAMAMOS AL CALLBACK EN LUGAR DE router.refresh()
      } else {
        toast.error(result.error?.message || "No se pudo actualizar el estado.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Select value={status} onValueChange={(value: EstadoPedido) => setStatus(value)} disabled={isPending}>
        <SelectTrigger>
          <SelectValue placeholder="Cambiar estado..." />
        </SelectTrigger>
        <SelectContent>
          {ESTADOS_PEDIDO.map(s => (
            <SelectItem key={s} value={s} className="capitalize">
              {s.replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isPending || status === currentStatus}>
        {isPending ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}