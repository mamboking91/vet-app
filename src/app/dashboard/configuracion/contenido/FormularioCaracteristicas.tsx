// src/app/dashboard/configuracion/contenido/FormularioCaracteristicas.tsx
"use client";

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Sparkles, Stethoscope, HeartPulse, Siren } from 'lucide-react';
import { actualizarContenidoCaracteristicas } from './actions';
import type { BloquePagina, ContenidoCaracteristicaItem } from './types';
import RichTextEditor from './RichTextEditor'; // Importamos el editor

interface FormularioCaracteristicasProps {
  bloque: BloquePagina;
}

const iconComponents: { [key: string]: React.ElementType } = {
    Stethoscope, HeartPulse, Siren, Sparkles,
};
const iconOptions = Object.keys(iconComponents);

export default function FormularioCaracteristicas({ bloque }: FormularioCaracteristicasProps) {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<ContenidoCaracteristicaItem[]>(bloque.contenido.items || []);

  const handleItemChange = (index: number, field: keyof Omit<ContenidoCaracteristicaItem, 'id'>, value: string) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    if (currentItem) {
      (currentItem[field] as any) = value;
      setItems(newItems);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await actualizarContenidoCaracteristicas(bloque.id, items);
      if (result.success) toast.success(result.message);
      else toast.error("Error al actualizar", { description: result.error?.message });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="py-4">
      <div className="space-y-6">
        {items.map((item, index) => {
           const IconComponent = iconComponents[item.icono] || Sparkles;
           return (
            <div key={item.id || index} className="p-4 border rounded-lg bg-slate-50 space-y-4">
              <h4 className="font-semibold text-gray-700">Tarjeta de Característica #{index + 1}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icono</Label>
                  <Select value={item.icono} onValueChange={(value) => handleItemChange(index, 'icono', value)}>
                    <SelectTrigger><SelectValue><div className="flex items-center gap-2"><IconComponent className="h-4 w-4"/> {item.icono}</div></SelectValue></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(iconName => {
                          const SelectIcon = iconComponents[iconName];
                          return (<SelectItem key={iconName} value={iconName}><div className="flex items-center gap-2"><SelectIcon className="h-4 w-4"/> {iconName}</div></SelectItem>)
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={item.titulo} onChange={(e) => handleItemChange(index, 'titulo', e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción (con formato)</Label>
                <RichTextEditor
                  initialContent={item.descripcion}
                  onChange={(html) => handleItemChange(index, 'descripcion', html)}
                />
              </div>
            </div>
           )
        })}
      </div>
      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isPending}><Save className="mr-2 h-4 w-4" />{isPending ? "Guardando..." : "Guardar Cambios"}</Button>
      </div>
    </form>
  );
}
