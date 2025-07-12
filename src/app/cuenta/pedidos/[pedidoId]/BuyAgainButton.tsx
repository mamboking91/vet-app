// src/app/cuenta/pedidos/[pedidoId]/BuyAgainButton.tsx
"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ItemPedido } from './page';
import type { ProductoConStock } from '@/app/dashboard/inventario/types';

interface BuyAgainButtonProps {
  items: ItemPedido[];
}

export default function BuyAgainButton({ items }: BuyAgainButtonProps) {
  const { addMultipleToCart } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAdded, setIsAdded] = useState(false);

  const handleBuyAgain = () => {
    startTransition(() => {
      const itemsParaAñadir = items
        .map(item => {
          if (!item.producto_variantes || !item.producto_variantes.productos_catalogo) {
            return null;
          }

          const variante = item.producto_variantes;
          const catalogo = item.producto_variantes.productos_catalogo;
          const nombreVariante = variante.atributos && variante.atributos.default !== 'default' 
            ? Object.values(variante.atributos).join(', ') 
            : 'Variante';


          const productoCompleto: ProductoConStock & { quantity: number } = {
            id: variante.id,
            quantity: item.cantidad,
            producto_padre_id: catalogo.id,
            nombre: `${catalogo.nombre} (${nombreVariante})`,
            descripcion: catalogo.descripcion_publica,
            codigo_producto: variante.sku,
            precio_venta: item.precio_unitario,
            porcentaje_impuesto: catalogo.porcentaje_impuesto,
            requiere_lote: catalogo.requiere_lote,
            en_tienda: catalogo.en_tienda,
            destacado: catalogo.destacado,
            imagen_producto_principal: catalogo.imagenes?.find(img => img.isPrimary)?.url || catalogo.imagenes?.[0]?.url || null,
            imagen_variante_url: variante.imagen_url,
            atributos: variante.atributos,
            imagenes: catalogo.imagenes,
            categorias_tienda: null,
            stock_total_actual: 1,
            proxima_fecha_caducidad: null,
          };
          
          return productoCompleto;
        })
        .filter((item): item is ProductoConStock & { quantity: number } => item !== null);
      
      if (itemsParaAñadir.length === 0) {
        toast.error("No se pudieron añadir los productos", { description: "Parece que los productos de este pedido ya no están disponibles."});
        return;
      }

      addMultipleToCart(itemsParaAñadir);
      
      setIsAdded(true);
      toast.success("¡Productos añadidos al carrito!", {
        description: "Se han añadido todos los artículos de este pedido a tu carrito de compra.",
        action: {
          label: 'Ver Carrito',
          onClick: () => router.push('/carrito'),
        },
      });

      setTimeout(() => setIsAdded(false), 3000);
    });
  };

  return (
    <Button onClick={handleBuyAgain} disabled={isPending || isAdded}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isAdded ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      {isAdded ? 'Añadido al Carrito' : 'Comprar de Nuevo'}
    </Button>
  );
}