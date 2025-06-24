// src/app/dashboard/configuracion/contenido/FormularioProductosDestacados.tsx
"use client";

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { actualizarContenidoProductosDestacados } from './actions';
import type { BloquePagina } from './types';

interface FormularioProductosDestacadosProps {
  bloque: BloquePagina;
}

export default function FormularioProductosDestacados({ bloque }: FormularioProductosDestacadosProps) {
  const [isPending, startTransition] = useTransition();
  const [titulo, setTitulo] = useState(bloque.contenido.titulo || '');
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await actualizarContenidoProductosDestacados(bloque.id, formData);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error("Error al actualizar", { description: result.error?.message });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título de la Sección</Label>
        <Input 
          id="titulo" 
          name="titulo" 
          value={titulo} 
          onChange={(e) => setTitulo(e.target.value)} 
          required 
          placeholder="Ej: Nuestros Productos Estrella"
        />
        <p className="text-xs text-muted-foreground">Este título aparecerá sobre la parrilla de productos destacados en la página de inicio.</p>
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
