"use client";

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCart } from '@/context/CartContext';
import { createSumupCheckout } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Lock } from 'lucide-react';
import type { Propietario } from '@/app/dashboard/propietarios/types';

interface CheckoutFormProps {
  userData?: Propietario | null;
}

// Declarar el objeto SumUpCard en el ámbito global para TypeScript
declare global {
    interface Window {
        SumUpCard: any;
    }
}

export default function CheckoutForm({ userData }: CheckoutFormProps) {
  const { cartItems, totalAmount, clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSumupReady, setIsSumupReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sumupCard = useRef<any>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      // 1. Crear el checkout en nuestro backend para obtener el checkoutId
      const result = await createSumupCheckout(cartItems, totalAmount, formData);

      if (!result.success || !result.checkoutId) {
        setError(result.error || "No se pudo iniciar el proceso de pago.");
        setIsSubmitting(false);
        return;
      }

      // 2. Montar y presentar el widget de tarjeta de SumUp
      try {
         if (sumupCard.current) {
            sumupCard.current.unmount();
         }
         sumupCard.current = window.SumUpCard.mount({
            id: 'sumup-card-container',
            checkoutId: result.checkoutId,
            onResponse: (type: any, body: any) => {
                if (body.status === 'SUCCESSFUL') {
                    clearCart();
                    router.push(`/pedido/confirmacion?orderId=${body.checkout_reference}`);
                } else {
                     setError(`El pago ha fallado: ${body.error_message || 'Inténtelo de nuevo.'}`);
                     setIsSubmitting(false);
                }
            },
         });
      } catch (e: any) {
        console.error("Error mounting SumUp card:", e);
        setError("Error al mostrar el formulario de pago.");
        setIsSubmitting(false);
      }
    });
  };

  return (
    <>
        <Script
            src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"
            onLoad={() => setIsSumupReady(true)}
        />
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card>
            <CardHeader>
                <CardTitle>1. Datos de Envío</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Campos del formulario (igual que antes) */}
              <div className="space-y-1">
                <Label htmlFor="nombre_completo">Nombre completo</Label>
                <Input id="nombre_completo" name="nombre_completo" defaultValue={userData?.nombre_completo || ''} required disabled={isSubmitting} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" name="email" type="email" defaultValue={userData?.email || ''} required disabled={isSubmitting} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" name="direccion" defaultValue={userData?.direccion || ''} required disabled={isSubmitting} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1"><Label htmlFor="localidad">Localidad</Label><Input id="localidad" name="localidad" defaultValue={userData?.localidad || ''} required disabled={isSubmitting} /></div>
                <div className="space-y-1"><Label htmlFor="provincia">Provincia</Label><Input id="provincia" name="provincia" defaultValue={userData?.provincia || 'Santa Cruz de Tenerife'} required disabled={isSubmitting} /></div>
                <div className="space-y-1"><Label htmlFor="codigo_postal">Código Postal</Label><Input id="codigo_postal" name="codigo_postal" defaultValue={userData?.codigo_postal || ''} required disabled={isSubmitting} /></div>
              </div>
               <div className="space-y-1"><Label htmlFor="telefono">Teléfono (opcional)</Label><Input id="telefono" name="telefono" defaultValue={userData?.telefono || ''} disabled={isSubmitting} /></div>
            </CardContent>
          </Card>

          <div>
            <Card className="sticky top-24">
              <CardHeader><CardTitle>2. Resumen y Pago</CardTitle></CardHeader>
              <CardContent>
                 <div className="border-t mt-4 pt-4 space-y-2">
                  <div className="flex justify-between font-bold text-lg"><p>Total a Pagar</p><p>{totalAmount.toFixed(2)} €</p></div>
                </div>

                {/* Contenedor para el Widget de SumUp */}
                <div id="sumup-card-container" className="mt-6">
                    {isSubmitting && !sumupCard.current && (
                        <div className="text-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto"/>
                            <p className="text-sm text-muted-foreground mt-2">Cargando formulario de pago...</p>
                        </div>
                    )}
                </div>

                {error && (<div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> {error}</div>)}

                {/* El botón ahora genera el widget y el widget se encarga del pago */}
                <Button type="submit" size="lg" className="w-full mt-6" disabled={isProcessing || !isSumupReady || isSubmitting}>
                  <Lock className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Procesando...' : 'Continuar al Pago Seguro'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
    </>
  );
}