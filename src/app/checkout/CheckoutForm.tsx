"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { createOrder } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Loader2, ShoppingBag } from 'lucide-react';
// CORRECCIÓN: Importamos el nuevo tipo 'Propietario'
import type { Propietario } from '@/app/dashboard/propietarios/types';

interface CheckoutFormProps {
  // CORRECCIÓN: Usamos el tipo correcto 'Propietario'
  userData?: Propietario | null;
}

type FieldErrors = {
    nombre_completo?: string[]; // <-- CAMBIO: a nombre_completo
    email?: string[];
    direccion?: string[];
    localidad?: string[];
    provincia?: string[];
    codigo_postal?: string[];
    telefono?: string[];
};

export default function CheckoutForm({ userData }: CheckoutFormProps) {
  const { cartItems, totalAmount, clearCart, itemCount } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createOrder(cartItems, totalAmount, formData);

      if (!result.success) {
        setError(result.error?.message || "Ocurrió un error desconocido.");
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors);
        }
      } else {
        setOrderSuccess(result.orderId);
        clearCart();
        setTimeout(() => {
          router.push(`/pedido/confirmacion?orderId=${result.orderId}`);
        }, 3000);
      }
    });
  };
  
  if (itemCount === 0 && !orderSuccess) {
     return (
      <div className="text-center py-20 px-4">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-400" />
        <h2 className="mt-4 text-2xl font-bold text-gray-800">Tu carrito está vacío</h2>
        <p className="mt-2 text-gray-500">No puedes finalizar una compra sin productos.</p>
        <Button asChild className="mt-6"><Link href="/tienda">Volver a la Tienda</Link></Button>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="text-center py-20">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-800">¡Pedido realizado con éxito!</h2>
        <p className="mt-2 text-gray-500">Gracias por tu compra. Recibirás una confirmación en tu correo electrónico.</p>
        <p className="text-sm text-gray-400 mt-2">Nº de pedido: {orderSuccess}</p>
        <p className="text-sm text-gray-400 mt-4">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <Card>
        <CardHeader><CardTitle>Datos de Envío</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
              <Label htmlFor="nombre_completo">Nombre completo</Label>
              <Input id="nombre_completo" name="nombre_completo" defaultValue={userData?.nombre_completo || ''} required />
              {fieldErrors?.nombre_completo && <p className="text-xs text-red-500">{fieldErrors.nombre_completo[0]}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" name="email" type="email" defaultValue={userData?.email || ''} required />
            {fieldErrors?.email && <p className="text-xs text-red-500">{fieldErrors.email[0]}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" name="direccion" defaultValue={userData?.direccion || ''} required />
            {fieldErrors?.direccion && <p className="text-xs text-red-500">{fieldErrors.direccion[0]}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="localidad">Localidad</Label>
              <Input id="localidad" name="localidad" defaultValue={userData?.localidad || ''} required />
              {fieldErrors?.localidad && <p className="text-xs text-red-500">{fieldErrors.localidad[0]}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="provincia">Provincia</Label>
              <Input id="provincia" name="provincia" defaultValue={userData?.provincia || 'Santa Cruz de Tenerife'} required />
              {fieldErrors?.provincia && <p className="text-xs text-red-500">{fieldErrors.provincia[0]}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="codigo_postal">Código Postal</Label>
              <Input id="codigo_postal" name="codigo_postal" defaultValue={userData?.codigo_postal || ''} required />
              {fieldErrors?.codigo_postal && <p className="text-xs text-red-500">{fieldErrors.codigo_postal[0]}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="telefono">Teléfono (opcional)</Label>
            <Input id="telefono" name="telefono" defaultValue={userData?.telefono || ''} />
          </div>
          {!userData && (
            <div className="pt-4">
              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Opcional</span></div></div>
              <div className="mt-4 flex items-center space-x-2">
                 <Checkbox id="create-account" name="create_account" />
                 <label htmlFor="create-account" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Quiero crear una cuenta con estos datos</label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Crea una cuenta para ver tu historial de pedidos y agilizar tus futuras compras.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div>
        <Card className="sticky top-24">
          <CardHeader><CardTitle>Tu Pedido</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <Image src={item.imagenUrl} alt={item.nombre} width={48} height={48} className="rounded-md border h-12 w-12 object-cover"/>
                    <div>
                      <p className="font-medium">{item.nombre}</p>
                      <p className="text-muted-foreground">Cantidad: {item.cantidad}</p>
                    </div>
                  </div>
                  <p className="font-medium">{(item.precioFinal * item.cantidad).toFixed(2)} €</p>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm"><p className="text-muted-foreground">Subtotal</p><p className="font-medium">{totalAmount.toFixed(2)} €</p></div>
              <div className="flex justify-between text-sm"><p className="text-muted-foreground">Envío</p><p className="font-medium">Gratis</p></div>
              <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg"><p>Total</p><p>{totalAmount.toFixed(2)} €</p></div>
            </div>
            {error && (<div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> {error}</div>)}
            <Button type="submit" size="lg" className="w-full mt-6" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Procesando pedido...' : 'Finalizar y Pagar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
