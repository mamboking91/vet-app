// src/app/dashboard/configuracion/contenido/FormularioInstagram.tsx
"use client";

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, PlusCircle, Trash2, Upload, GripVertical } from 'lucide-react';
import type { BloquePagina, ContenidoInstagramPost } from './types';
import { actualizarContenidoInstagram } from './actions';

interface FormularioInstagramProps {
  bloque: BloquePagina;
}

export default function FormularioInstagram({ bloque }: FormularioInstagramProps) {
  const [isPending, startTransition] = useTransition();
  const [contenido, setContenido] = useState(bloque.contenido);
  const [posts, setPosts] = useState<ContenidoInstagramPost[]>(bloque.contenido.posts || []);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContenido({ ...contenido, titulo: e.target.value });
  };
  
  const handlePostChange = (id: string, field: 'enlace', value: string) => {
    setPosts(currentPosts => 
      currentPosts.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };
  
  const handleFileChange = (id: string, file: File | null) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPosts(currentPosts => 
      currentPosts.map(p => p.id === id ? { ...p, imagenUrl: previewUrl, file: file } : p)
    );
  };

  const handleAddPost = () => {
    const newId = `post_${Date.now()}`;
    setPosts([...posts, { id: newId, imagenUrl: '', enlace: '' }]);
  };

  const handleRemovePost = (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
  };
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('bloqueId', bloque.id);
    formData.append('titulo', contenido.titulo);
    
    const serializablePosts = posts.map(({ file, ...rest }) => rest);
    formData.append('posts', JSON.stringify(serializablePosts));

    posts.forEach(post => {
      if (post.file) {
        formData.append(`post_image_${post.id}`, post.file);
      }
    });

    startTransition(async () => {
      const result = await actualizarContenidoInstagram(formData);
      if (result.success) {
        toast.success(result.message);
        if (result.updatedPosts) {
          setPosts(result.updatedPosts);
        }
      } else {
        toast.error("Error al actualizar", { description: result.error?.message });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="titulo-ig">Título de la Sección</Label>
        <Input 
          id="titulo-ig" 
          name="titulo"
          value={contenido.titulo || ''} 
          onChange={handleTitleChange} 
          placeholder="Ej: Síguenos en Instagram"
        />
      </div>
      
      <div className="space-y-4">
        <Label>Publicaciones</Label>
        {posts.map((post, index) => (
          <div key={post.id} className="border p-4 rounded-lg space-y-4 bg-gray-50/50">
             <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-1">
                        <Label className="text-xs">Imagen</Label>
                        <div className="flex items-center gap-2">
                            {post.imagenUrl && <Image src={post.imagenUrl} alt="Vista previa" width={64} height={64} className="rounded-md object-cover h-16 w-16 border" />}
                            {/* --- INICIO DE LA CORRECCIÓN --- */}
                            <input type="file" ref={el => { fileInputRefs.current[index] = el; }} onChange={(e) => handleFileChange(post.id, e.target.files?.[0] || null)} className="hidden" accept="image/*" />
                            {/* --- FIN DE LA CORRECCIÓN --- */}
                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRefs.current[index]?.click()}><Upload className="mr-2 h-4 w-4"/>Subir</Button>
                        </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`enlace-${index}`} className="text-xs">Enlace a la publicación</Label>
                        <Input id={`enlace-${index}`} value={post.enlace} onChange={(e) => handlePostChange(post.id, 'enlace', e.target.value)} placeholder="https://instagram.com/p/..."/>
                    </div>
                </div>
                 <div className="flex-shrink-0">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemovePost(post.id)}>
                        <Trash2 className="h-4 w-4 text-destructive"/>
                    </Button>
                </div>
            </div>
          </div>
        ))}
         <Button type="button" variant="outline" onClick={handleAddPost} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />Añadir Publicación
        </Button>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}