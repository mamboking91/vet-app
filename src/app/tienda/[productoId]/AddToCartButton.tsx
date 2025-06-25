"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, PackageX } from 'lucide-react';
// Se importa el tipo correcto para un producto del catálogo
import type { ProductoCatalogo } from '@/app/dashboard/inventario/types';

interface AddToCartButtonProps {
  // La prop 'product' ahora tiene el tipo correcto y más claro
  product: ProductoCatalogo;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  // CORRECCIÓN 1: Se usa 'cart' en lugar de 'cartItems' para que coincida con el contexto.
  const { addToCart, cart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // CORRECCIÓN 2: Se usa 'cart' para buscar el item.
  const itemInCart = cart.find(item => item.id === product.id);
  
  // CORRECCIÓN 3: Se usa 'quantity' en lugar de 'cantidad'.
  const quantityInCart = itemInCart?.quantity || 0;
  
  // La propiedad 'stock_disponible' ahora existe en el tipo ProductoCatalogo.
  const stockDisponible = product.stock_disponible ?? 0;
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
