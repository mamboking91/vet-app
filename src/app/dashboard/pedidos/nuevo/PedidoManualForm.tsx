"use client";

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, Search, User, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createManualOrder } from '../actions';

// Tipos de datos que el formulario recibe como props
type ClienteParaSelector = {
  id: string;
  nombre_completo: string;
};

type ProductoParaSelector = {
  id: string;
  nombre: string;
  precio_venta: number | null;
  porcentaje_impuesto: number;
};

// Tipo para los items dentro del carrito del formulario
type ItemPedidoForm = {
  id_temporal: string;
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number; // Precio base sin impuestos
  porcentaje_impuesto: number;
  subtotal: number; // Precio final con impuestos
};

interface PedidoManualFormProps {
  clientes: ClienteParaSelector[];
  productos: ProductoParaSelector[];
}

export default function PedidoManualForm({ clientes, productos }: PedidoManualFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('');
  const [items, setItems] = useState<ItemPedidoForm[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = (producto: ProductoParaSelector) => {
    if (producto.precio_venta === null) {
      toast.error(`El producto "${producto.nombre}" no tiene un precio de venta asignado.`);
      return;
    }
    if (items.some(item => item.producto_id === producto.id)) {
      toast.info(`"${producto.nombre}" ya está en el pedido. Puedes ajustar la cantidad.`);
      return;
    }

    // CORRECCIÓN: Asignamos el precio a una constante para que TypeScript infiera el tipo 'number'
    const precioBase = producto.precio_venta;
    const precioFinal = precioBase * (1 + producto.porcentaje_impuesto / 100);

    setItems(prev => [
      ...prev,
      {
        id_temporal: crypto.randomUUID(),
        producto_id: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precio_unitario: precioBase, // Usamos la nueva constante
        porcentaje_impuesto: producto.porcentaje_impuesto,
        subtotal: precioFinal,
      }
    ]);
  };

  const handleUpdateCantidad = (id_temporal: string, cantidad: number) => {
    setItems(prev => prev.map(item => {
      if (item.id_temporal === id_temporal) {
        const nuevaCantidad = Math.max(1, cantidad);
        const nuevoSubtotal = item.precio_unitario * nuevaCantidad * (1 + item.porcentaje_impuesto / 100);
        return { ...item, cantidad: nuevaCantidad, subtotal: nuevoSubtotal };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id_temporal: string) => {
    setItems(prev => prev.filter(item => item.id_temporal !== id_temporal));
  };
  
  const totalPedido = useMemo(() => {
    return items.reduce((acc, item) => acc + item.subtotal, 0);
  }, [items]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clienteSeleccionadoId) {
        setError("Debes seleccionar un cliente.");
        toast.error("Debes seleccionar un cliente.");
        return;
    }
    if (items.length === 0) {
        setError("Debes añadir al menos un producto al pedido.");
        toast.error("Debes añadir al menos un producto al pedido.");
        return;
    }
    setError(null);
    
    const payload = {
        clienteId: clienteSeleccionadoId,
        items: items,
        total: totalPedido
    };
    
    startTransition(async () => {
        const result = await createManualOrder(payload);
        if(result.success) {
            toast.success(result.message);
            router.push(`/dashboard/pedidos/${result.orderId}`);
        } else {
            const errorMessage = result.error?.message || "Ocurrió un error inesperado.";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/> Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setClienteSeleccionadoId} value={clienteSeleccionadoId}>
              <SelectTrigger><SelectValue placeholder="Selecciona un cliente..." /></SelectTrigger>
              <SelectContent>
                {clientes.map(cliente => (
                  <SelectItem key={cliente.id} value={cliente.id}>{cliente.nombre_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5"/> Añadir Productos</CardTitle>
          </CardHeader>
          <CardContent>
             <Select onValueChange={(productId) => {
                 const producto = productos.find(p => p.id === productId);
                 if (producto) handleAddItem(producto);
             }}>
              <SelectTrigger><SelectValue placeholder="Busca y añade un producto..." /></SelectTrigger>
              <SelectContent>
                {productos.map(producto => (
                  <SelectItem key={producto.id} value={producto.id}>{producto.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Items del Pedido</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="w-[120px]">Cantidad</TableHead>
                <TableHead className="text-right">Precio Final</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? items.map(item => {
                const precioFinalUnitario = item.precio_unitario * (1 + item.porcentaje_impuesto / 100);
                return (
                  <TableRow key={item.id_temporal}>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => handleUpdateCantidad(item.id_temporal, parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                        min="1"
                      />
                    </TableCell>
                    <TableCell className="text-right">{precioFinalUnitario.toFixed(2)} €</TableCell>
                    <TableCell className="text-right font-semibold">{item.subtotal.toFixed(2)} €</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id_temporal)}>
                        <X className="h-4 w-4 text-red-500"/>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    Añade productos para empezar a crear el pedido.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex justify-end items-center gap-6 mt-8">
         {error && <p className="text-sm text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {error}</p>}
        <div className="text-right">
            <p className="text-gray-600">Total del Pedido:</p>
            <p className="text-2xl font-bold">{totalPedido.toFixed(2)} €</p>
        </div>
        <Button type="submit" size="lg" disabled={isPending || items.length === 0 || !clienteSeleccionadoId}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Creando Pedido...' : 'Crear Pedido y Factura'}
        </Button>
      </div>
    </form>
  );
}
