"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCart } from '@/context/CartContext';
// import { createSumupCheckout } from './actions'; // Comentamos la acción que da error
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Lock } from 'lucide-react';
import type { Propietario } from '@/app/dashboard/propietarios/types';
import { toast } from 'sonner'; // Usaremos toast para el mensaje temporal

interface CheckoutFormProps {
  userData?: Propietario | null;
}

// Declaramos SumUpCard para que TypeScript no de error, aunque no lo usemos
declare global {
    interface Window { SumUpCard: any; }
}

export default function CheckoutForm({ userData }: CheckoutFormProps) {
  const { totalAmount } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // --- LÓGICA TEMPORAL ---
    // En lugar de llamar a SumUp, mostramos un mensaje informativo.
    toast.info("Funcionalidad de pago en desarrollo", {
      description: "La pasarela de pago online se activará próximamente. Por favor, contacta con la tienda para finalizar tu compra.",
      duration: 8000,
    });
    
    setIsSubmitting(false);

    /* --- LÓGICA ORIGINAL (LA REACTIVAREMOS MÁS ADELANTE) ---
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createSumupCheckout(cartItems, totalAmount, formData);
      if (!result.success || !result.checkoutId) {
        setError(result.error || "No se pudo iniciar el proceso de pago.");
        setIsSubmitting(false);
        return;
      }
      // ... resto de la lógica de SumUp
    });
    */
  };
      
  return (
    <>
      <Script
        src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"
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
          </CardContent>
        </Card>
        
        <div>
          <Card className="sticky top-24">
            <CardHeader><CardTitle>2. Resumen y Pago</CardTitle></CardHeader>
            <CardContent>
               <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between font-bold text-lg"><p>Total</p><p>{totalAmount.toFixed(2)} €</p></div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
                <p className="text-sm text-blue-800">La pasarela de pago online está en desarrollo.</p>
                <p className="text-xs text-blue-600 mt-1">Haz clic en el botón para simular el pedido.</p>
              </div>

              {error && (<div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> {error}</div>)}
              
              <Button type="submit" size="lg" className="w-full mt-6" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Procesando...' : 'Finalizar Compra (Simulación)'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </>
  );
}