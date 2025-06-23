"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner"; // Importamos toast para notificaciones

export interface CartItem {
  id: string;
  nombre: string;
  precioFinal: number;
  cantidad: number;
  imagenUrl: string;
  stock_disponible: number; // <-- AÑADIMOS EL STOCK
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'cantidad'>, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('shoppingCart');
      if (storedCart) setCartItems(JSON.parse(storedCart));
    } catch (error) { console.error("Failed to parse cart from localStorage", error); }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('shoppingCart', JSON.stringify(cartItems)); } 
    catch (error) { console.error("Failed to save cart to localStorage", error); }
  }, [cartItems]);

  const addToCart = (product: Omit<CartItem, 'cantidad'>, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);

      if (existingItem) {
        const newQuantity = existingItem.cantidad + quantity;
        if (newQuantity > existingItem.stock_disponible) {
          toast.error(`No puedes añadir más unidades de "${product.nombre}"`, {
            description: `Solo quedan ${existingItem.stock_disponible} disponibles.`,
          });
          return prevItems; // No hacer cambios si se excede el stock
        }
        toast.success(`"${product.nombre}" añadido al carrito.`);
        return prevItems.map(item =>
          item.id === product.id ? { ...item, cantidad: newQuantity } : item
        );
      } else {
        if (quantity > product.stock_disponible) {
           toast.error(`No puedes añadir el producto "${product.nombre}"`, {
            description: `Solo quedan ${product.stock_disponible} disponibles.`,
          });
          return prevItems;
        }
        toast.success(`"${product.nombre}" añadido al carrito.`);
        return [...prevItems, { ...product, cantidad: quantity }];
      }
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          if (newQuantity > item.stock_disponible) {
            toast.error(`No puedes añadir más unidades de "${item.nombre}"`, {
                description: `Solo quedan ${item.stock_disponible} disponibles.`,
            });
            return item; // No hacer cambios
          }
          if (newQuantity <= 0) {
            // Se podría eliminar, pero por ahora lo dejamos en 1 como mínimo desde el input.
            // Opcionalmente, se podría llamar a `removeFromCart(itemId)` aquí.
            return { ...item, cantidad: 1 };
          }
          return { ...item, cantidad: newQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };
  const clearCart = () => setCartItems([]);

  const itemCount = cartItems.reduce((total, item) => total + item.cantidad, 0);
  const totalAmount = cartItems.reduce((total, item) => total + item.precioFinal * item.cantidad, 0);

  const value = { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, totalAmount };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}