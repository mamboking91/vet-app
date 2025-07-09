// src/app/dashboard/configuracion/contenido/EditorDeBloques.tsx
"use client";

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, ShoppingCart, Tv, Sparkles, Image as ImageIcon, Megaphone, Instagram } from 'lucide-react';
import BloqueEditable from './BloqueEditable';
import { actualizarOrdenBloques, crearNuevoBloque, eliminarBloque } from './actions';
import type { BloquePagina } from './types';

// --- INICIO DE LA CORRECCIÓN ---
const infoBloques: { [key: string]: { icon: React.ElementType, nombre: string } } = {
  heroe: { icon: Tv, nombre: "Sección Héroe" },
  caracteristicas: { icon: Sparkles, nombre: "Lista de Características" },
  productos_destacados: { icon: ShoppingCart, nombre: "Productos Destacados" },
  texto_con_imagen: { icon: ImageIcon, nombre: "Texto con Imagen" },
  instagram: { icon: Instagram, nombre: "Galería de Instagram" },
  cta: { icon: Megaphone, nombre: "Llamada a la Acción (CTA)" },
};
// --- FIN DE LA CORRECCIÓN ---

interface EditorDeBloquesProps {
  initialBloques: BloquePagina[];
}

export default function EditorDeBloques({ initialBloques }: EditorDeBloquesProps) {
  const [bloques, setBloques] = useState(initialBloques);
  const [isSavingOrder, startOrderTransition] = useTransition();
  const [isCreating, startCreateTransition] = useTransition();
  const [isDeleting, startDeleteAction] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const moverBloque = (index: number, direccion: 'arriba' | 'abajo') => {
    const newBloques = [...bloques];
    const newIndex = direccion === 'arriba' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newBloques.length) return;
    [newBloques[index], newBloques[newIndex]] = [newBloques[newIndex], newBloques[index]];
    const finalBloques = newBloques.map((b, idx) => ({ ...b, orden: idx }));
    setBloques(finalBloques);
    startOrderTransition(async () => {
      const result = await actualizarOrdenBloques(finalBloques.map(b => b.id));
      if (!result.success) {
        toast.error("Error al guardar el orden", { description: result.error?.message });
        setBloques(bloques); // Revertir en caso de error
      }
    });
  };

  const handleCrearBloque = (tipo: string) => {
    startCreateTransition(async () => {
      const result = await crearNuevoBloque('inicio', tipo, bloques.length);
      if (result.success && result.data) {
        toast.success(`Bloque "${infoBloques[tipo]?.nombre || 'Nuevo'}" añadido.`);
        setBloques(prev => [...prev, result.data as BloquePagina]);
      } else {
        toast.error("Error al crear el bloque", { description: result.error?.message });
      }
    });
  };

  const handleEliminarBloque = (bloqueId: string) => {
    setDeletingId(bloqueId);
    startDeleteAction(async () => {
      const result = await eliminarBloque(bloqueId);
      if (result.success) {
        toast.success("Bloque eliminado.");
        setBloques(prev => prev.filter(b => b.id !== bloqueId));
      } else {
        toast.error("Error al eliminar", { description: result.error?.message });
      }
      setDeletingId(null);
    });
  };

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Plus className="mr-2 h-4 w-4" />}
              Añadir Bloque
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Bloque</DialogTitle>
              <DialogDescription>Selecciona el tipo de contenido a añadir.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              {Object.entries(infoBloques).map(([key, { icon: Icon, nombre }]) => (
                <Button key={key} variant="outline" className="justify-start h-auto p-4" onClick={() => handleCrearBloque(key)}>
                  <Icon className="mr-3 h-5 w-5 text-indigo-500" />
                  <p className="font-semibold">{nombre}</p>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {bloques.map((bloque, index) => (
          <BloqueEditable
            key={bloque.id}
            bloque={bloque}
            index={index}
            totalBloques={bloques.length}
            onMover={moverBloque}
            onEliminar={handleEliminarBloque}
            isSavingOrder={isSavingOrder}
            deletingId={deletingId}
          />
        ))}
        {bloques.length === 0 && !isCreating && (
            <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                <p>No hay bloques en esta página.</p>
                <p className="text-sm">¡Añade uno para empezar a construir!</p>
            </div>
        )}
      </div>
    </div>
  );
}