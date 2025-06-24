// src/app/dashboard/configuracion/contenido/FormularioTextoConImagen.tsx
"use client";

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();

    // Añadimos todos los datos al FormData
    formData.append('bloqueId', bloque.id);
    formData.append('titulo', contenido.titulo);
    formData.append('texto', contenido.texto);
    formData.append('posicionImagen', contenido.posicionImagen);
    formData.append('imagenUrlActual', bloque.contenido.imagenUrl); // URL original para borrarla si se sube una nueva
    if (newImageFile) {
      formData.append('imagen', newImageFile);
    }
    
    startTransition(async () => {
      const result = await actualizarContenidoTextoConImagen(formData);
      if (result.success) {
        toast.success(result.message);
        // Si la subida fue exitosa, actualizamos el estado para reflejar la nueva URL
        if (result.newImageUrl) {
            setContenido((prev: any) => ({ ...prev, imagenUrl: result.newImageUrl }));
            setNewImageFile(null); // Limpiamos el archivo seleccionado
        }
      } else {
        toast.error("Error al actualizar", { description: result.error?.message });
      }
    });
  };

  // Lógica mejorada para la vista previa de la imagen
  let imagePreviewSrc: string | null = null;
  if (newImageFile) {
    // Si hay un archivo nuevo, creamos una URL temporal para la vista previa
    imagePreviewSrc = URL.createObjectURL(newImageFile);
  } else if (contenido.imagenUrl) {
    // Si no, usamos la URL que ya está guardada en el bloque
    imagePreviewSrc = contenido.imagenUrl;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título de la Sección</Label>
        <Input id="titulo" name="titulo" value={contenido.titulo || ''} onChange={(e) => setContenido({...contenido, titulo: e.target.value})} required />
      </div>
      
       <div className="space-y-2">
        <Label>Texto Principal</Label>
        <RichTextEditor initialContent={contenido.texto || ''} onChange={(html) => setContenido({...contenido, texto: html})} />
      </div>
      
      <div className="space-y-2">
        <Label>Imagen</Label>
        <div className="flex items-center gap-4">
          {imagePreviewSrc ? (
            <div className="w-24 h-[72px] relative flex-shrink-0 border rounded-md">
              <Image src={imagePreviewSrc} alt="Vista previa" layout="fill" className="object-cover rounded-md" />
            </div>
          ) : (
            <div className="w-24 h-[72px] flex-shrink-0 border rounded-md bg-slate-100 flex items-center justify-center text-xs text-muted-foreground">Sin imagen</div>
          )}
          
          <div className="flex-grow">
            {/* Este input está oculto, pero lo activamos con el botón */}
            <input type="file" name="imagen" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp, image/gif" />
            
            {/* CORRECCIÓN: Este botón ahora sí activa el input de archivo */}
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Subir imagen
            </Button>
            
            {newImageFile && <p className="text-xs text-muted-foreground mt-2">Nuevo archivo: {newImageFile.name}</p>}
            {!newImageFile && contenido.imagenUrl && <p className="text-xs text-muted-foreground mt-2">Imagen actual guardada.</p>}
          </div>
        </div>
      </div>

      <div className="space-y-2">
          <Label>Posición de la Imagen</Label>
          <Select name="posicionImagen" value={contenido.posicionImagen || 'derecha'} onValueChange={(value) => setContenido({...contenido, posicionImagen: value as 'izquierda' | 'derecha'})}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="derecha">Derecha</SelectItem>
              <SelectItem value="izquierda">Izquierda</SelectItem>
            </SelectContent>
          </Select>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
