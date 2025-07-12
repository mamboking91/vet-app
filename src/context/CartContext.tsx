// src/context/CartContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ProductoConStock } from '@/app/dashboard/inventario/types';
import type { CodigoDescuento } from '@/app/dashboard/descuentos/types';

export interface CartItem extends ProductoConStock {
  quantity: number;
}

// --- INICIO DE LA CORRECCIÓN ---
// 1. Añadir la firma de la nueva función a la interfaz del contexto
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: ProductoConStock, quantity: number) => void;
  addMultipleToCart: (products: (ProductoConStock & { quantity: number })[]) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  total: number;
  aplicarDescuento: (codigo: CodigoDescuento) => void;
  removerDescuento: () => void;
  descuentoAplicado: CodigoDescuento | null;
  montoDescuento: number;
}
// --- FIN DE LA CORRECCIÓN ---

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [descuentoAplicado, setDescuentoAplicado] = useState<CodigoDescuento | null>(null);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('shoppingCart');
      const storedDiscount = localStorage.getItem('appliedDiscount');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
      if (storedDiscount) {
        setDescuentoAplicado(JSON.parse(storedDiscount));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    if (descuentoAplicado) {
      localStorage.setItem('appliedDiscount', JSON.stringify(descuentoAplicado));
    } else {
      localStorage.removeItem('appliedDiscount');
    }
  }, [cart, descuentoAplicado]);

  const addToCart = (product: ProductoConStock, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  // --- INICIO DE LA CORRECCIÓN ---
  // 2. Implementar la lógica de la función
  const addMultipleToCart = (products: (ProductoConStock & { quantity: number })[]) => {
    setCart(prevCart => {
      const newCart = [...prevCart];
      products.forEach(productToAdd => {
        const existingItemIndex = newCart.findIndex(item => item.id === productToAdd.id);
        if (existingItemIndex > -1) {
          // Si el item ya existe, suma la cantidad
          newCart[existingItemIndex].quantity += productToAdd.quantity;
        } else {
          // Si no existe, lo añade al carrito
          newCart.push({ ...productToAdd });
        }
      });
      return newCart;
    });
  };
  // --- FIN DE LA CORRECCIÓN ---

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prevCart => prevCart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    removerDescuento();
  };
  
  const aplicarDescuento = (codigo: CodigoDescuento) => {
    setDescuentoAplicado(codigo);
  };
  
  const removerDescuento = () => {
    setDescuentoAplicado(null);
  };
  
  const subtotal = cart.reduce((sum, item) => {
    const precioBase = Number(item.precio_venta) || 0;
    return sum + precioBase * item.quantity;
  }, 0);

  let montoDescuento = 0;
  if (descuentoAplicado) {
    if (subtotal >= descuentoAplicado.compra_minima) {
      if (descuentoAplicado.tipo_descuento === 'porcentaje') {
        montoDescuento = (subtotal * descuentoAplicado.valor) / 100;
      } else {
        montoDescuento = descuentoAplicado.valor;
      }
      montoDescuento = Math.min(montoDescuento, subtotal);
    } else {
        removerDescuento();
    }
  }

  const total = subtotal - montoDescuento;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- INICIO DE LA CORRECCIÓN ---
  // 3. Añadir la función al objeto 'value' para que esté disponible para los componentes consumidores
  const value = {
    cart,
    addToCart,
    addMultipleToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    total,
    aplicarDescuento,
    removerDescuento,
    descuentoAplicado,
    montoDescuento,
  };
  // --- FIN DE LA CORRECCIÓN ---

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}