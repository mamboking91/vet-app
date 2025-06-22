"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CartView() {
  const { cartItems, removeFromCart, updateQuantity, totalAmount, itemCount } = useCart();

  if (itemCount === 0) {
    return (
      <div className="text-center py-20 px-4">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-400" />
        <h2 className="mt-4 text-2xl font-bold text-gray-800">Tu carrito está vacío</h2>
        <p className="mt-2 text-gray-500">
          Parece que aún no has añadido ningún producto. ¡Explora nuestra tienda para empezar!
        </p>
        <Button asChild className="mt-6">
          <Link href="/tienda">Ir a la Tienda</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Columna de los artículos del carrito */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Tu Carrito ({itemCount} {itemCount === 1 ? 'artículo' : 'artículos'})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-200">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 py-4">
                <div className="flex-shrink-0">
                  <Image
                    src={item.imagenUrl}
                    alt={item.nombre}
                    width={80}
                    height={80}
                    className="rounded-md object-cover h-20 w-20 border"
                  />
                </div>
                <div className="flex-grow">
                  <Link href={`/tienda/${item.id}`} className="font-semibold text-gray-800 hover:text-blue-600">
                    {item.nombre}
                  </Link>
                  <p className="text-gray-500 text-sm mt-1">{item.precioFinal.toFixed(2)} €</p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                    className="w-20 h-10 text-center"
                  />
                   <Button variant="outline" size="icon" onClick={() => removeFromCart(item.id)} title="Eliminar artículo">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Columna del resumen del pedido */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Resumen del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{totalAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span className="text-green-600 font-medium">Gratis</span>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{totalAmount.toFixed(2)} €</span>
            </div>
            {/* CORRECCIÓN: Botón envuelto en un Link */}
            <Button asChild size="lg" className="w-full mt-4">
              <Link href="/checkout">
                Proceder al Pago <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
