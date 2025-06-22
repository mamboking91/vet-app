"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ImagenProducto } from '@/app/dashboard/inventario/types';

// Define la estructura de un artículo en el carrito
export interface CartItem {
  id: string;
  nombre: string;
  precioFinal: number; // Guardaremos el precio final calculado
  cantidad: number;
  imagenUrl: string;
}

// Define lo que el contexto va a proveer
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'cantidad'>, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalAmount: number;
}

// Creamos el Contexto con un valor por defecto
const CartContext = createContext<CartContextType | undefined>(undefined);

// Creamos el Proveedor del Contexto (el "cerebro")
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Efecto para cargar el carrito desde localStorage cuando el componente se monta
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('shoppingCart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
    }
  }, []);

  // Efecto para guardar el carrito en localStorage cada vez que cambia
  useEffect(() => {
    try {
      localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems]);

  const addToCart = (product: Omit<CartItem, 'cantidad'>, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        // Si el item ya existe, actualiza su cantidad
        return prevItems.map(item =>
          item.id === product.id ? { ...item, cantidad: item.cantidad + quantity } : item
        );
      } else {
        // Si es un item nuevo, lo añade al carrito
        return [...prevItems, { ...product, cantidad: quantity }];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Si la nueva cantidad es 0 o menos, elimina el artículo
      removeFromCart(itemId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, cantidad: newQuantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculamos el número total de artículos y el importe total
  const itemCount = cartItems.reduce((total, item) => total + item.cantidad, 0);
  const totalAmount = cartItems.reduce((total, item) => total + item.precioFinal * item.cantidad, 0);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    totalAmount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook personalizado para usar el contexto del carrito fácilmente
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
