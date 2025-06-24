// src/app/dashboard/configuracion/contenido/FormularioHeroe.tsx
"use client";

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { actualizarContenidoHeroe } from './actions';
import type { BloquePagina } from './types';

interface FormularioHeroeProps {
  bloque: BloquePagina;
}

export default function FormularioHeroe({ bloque }: FormularioHeroeProps) {
  const [isPending, startTransition] = useTransition();
  // Estado inicial ahora incluye los botones
  const [contenido, setContenido] = useState(bloque.contenido);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContenido({ ...contenido, [e.target.name]: e.target.value });
  };
  
  const handleButtonChange = (e: React.ChangeEvent<HTMLInputElement>, buttonType: 'boton_principal' | 'boton_secundario') => {
    const { name, value } = e.target;
    const field = name.replace(`${buttonType}_`, ''); // 'texto' o 'enlace'
    setContenido({
        ...contenido,
        [buttonType]: {
            ...contenido[buttonType],
            [field]: value
        }
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Ya no usamos FormData, enviamos el estado directamente a la acción
    const formData = new FormData();
    formData.append('titulo', contenido.titulo);
    formData.append('subtitulo', contenido.subtitulo);
    formData.append('boton_principal_texto', contenido.boton_principal.texto);
    formData.append('boton_principal_enlace', contenido.boton_principal.enlace);
    formData.append('boton_secundario_texto', contenido.boton_secundario.texto);
    formData.append('boton_secundario_enlace', contenido.boton_secundario.enlace);

    startTransition(async () => {
      const result = await actualizarContenidoHeroe(bloque.id, formData);
      if (result.success) toast.success(result.message);
      else toast.error("Error al actualizar", { description: result.error?.message });
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título Principal</Label>
        <Input id="titulo" name="titulo" value={contenido.titulo || ''} onChange={handleInputChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subtitulo">Subtítulo</Label>
        <Textarea id="subtitulo" name="subtitulo" value={contenido.subtitulo || ''} onChange={handleInputChange} rows={4} required />
      </div>
      
      <fieldset className="border p-4 rounded-md space-y-4">
        <legend className="text-sm font-medium text-muted-foreground px-1">Botón Principal</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="boton_principal_texto">Texto</Label>
                <Input id="boton_principal_texto" name="boton_principal_texto" value={contenido.boton_principal?.texto || ''} onChange={(e) => handleButtonChange(e, 'boton_principal')} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="boton_principal_enlace">Enlace</Label>
                <Input id="boton_principal_enlace" name="boton_principal_enlace" value={contenido.boton_principal?.enlace || ''} onChange={(e) => handleButtonChange(e, 'boton_principal')} required placeholder="/tienda" />
            </div>
        </div>
      </fieldset>

       <fieldset className="border p-4 rounded-md space-y-4">
        <legend className="text-sm font-medium text-muted-foreground px-1">Botón Secundario</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="boton_secundario_texto">Texto</Label>
                <Input id="boton_secundario_texto" name="boton_secundario_texto" value={contenido.boton_secundario?.texto || ''} onChange={(e) => handleButtonChange(e, 'boton_secundario')} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="boton_secundario_enlace">Enlace</Label>
                <Input id="boton_secundario_enlace" name="boton_secundario_enlace" value={contenido.boton_secundario?.enlace || ''} onChange={(e) => handleButtonChange(e, 'boton_secundario')} required placeholder="/contacto" />
            </div>
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}><Save className="mr-2 h-4 w-4" />{isPending ? "Guardando..." : "Guardar Cambios"}</Button>
      </div>
    </form>
  );
}
