"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';
import type { ProductoConStock } from '@/app/dashboard/inventario/types';

interface AddToCartButtonProps {
  product: ProductoConStock | null;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // --- CORRECCIÓN AQUÍ: La lógica ahora siempre permite añadir al carrito ---
  const canAddToCart = !!product;

  const handleAddToCart = () => {
    if (!product) return;

    addToCart(product, 1);
    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

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
          Añadir al Carrito
        </>
      )}
    </Button>
  );
}