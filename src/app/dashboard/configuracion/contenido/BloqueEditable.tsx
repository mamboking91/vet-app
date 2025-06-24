// src/app/dashboard/configuracion/contenido/BloqueEditable.tsx
"use client";

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowDown, ArrowUp, Edit, GripVertical, Trash2, Loader2, ChevronDown, FileWarning, Tv, Sparkles, ShoppingCart, Image as ImageIcon, Megaphone } from 'lucide-react';
import FormularioHeroe from './FormularioHeroe';
import FormularioCaracteristicas from './FormularioCaracteristicas';
import FormularioProductosDestacados from './FormularioProductosDestacados';
import FormularioTextoConImagen from './FormularioTextoConImagen';
import FormularioCta from './FormularioCTA';
import type { BloquePagina } from './types';
import { useState } from 'react';

// Mapeo de tipos de bloque a componentes para la UI
const infoBloques: { [key: string]: { icon: React.ElementType, nombre: string } } = {
  heroe: { icon: Tv, nombre: "Sección Héroe" },
  caracteristicas: { icon: Sparkles, nombre: "Lista de Características" },
  productos_destacados: { icon: ShoppingCart, nombre: "Productos Destacados" },
  texto_con_imagen: { icon: ImageIcon, nombre: "Texto con Imagen" },
  cta: { icon: Megaphone, nombre: "Llamada a la Acción (CTA)" },
  default: { icon: FileWarning, nombre: "Bloque Desconocido" }
};

interface BloqueEditableProps {
  bloque: BloquePagina;
  index: number;
  totalBloques: number;
  onMover: (index: number, direccion: 'arriba' | 'abajo') => void;
  onEliminar: (id: string) => void;
  isSavingOrder: boolean;
  deletingId: string | null;
}

// Función para renderizar el formulario correcto según el tipo de bloque
const renderFormularioEdicion = (bloque: BloquePagina) => {
    switch (bloque.tipo_bloque) {
        case 'heroe': return <FormularioHeroe bloque={bloque} />;
        case 'caracteristicas': return <FormularioCaracteristicas bloque={bloque} />;
        case 'productos_destacados': return <FormularioProductosDestacados bloque={bloque} />;
        case 'texto_con_imagen': return <FormularioTextoConImagen bloque={bloque} />;
        case 'cta': return <FormularioCta bloque={bloque} />;
        default: return <p className="p-4 text-sm text-muted-foreground">No hay formulario para este tipo de bloque.</p>;
    }
};

export default function BloqueEditable({
  bloque,
  index,
  totalBloques,
  onMover,
  onEliminar,
  isSavingOrder,
  deletingId
}: BloqueEditableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const InfoIcon = infoBloques[bloque.tipo_bloque]?.icon || infoBloques.default.icon;
  const nombreBloque = infoBloques[bloque.tipo_bloque]?.nombre || infoBloques.default.nombre;
  const esEsteBloqueElQueSeElimina = isSavingOrder || (deletingId === bloque.id);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="flex flex-row items-center p-4 gap-4">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab flex-shrink-0" />
          <InfoIcon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
          <div className="flex-grow">
            <p className="font-semibold">{nombreBloque}</p>
            <p className="text-xs text-muted-foreground">Orden: {bloque.orden + 1}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" onClick={() => onMover(index, 'arriba')} disabled={index === 0 || esEsteBloqueElQueSeElimina}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onMover(index, 'abajo')} disabled={index === totalBloques - 1 || esEsteBloqueElQueSeElimina}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-[100px]">
                <Edit className="mr-2 h-4 w-4" /> {isOpen ? "Cerrar" : "Editar"}
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <Button variant="destructive" size="icon" onClick={() => onEliminar(bloque.id)} disabled={esEsteBloqueElQueSeElimina}>
              {deletingId === bloque.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
            </Button>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="border-t pt-6">
            {renderFormularioEdicion(bloque)}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
