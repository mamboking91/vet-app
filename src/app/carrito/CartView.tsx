// src/app/carrito/CartView.tsx
"use client";

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, AlertTriangle, ArrowRight, Minus, Plus, Loader2, XCircle } from 'lucide-react';
import { useState, useTransition } from 'react';
import { aplicarCodigoDescuento } from './actions';
import { toast } from 'sonner';

export default function CartView() {
  const {
    cart, updateQuantity, removeFromCart, subtotal, total, 
    aplicarDescuento, removerDescuento, descuentoAplicado, montoDescuento
  } = useCart();

  const [codigoInput, setCodigoInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleApplyCode = async () => {
    startTransition(async () => {
      const result = await aplicarCodigoDescuento(codigoInput, subtotal);
      if (result.success && result.descuento) {
        aplicarDescuento(result.descuento);
        toast.success(`Código "${result.descuento.codigo}" aplicado.`);
        setCodigoInput('');
      } else {
        toast.error("Error al aplicar código", { description: result.error?.message });
      }
    });
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
        <p className="text-muted-foreground mb-6">Parece que aún no has añadido ningún producto.</p>
        <Button asChild><Link href="/tienda">Explorar la tienda</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Card>
          <CardHeader><CardTitle>Tu Carrito ({cart.length} productos)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map(item => {
                  const precioConImpuesto = (Number(item.precio_venta) || 0) * (1 + (Number(item.porcentaje_impuesto) || 0) / 100);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-md bg-gray-100 flex-shrink-0">
                            <Image src={item.imagenes?.[0]?.url || ''} alt={item.nombre} width={64} height={64} className="object-cover w-full h-full rounded-md" />
                          </div>
                          <div>
                            <p className="font-medium">{item.nombre}</p>
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground p-0 h-auto" onClick={() => removeFromCart(item.id)}>
                              <Trash2 className="h-3 w-3 mr-1"/>Eliminar
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{precioConImpuesto.toFixed(2)}€</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}><Minus className="h-4 w-4" /></Button>
                          <span>{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{(precioConImpuesto * item.quantity).toFixed(2)}€</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Resumen del Pedido</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toFixed(2)}€</span></div>
                {descuentoAplicado && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-2">
                      Descuento ({descuentoAplicado.codigo})
                      <button onClick={removerDescuento} title="Eliminar descuento"><XCircle className="h-4 w-4"/></button>
                    </span>
                    <span>-{montoDescuento.toFixed(2)}€</span>
                  </div>
                )}
            </div>
            <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{total.toFixed(2)}€</span></div>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            {!descuentoAplicado && (
              <div className="flex gap-2">
                <Input placeholder="Código de descuento" value={codigoInput} onChange={(e) => setCodigoInput(e.target.value.toUpperCase())} disabled={isPending}/>
                <Button onClick={handleApplyCode} disabled={!codigoInput || isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Aplicar"}
                </Button>
              </div>
            )}
            <Button asChild size="lg" className="w-full">
                <Link href="/checkout">Proceder al Pago <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
