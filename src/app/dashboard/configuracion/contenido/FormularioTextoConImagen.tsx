"use client";

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Save, Upload } from 'lucide-react';
import { actualizarContenidoTextoConImagen } from './actions';
import type { BloquePagina } from './types';
import RichTextEditor from './RichTextEditor';

interface FormularioTextoConImagenProps {
  bloque: BloquePagina;
}

export default function FormularioTextoConImagen({ bloque }: FormularioTextoConImagenProps) {
  const [isPending, startTransition] = useTransition();
  const [contenido, setContenido] = useState(bloque.contenido);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContenido({ ...contenido, [e.target.name]: e.target.value });
  };

  const handleRichTextChange = (html: string) => {
    setContenido({ ...contenido, texto: html });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      setContenido({ ...contenido, imagenUrl: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('bloqueId', bloque.id);
    formData.append('titulo', contenido.titulo || '');
    formData.append('texto', contenido.texto || '');
    formData.append('posicionImagen', contenido.posicionImagen || 'derecha');
    formData.append('imagenUrlActual', bloque.contenido.imagenUrl);

    if (newImageFile) {
      formData.append('imagen', newImageFile);
    }

    startTransition(async () => {
      const result = await actualizarContenidoTextoConImagen(formData);
      if (result.success) {
        toast.success(result.message);
        if (result.newImageUrl) {
          setContenido((prev: any) => ({ ...prev, imagenUrl: result.newImageUrl }));
        }
        setNewImageFile(null);
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
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" name="titulo" value={contenido.titulo || ''} onChange={handleInputChange} required />
      </div>
      <div className="space-y-2">
        <Label>Texto</Label>
        {/* --- CORRECCIÓN AQUÍ --- */}
        <RichTextEditor
          content={contenido.texto || ''}
          onUpdate={handleRichTextChange}
        />
        {/* --- FIN DE LA CORRECCIÓN --- */}
      </div>
      <div className="space-y-2">
        <Label>Posición de la Imagen</Label>
        <RadioGroup
          value={contenido.posicionImagen || 'derecha'}
          onValueChange={(value) => setContenido({ ...contenido, posicionImagen: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="izquierda" id="pos-izquierda" />
            <Label htmlFor="pos-izquierda">Izquierda</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="derecha" id="pos-derecha" />
            <Label htmlFor="pos-derecha">Derecha</Label>
          </div>
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>Imagen</Label>
        <div className="flex items-center gap-4">
          {contenido.imagenUrl && (
            <div className="w-24 h-24 relative flex-shrink-0 border rounded-md">
              <Image src={contenido.imagenUrl} alt="Vista previa" layout="fill" className="object-cover rounded-md" />
            </div>
          )}
          <div className="flex-grow">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Subir nueva imagen
            </Button>
            {newImageFile && <p className="text-xs text-muted-foreground mt-2">Nuevo: {newImageFile.name}</p>}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
