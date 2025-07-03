"use client";

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCart } from '@/context/CartContext';
import { createSumupCheckout, createStripeCheckout } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Lock, CreditCard } from 'lucide-react';
import type { Propietario } from '@/app/dashboard/propietarios/types';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

interface CheckoutFormProps {
  userData?: Propietario | null;
}

declare global {
    interface Window { SumUpCard: any; }
}

export default function CheckoutForm({ userData }: CheckoutFormProps) {
  // Obtenemos todos los datos del carrito, incluyendo el subtotal y descuento
  const { cart, total, subtotal, montoDescuento, clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSumupReady, setIsSumupReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'sumup'>('stripe');
  const sumupCard = useRef<any>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    if (sumupCard.current) {
        sumupCard.current.unmount();
    }
    
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      if (paymentMethod === 'stripe') {
        const result = await createStripeCheckout(cart, montoDescuento, formData);
        if (result.success && result.checkoutUrl) {
          router.push(result.checkoutUrl);
        } else {
          setError(result.error || "No se pudo procesar el pago con Stripe.");
          setIsSubmitting(false);
        }
      } else { // SumUp
        const result = await createSumupCheckout(cart, montoDescuento, formData);
        if (!result.success || !result.checkoutId) {
          setError(result.error || "No se pudo iniciar el proceso de pago con SumUp.");
          setIsSubmitting(false);
          return;
        }
        
        try {
           sumupCard.current = window.SumUpCard.mount({
              id: 'sumup-card-container',
              checkoutId: result.checkoutId,
              onResponse: (_: any, body: any) => {
                  if (body.status === 'SUCCESSFUL') {
                      clearCart();
                      router.push(`/pedido/confirmacion?checkout_id=${body.checkout_reference}`);
                  } else {
                       setError(`El pago ha fallado: ${body.error_message || 'Inténtelo de nuevo.'}`);
                       setIsSubmitting(false);
                  }
              },
           });
        } catch (e: any) {
          setError("Error al mostrar el formulario de pago de SumUp.");
          setIsSubmitting(false);
        }
      }
    });
  };
      
  return (
    <>
        <Script
            src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"
            onLoad={() => setIsSumupReady(true)}
            strategy="afterInteractive"
        />
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Card>
            <CardHeader><CardTitle>1. Datos de Envío</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
              
               {!userData && (
                <div className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="create_account" name="create_account" disabled={isSubmitting} />
                    <label htmlFor="create_account" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Quiero crear una cuenta con estos datos</label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Crea una cuenta para ver tu historial de pedidos y agilizar tus futuras compras.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div>
            <Card className="sticky top-24">
              <CardHeader><CardTitle>2. Resumen y Pago</CardTitle></CardHeader>
              <CardContent>
                {/* --- INICIO DE LA CORRECCIÓN --- */}
                <div className="space-y-3 mb-4 border-b pb-4">
                    {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <Image 
                                    src={item.imagen_producto_principal || '/placeholder.svg'}
                                    alt={item.nombre}
                                    width={40}
                                    height={40}
                                    className="rounded-md border object-cover"
                                />
                                <div>
                                    <p className="font-medium text-gray-800">{item.nombre}</p>
                                    <p className="text-muted-foreground">Cantidad: {item.quantity}</p>
                                </div>
                            </div>
                            <p className="text-gray-900">{formatCurrency(item.precio_venta! * (1 + item.porcentaje_impuesto / 100) * item.quantity)}</p>
                        </div>
                    ))}
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {montoDescuento > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span className="text-muted-foreground">Descuento</span>
                            <span>-{formatCurrency(montoDescuento)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <p>Total a Pagar</p>
                        <p>{formatCurrency(total)}</p>
                    </div>
                </div>
                {/* --- FIN DE LA CORRECCIÓN --- */}
                
                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'stripe' | 'sumup')} className="my-6 space-y-2">
                    <Label className={cn("flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition-all", paymentMethod === 'stripe' && 'bg-blue-50 border-blue-500 ring-2 ring-blue-500')}>
                        <RadioGroupItem value="stripe" id="stripe"/>
                        <CreditCard className="h-5 w-5"/>
                        <span className="font-semibold">Pagar con Tarjeta (Stripe)</span>
                    </Label>
                    <Label className={cn("flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition-all", paymentMethod === 'sumup' && 'bg-blue-50 border-blue-500 ring-2 ring-blue-500', !isSumupReady && 'opacity-50 cursor-not-allowed')}>
                        <RadioGroupItem value="sumup" id="sumup" disabled={!isSumupReady}/>
                        <CreditCard className="h-5 w-5"/>
                        <span className="font-semibold">Pagar con Tarjeta (SumUp)</span>
                         {!isSumupReady && <Loader2 className="h-4 w-4 animate-spin ml-auto"/>}
                    </Label>
                </RadioGroup>
                
                {paymentMethod === 'sumup' && (
                    <div id="sumup-card-container" className="mt-6 min-h-[150px]">
                        {isSubmitting && (
                            <div className="text-center p-4 flex flex-col items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600"/>
                                <p className="text-sm text-muted-foreground mt-2">Cargando formulario de pago seguro...</p>
                            </div>
                        )}
                    </div>
                )}
                
                {error && (<div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> {error}</div>)}
                <Button type="submit" size="lg" className="w-full mt-6" disabled={isProcessing || isSubmitting || (paymentMethod === 'sumup' && !isSumupReady)}>
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