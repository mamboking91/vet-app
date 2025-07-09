// src/app/dashboard/configuracion/contenido/FormularioHeroe.tsx
"use client";

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from './RichTextEditor';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Save, Upload } from 'lucide-react';
import { actualizarContenidoHeroe } from './actions';
import type { BloquePagina } from './types';

interface FormularioHeroeProps {
  bloque: BloquePagina;
}

export default function FormularioHeroe({ bloque }: FormularioHeroeProps) {
  const [isPending, startTransition] = useTransition();
  const [contenido, setContenido] = useState(bloque.contenido);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRichTextChange = (fieldName: 'titulo' | 'subtitulo', newContent: string) => {
    setContenido({ ...contenido, [fieldName]: newContent });
  };

  const handleSelectChange = (fieldName: string, value: string) => {
    setContenido({ ...contenido, [fieldName]: value });
  };
  
  const handleButtonChange = (e: React.ChangeEvent<HTMLInputElement>, buttonType: 'boton_principal' | 'boton_secundario') => {
    const { name, value } = e.target;
    const field = name.replace(`${buttonType}_`, '');
    setContenido({
      ...contenido,
      [buttonType]: {
        ...contenido[buttonType],
        [field]: value
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      setContenido({ ...contenido, backgroundImageUrl: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('bloqueId', bloque.id);
    Object.entries(contenido).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) { formData.append(key, JSON.stringify(value)); } 
      else if (value !== null && value !== undefined) { formData.append(key, value.toString()); }
    });
    if (newImageFile) { formData.append('backgroundImageFile', newImageFile); }
    
    startTransition(async () => {
      const result = await actualizarContenidoHeroe(formData);
      if (result.success) {
        toast.success(result.message);
        if (result.newImageUrl !== undefined) { setContenido((prev: any) => ({ ...prev, backgroundImageUrl: result.newImageUrl })); }
        setNewImageFile(null);
      } else {
        toast.error("Error al actualizar", { description: result.error?.message });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 py-4">
      <div className="space-y-2">
        <Label>Título Principal</Label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
                <RichTextEditor content={contenido.titulo || ''} onUpdate={(newContent) => handleRichTextChange('titulo', newContent)} />
            </div>
            <div className="space-y-2">
                 <Label htmlFor="tituloFontSize">Tamaño</Label>
                 <Select value={contenido.tituloFontSize || '6xl'} onValueChange={(value) => handleSelectChange('tituloFontSize', value)}>
                    <SelectTrigger id="tituloFontSize"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="4xl">Grande (4xl)</SelectItem>
                        <SelectItem value="5xl">Muy Grande (5xl)</SelectItem>
                        <SelectItem value="6xl">Extra Grande (6xl)</SelectItem>
                        <SelectItem value="7xl">Enorme (7xl)</SelectItem>
                    </SelectContent>
                 </Select>
            </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Subtítulo</Label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
                 <RichTextEditor content={contenido.subtitulo || ''} onUpdate={(newContent) => handleRichTextChange('subtitulo', newContent)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="subtituloFontSize">Tamaño</Label>
                 <Select value={contenido.subtituloFontSize || 'xl'} onValueChange={(value) => handleSelectChange('subtituloFontSize', value)}>
                    <SelectTrigger id="subtituloFontSize"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lg">Normal (lg)</SelectItem>
                        <SelectItem value="xl">Grande (xl)</SelectItem>
                        <SelectItem value="2xl">Muy Grande (2xl)</SelectItem>
                    </SelectContent>
                 </Select>
            </div>
        </div>
      </div>

      <fieldset className="border p-4 rounded-md space-y-4">
        <legend className="text-sm font-medium text-muted-foreground px-1">Botón Principal</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-2">
            <Label htmlFor="boton_principal_texto">Texto</Label>
            <Input id="boton_principal_texto" name="boton_principal_texto" value={contenido.boton_principal?.texto || ''} onChange={(e) => handleButtonChange(e, 'boton_principal')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="boton_principal_enlace">Enlace</Label>
            <Input id="boton_principal_enlace" name="boton_principal_enlace" value={contenido.boton_principal?.enlace || ''} onChange={(e) => handleButtonChange(e, 'boton_principal')} required placeholder="/tienda" />
          </div>
          <div className="space-y-2">
            <Label>Color de Fondo</Label>
            <Input type="color" name="boton_principal_backgroundColor" value={contenido.boton_principal?.backgroundColor || '#2563eb'} onChange={(e) => handleButtonChange(e, 'boton_principal')} className="w-24 h-10 p-1 cursor-pointer" />
          </div>
          <div className="space-y-2">
            <Label>Color del Texto</Label>
            <Input type="color" name="boton_principal_textColor" value={contenido.boton_principal?.textColor || '#ffffff'} onChange={(e) => handleButtonChange(e, 'boton_principal')} className="w-24 h-10 p-1 cursor-pointer" />
          </div>
        </div>
      </fieldset>

      <fieldset className="border p-4 rounded-md space-y-4">
        <legend className="text-sm font-medium text-muted-foreground px-1">Botón Secundario</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-2">
            <Label htmlFor="boton_secundario_texto">Texto</Label>
            <Input id="boton_secundario_texto" name="boton_secundario_texto" value={contenido.boton_secundario?.texto || ''} onChange={(e) => handleButtonChange(e, 'boton_secundario')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="boton_secundario_enlace">Enlace</Label>
            <Input id="boton_secundario_enlace" name="boton_secundario_enlace" value={contenido.boton_secundario?.enlace || ''} onChange={(e) => handleButtonChange(e, 'boton_secundario')} required placeholder="/contacto" />
          </div>
          <div className="space-y-2">
            <Label>Color de Fondo</Label>
            <Input type="color" name="boton_secundario_backgroundColor" value={contenido.boton_secundario?.backgroundColor || '#ffffff'} onChange={(e) => handleButtonChange(e, 'boton_secundario')} className="w-24 h-10 p-1 cursor-pointer" />
          </div>
          <div className="space-y-2">
            <Label>Color del Texto</Label>
            <Input type="color" name="boton_secundario_textColor" value={contenido.boton_secundario?.textColor || '#1f2937'} onChange={(e) => handleButtonChange(e, 'boton_secundario')} className="w-24 h-10 p-1 cursor-pointer" />
          </div>
        </div>
      </fieldset>

      <fieldset className="border p-4 rounded-md space-y-4">
        <legend className="text-sm font-medium text-muted-foreground px-1">Fondo de la Sección</legend>
        <RadioGroup name="backgroundType" value={contenido.backgroundType || 'color'} onValueChange={(value) => setContenido({ ...contenido, backgroundType: value })}>
          <div className="flex items-center space-x-2"><RadioGroupItem value="color" id="bg-color" /><Label htmlFor="bg-color">Color Sólido</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="imagen" id="bg-image" /><Label htmlFor="bg-image">Imagen de Fondo</Label></div>
        </RadioGroup>

        {contenido.backgroundType === 'color' && (
          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Selector de Color</Label>
            <Input id="backgroundColor" name="backgroundColor" type="color" value={contenido.backgroundColor || '#f0f9ff'} onChange={(e) => setContenido({ ...contenido, backgroundColor: e.target.value })} className="w-24 h-10 p-1 cursor-pointer" />
          </div>
        )}

        {contenido.backgroundType === 'imagen' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Imagen</Label>
              <div className="flex items-center gap-4">
                {contenido.backgroundImageUrl && (<div className="w-24 h-16 relative flex-shrink-0 border rounded-md"><Image src={contenido.backgroundImageUrl} alt="Vista previa" layout="fill" className="object-cover rounded-md" /></div>)}
                <div className="flex-grow">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Subir imagen</Button>
                  {newImageFile && <p className="text-xs text-muted-foreground mt-2">Nuevo: {newImageFile.name}</p>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="backgroundPosition">Posición de la Imagen</Label>
                <Select value={contenido.backgroundPosition || 'center'} onValueChange={(value) => handleSelectChange('backgroundPosition', value)}>
                  <SelectTrigger id="backgroundPosition"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="top">Arriba</SelectItem>
                    <SelectItem value="bottom">Abajo</SelectItem>
                    <SelectItem value="left">Izquierda</SelectItem>
                    <SelectItem value="right">Derecha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="overlayOpacity">Opacidad del Overlay ({contenido.overlayOpacity || 60}%)</Label>
                <Slider
                  id="overlayOpacity"
                  name="overlayOpacity"
                  min={0} max={100} step={5}
                  value={[contenido.overlayOpacity || 60]}
                  onValueChange={(value) => setContenido({ ...contenido, overlayOpacity: value[0] })}
                />
              </div>
            </div>
          </div>
        )}
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
