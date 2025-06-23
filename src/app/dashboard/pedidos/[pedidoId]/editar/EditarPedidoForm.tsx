// app/dashboard/pedidos/[pedidoId]/editar/EditarPedidoForm.tsx
"use client";

import React, { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { actualizarPedido } from '@/app/dashboard/pedidos/actions';
import type { Pedido, DireccionEnvio } from '@/app/dashboard/pedidos/types';
import type { ProductoInventarioParaFactura } from '@/app/dashboard/facturacion/types';
import { toast } from 'sonner';
import { Save, Loader2, X, AlertCircle, Package, User, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Tipos locales para el formulario
type PedidoConItems = Pedido & {
  items_pedido: {
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
     productos_inventario: {
        nombre: string;
        precio_venta: number | null;
        porcentaje_impuesto: number | null;
    } | null;
  }[];
};

interface ItemPedidoEdit {
  id_temporal: string;
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_base: number;
  porcentaje_impuesto: number;
  precio_final_unitario: number;
  subtotal: number;
}

interface EditarPedidoFormProps {
  pedido: PedidoConItems;
  productosDisponibles: ProductoInventarioParaFactura[];
}

export default function EditarPedidoForm({ pedido, productosDisponibles }: EditarPedidoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [direccionEnvio, setDireccionEnvio] = useState<DireccionEnvio>(pedido.direccion_envio || {});
  const [items, setItems] = useState<ItemPedidoEdit[]>(
    pedido.items_pedido.map(item => {
      const precioBase = item.productos_inventario?.precio_venta ?? 0;
      const impuesto = item.productos_inventario?.porcentaje_impuesto ?? 0;
      return {
        id_temporal: crypto.randomUUID(),
        producto_id: item.producto_id,
        nombre: item.productos_inventario?.nombre || 'Producto no encontrado',
        cantidad: item.cantidad,
        precio_base: precioBase,
        porcentaje_impuesto: impuesto,
        precio_final_unitario: item.precio_unitario,
        subtotal: item.cantidad * item.precio_unitario,
      };
    })
  );

  const handleDireccionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDireccionEnvio(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddItem = (productId: string) => {
    const producto = productosDisponibles.find(p => p.id === productId);
    if (!producto) return;

    if (items.some(item => item.producto_id === productId)) {
      toast.info(`"${producto.nombre}" ya está en el pedido. Puedes ajustar la cantidad.`);
      return;
    }

    const precioBase = producto.precio_venta || 0;
    const impuesto = producto.porcentaje_impuesto || 0;
    const precioFinal = precioBase * (1 + impuesto / 100);

    const nuevoItem: ItemPedidoEdit = {
      id_temporal: crypto.randomUUID(),
      producto_id: producto.id,
      nombre: producto.nombre,
      cantidad: 1,
      precio_base: precioBase,
      porcentaje_impuesto: impuesto,
      precio_final_unitario: precioFinal,
      subtotal: precioFinal,
    };
    setItems(prev => [...prev, nuevoItem]);
  };

  const handleUpdateCantidad = (id_temporal: string, cantidad: number) => {
    setItems(prev => prev.map(item => {
      if (item.id_temporal === id_temporal) {
        const nuevaCantidad = Math.max(1, cantidad);
        return { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precio_final_unitario };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id_temporal: string) => {
    setItems(prev => prev.filter(item => item.id_temporal !== id_temporal));
  };

  const totalPedido = useMemo(() => items.reduce((acc, item) => acc + item.subtotal, 0), [items]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (items.length === 0) {
        setError("El pedido debe tener al menos un producto.");
        toast.error("El pedido no puede quedar vacío.");
        return;
    }

    // --- CORRECCIÓN: CONSTRUIMOS EL PAYLOAD CON TODOS LOS DATOS NECESARIOS ---
    const payload = {
      direccion_envio: direccionEnvio,
      items: items.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_base, // Enviamos el precio BASE
        porcentaje_impuesto: item.porcentaje_impuesto, // Enviamos el impuesto
        descripcion: item.nombre, // Enviamos la descripción para la factura
      })),
    };

    startTransition(async () => {
      const result = await actualizarPedido(pedido.id, payload);
      if (result.success) {
        toast.success(result.message);
        router.push(`/dashboard/pedidos/${pedido.id}`);
      } else {
        const errorMessage = result.error?.message || "Error al actualizar.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600"/>Datos de Envío</CardTitle>
              <CardDescription>Actualiza la información del cliente y la dirección de envío.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                <Input id="nombre_completo" name="nombre_completo" value={direccionEnvio.nombre_completo || ''} onChange={handleDireccionChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección (Calle y Número) *</Label>
                <Input id="direccion" name="direccion" value={direccionEnvio.direccion || ''} onChange={handleDireccionChange} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="localidad">Localidad *</Label><Input id="localidad" name="localidad" value={direccionEnvio.localidad || ''} onChange={handleDireccionChange} required /></div>
                <div className="space-y-2"><Label htmlFor="provincia">Provincia *</Label><Input id="provincia" name="provincia" value={direccionEnvio.provincia || ''} onChange={handleDireccionChange} required /></div>
                <div className="space-y-2"><Label htmlFor="codigo_postal">Cód. Postal *</Label><Input id="codigo_postal" name="codigo_postal" value={direccionEnvio.codigo_postal || ''} onChange={handleDireccionChange} required /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono (Opcional)</Label>
                <Input id="telefono" name="telefono" value={direccionEnvio.telefono || ''} onChange={handleDireccionChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-green-600"/>Items del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border-b">
                <Label>Añadir Producto</Label>
                 <Select onValueChange={handleAddItem}>
                  <SelectTrigger><SelectValue placeholder="Busca un producto para añadirlo al pedido..." /></SelectTrigger>
                  <SelectContent>{productosDisponibles.map(p => (<SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="w-24 text-center">Cant.</TableHead>
                        <TableHead className="text-right">Precio Base</TableHead>
                        <TableHead className="text-right">% IGIC</TableHead>
                        <TableHead className="text-right">Total Item</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? items.map(item => (
                    <TableRow key={item.id_temporal}>
                      <TableCell className="font-medium">{item.nombre}</TableCell>
                      <TableCell>
                        <Input type="number" value={item.cantidad} onChange={(e) => handleUpdateCantidad(item.id_temporal, parseInt(e.target.value) || 1)} className="w-20 h-9 text-center" min="1"/>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.precio_base)}</TableCell>
                      <TableCell className="text-right">{item.porcentaje_impuesto}%</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.subtotal)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" type="button" onClick={() => handleRemoveItem(item.id_temporal)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">Añade productos para empezar.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-xl"><p>Total</p><p>{formatCurrency(totalPedido)}</p></div>
                <p className="text-xs text-muted-foreground">El total se recalcula al modificar los artículos.</p>
              </div>
               {error && <p className="mt-4 text-sm text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {error}</p>}
              <div className="mt-6 flex justify-end">
                <Button type="submit" size="lg" disabled={isPending || items.length === 0}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isPending ? 'Actualizando...' : 'Guardar Cambios en Pedido'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}