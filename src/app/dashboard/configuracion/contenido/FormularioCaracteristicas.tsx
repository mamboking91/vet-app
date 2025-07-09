"use client";

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, PlusCircle, Trash2 } from 'lucide-react';
import { actualizarContenidoCaracteristicas } from './actions';
import type { BloquePagina, ContenidoCaracteristicaItem } from './types';
import RichTextEditor from './RichTextEditor';

interface FormularioCaracteristicasProps {
  bloque: BloquePagina;
}

export default function FormularioCaracteristicas({ bloque }: FormularioCaracteristicasProps) {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<ContenidoCaracteristicaItem[]>(bloque.contenido.items || []);

  const handleItemChange = (id: string, field: keyof ContenidoCaracteristicaItem, value: string) => {
    setItems(currentItems =>
      currentItems.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddItem = () => {
    const newItemId = `item_${Date.now()}`;
    setItems([...items, { id: newItemId, icono: 'Sparkles', titulo: 'Nueva Característica', descripcion: '<p>Descripción de la nueva característica.</p>' }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await actualizarContenidoCaracteristicas(bloque.id, items);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error('Error al actualizar', {
          description: result.error?.message,
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="border p-4 rounded-md space-y-4 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`titulo-${index}`}>Título</Label>
                <Input
                  id={`titulo-${index}`}
                  value={item.titulo}
                  onChange={(e) => handleItemChange(item.id, 'titulo', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`icono-${index}`}>Icono (Nombre de Lucide)</Label>
                <Input
                  id={`icono-${index}`}
                  value={item.icono}
                  onChange={(e) => handleItemChange(item.id, 'icono', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`descripcion-${index}`}>Descripción</Label>
              {/* --- CORRECCIÓN AQUÍ --- */}
              <RichTextEditor
                content={item.descripcion}
                onUpdate={(newContent) => handleItemChange(item.id, 'descripcion', newContent)}
              />
              {/* --- FIN DE LA CORRECCIÓN --- */}
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => handleRemoveItem(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={handleAddItem}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Característica
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
