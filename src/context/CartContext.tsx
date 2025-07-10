"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ProductoConStock } from '@/app/dashboard/inventario/types';
import type { CodigoDescuento } from '@/app/dashboard/descuentos/types';

export interface CartItem extends ProductoConStock {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: ProductoConStock, quantity: number) => void;
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
    const impuesto = Number(item.porcentaje_impuesto) || 0;
    const precioConImpuesto = precioBase * (1 + impuesto / 100);
    return sum + precioConImpuesto * item.quantity;
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

  const value = {
    cart,
    addToCart,
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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}