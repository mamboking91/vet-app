// src/app/dashboard/configuracion/contenido/FormularioCTA.tsx
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

export default function FormularioCta({ bloque }: FormularioCtaProps) {
  const [isPending, startTransition] = useTransition();
  const [contenido, setContenido] = useState(bloque.contenido);

  const handleRichTextChange = (html: string) => {
    setContenido((prev: any) => ({ ...prev, titulo: html }));
  };

  const handleBotonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name.replace('boton_', '');
    setContenido((prev: any) => ({
      ...prev,
      boton: { ...prev.boton, [field]: value }
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('titulo', contenido.titulo);
    formData.append('boton_texto', contenido.boton.texto);
    formData.append('boton_enlace', contenido.boton.enlace);
    
    startTransition(async () => {
      const result = await actualizarContenidoCta(bloque.id, formData);
      if (result.success) toast.success(result.message);
      else toast.error("Error al actualizar", { description: result.error?.message });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="titulo-editor">Título</Label>
        <RichTextEditor initialContent={contenido.titulo || ''} onChange={handleRichTextChange} />
        <input type="hidden" name="titulo" value={contenido.titulo || ''} />
      </div>
      <fieldset className="border p-4 rounded-md space-y-4">
        <legend className="text-sm font-medium text-muted-foreground px-1">Botón</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="boton_texto_cta">Texto del Botón</Label>
            <Input id="boton_texto_cta" name="boton_texto" value={contenido.boton?.texto || ''} onChange={handleBotonChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="boton_enlace_cta">Enlace del Botón</Label>
            <Input id="boton_enlace_cta" name="boton_enlace" value={contenido.boton?.enlace || ''} onChange={handleBotonChange} required />
          </div>
        </div>
      </fieldset>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}><Save className="mr-2 h-4 w-4" />{isPending ? "Guardando..." : "Guardar Cambios"}</Button>
      </div>
    </form>
  );
}
