"use client";

import { useState } from 'react';
import { useCart, type CartItem } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, PackageX } from 'lucide-react';

interface AddToCartButtonProps {
  product: Omit<CartItem, 'cantidad'>;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart, cartItems } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const itemInCart = cartItems.find(item => item.id === product.id);
  const quantityInCart = itemInCart?.cantidad || 0;
  const stockDisponible = product.stock_disponible;
  const isOutOfStock = stockDisponible <= 0;
  const canAddToCart = stockDisponible > quantityInCart;

  const handleAddToCart = () => {
    if (!canAddToCart) return;

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
            Producto Agotado
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