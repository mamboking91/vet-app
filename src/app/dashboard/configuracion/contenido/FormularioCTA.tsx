"use client";

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { actualizarContenidoCta } from './actions';
import type { BloquePagina } from './types';
import RichTextEditor from './RichTextEditor';

interface FormularioCtaProps {
  bloque: BloquePagina;
}

export default function FormularioCTA({ bloque }: FormularioCtaProps) {
  const [isPending, startTransition] = useTransition();
  const [contenido, setContenido] = useState(bloque.contenido);

  const handleRichTextChange = (html: string) => {
    setContenido({ ...contenido, titulo: html });
  };

  const handleBotonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContenido({
      ...contenido,
      boton: {
        ...contenido.boton,
        [name.replace('boton_', '')]: value,
      },
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // Aseguramos que el contenido del editor esté en el FormData
    formData.set('titulo', contenido.titulo || '');
    
    startTransition(async () => {
      const result = await actualizarContenidoCta(bloque.id, formData);
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
      <div className="space-y-2">
        <Label htmlFor="titulo-editor">Título</Label>
        {/* --- CORRECCIÓN AQUÍ: Se usa 'content' y 'onUpdate' --- */}
        <RichTextEditor
          content={contenido.titulo || ''}
          onUpdate={handleRichTextChange}
        />
        {/* --- FIN DE LA CORRECCIÓN --- */}
      </div>
      <fieldset className="border p-4 rounded-md space-y-4">
        <legend className="text-sm font-medium text-muted-foreground px-1">Botón</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="boton_texto">Texto del Botón</Label>
            <Input
              id="boton_texto"
              name="boton_texto"
              value={contenido.boton?.texto || ''}
              onChange={handleBotonChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="boton_enlace">Enlace del Botón</Label>
            <Input
              id="boton_enlace"
              name="boton_enlace"
              value={contenido.boton?.enlace || ''}
              onChange={handleBotonChange}
              required
            />
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
