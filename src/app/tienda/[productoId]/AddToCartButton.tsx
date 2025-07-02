"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, PackageX } from 'lucide-react';
// Se importa el tipo correcto que representa una variante con stock
import type { ProductoConStock } from '@/app/dashboard/inventario/types';

interface AddToCartButtonProps {
  // La prop 'product' ahora es del tipo correcto y puede ser null si no hay variante seleccionada
  product: ProductoConStock | null;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart, cart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // Verificamos si el producto (variante) actual ya está en el carrito
  const itemInCart = product ? cart.find(item => item.id === product.id) : undefined;
  const quantityInCart = itemInCart?.quantity || 0;
  
  // Usamos el stock de la variante seleccionada
  const stockDisponible = product?.stock_total_actual ?? 0;
  const isOutOfStock = !product || stockDisponible <= 0;
  const canAddToCart = !isOutOfStock && stockDisponible > quantityInCart;

  const handleAddToCart = () => {
    // Solo añadimos si hay un producto y se puede añadir
    if (!product || !canAddToCart) return;

    addToCart(product, 1);
    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  if (isOutOfStock) {
    return (
        <Button size="lg" className="w-full text-lg py-6" disabled>
            <PackageX className="mr-2 h-5 w-5" />
            Agotado
        </Button>
    );
  }

  return (
    <Button 
      size="lg" 
      className={`w-full text-lg py-6 transition-all duration-300 ${isAdded ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
      onClick={handleAddToCart}
      disabled={isAdded || !canAddToCart}
    >
      {isAdded ? (
        <>
          <Check className="mr-2 h-5 w-5" />
          Añadido al carrito
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          {canAddToCart ? 'Añadir al Carrito' : 'No hay más stock'}
        </>
      )}
    </Button>
  );
}