"use client";

import { useState } from 'react';
import { useCart, type CartItem } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';

// El botón necesita saber qué producto añadir. Recibe los datos como props.
interface AddToCartButtonProps {
  product: Omit<CartItem, 'cantidad'>;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, 1); // Añade una unidad del producto
    setIsAdded(true);

    // Muestra el estado "Añadido!" por 2 segundos y luego vuelve al estado normal
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  return (
    <Button 
      size="lg" 
      className={`w-full text-lg py-6 transition-all duration-300 ${isAdded ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
      onClick={handleAddToCart}
      disabled={isAdded}
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
