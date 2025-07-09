// app/dashboard/pedidos/nuevo/PedidoManualForm.tsx
"use client";

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, User, AlertCircle, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { createManualOrder } from '@/app/dashboard/pedidos/actions';
import type { Propietario } from '@/app/dashboard/propietarios/types';
import { formatCurrency } from '@/lib/utils'

interface PedidoManualFormProps {
  clientes: Propietario[];
  productos: ProductoParaSelector[];
}

type ProductoParaSelector = {
  id: string;
  nombre: string;
  precio_venta: number | null;
  porcentaje_impuesto: number;
};

type ItemPedidoForm = {
  id_temporal: string;
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number; 
  porcentaje_impuesto: number;
  subtotal: number; 
};

export default function PedidoManualForm({ clientes, productos }: PedidoManualFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('');
  const [items, setItems] = useState<ItemPedidoForm[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [productSelectorKey, setProductSelectorKey] = useState(crypto.randomUUID());

  const [manualClient, setManualClient] = useState({
      nombre_completo: '', email: '', direccion: '', localidad: '', provincia: 'Santa Cruz de Tenerife', codigo_postal: '', telefono: ''
  });

  const handleSelectCliente = (clienteId: string) => {
    setClienteSeleccionadoId(clienteId);
    if (!clienteId) {
        setManualClient({ nombre_completo: '', email: '', direccion: '', localidad: '', provincia: 'Santa Cruz de Tenerife', codigo_postal: '', telefono: '' });
        return;
    }
    
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
        setManualClient({
            nombre_completo: cliente.nombre_completo || '',
            email: cliente.email || '',
            direccion: cliente.direccion || '',
            localidad: cliente.localidad || '',
            provincia: cliente.provincia || 'Santa Cruz de Tenerife',
            codigo_postal: cliente.codigo_postal || '',
            telefono: cliente.telefono || ''
        });
        toast.info(`Datos de ${cliente.nombre_completo} cargados.`);
    }
  };

  const handleManualClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setManualClient(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddItem = (producto: ProductoParaSelector) => {
    if (producto.precio_venta === null) {
      toast.error(`El producto "${producto.nombre}" no tiene un precio de venta asignado.`);
      return;
    }
    if (items.some(item => item.producto_id === producto.id)) {
      toast.info(`"${producto.nombre}" ya está en el pedido. Puedes ajustar la cantidad.`);
      setProductSelectorKey(crypto.randomUUID());
      return;
    }
    const precioBase = producto.precio_venta;
    const precioFinal = precioBase * (1 + producto.porcentaje_impuesto / 100);
    setItems(prev => [...prev, { id_temporal: crypto.randomUUID(), producto_id: producto.id, nombre: producto.nombre, cantidad: 1, precio_unitario: precioBase, porcentaje_impuesto: producto.porcentaje_impuesto, subtotal: precioFinal }]);
    setProductSelectorKey(crypto.randomUUID());
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

  const handleRemoveItem = (id_temporal: string) => setItems(prev => prev.filter(item => item.id_temporal !== id_temporal));
  
  const totalPedido = useMemo(() => items.reduce((acc, item) => acc + item.subtotal, 0), [items]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manualClient.email) {
        setError("El campo de email del cliente es obligatorio.");
        toast.error("Faltan los datos del cliente.");
        return;
    }
    if (items.length === 0) {
        setError("Debes añadir al menos un producto al pedido.");
        toast.error("El pedido no tiene productos.");
        return;
    }
    setError(null);
    
    // --- INICIO DE LA CORRECCIÓN: Payload de envío ---
    const payload = {
        clienteId: clienteSeleccionadoId || undefined,
        // Siempre enviamos los datos del formulario, ya sea de un cliente cargado o uno nuevo
        clienteManual: manualClient,
        items: items,
        total: totalPedido
    };
    // --- FIN DE LA CORRECCIÓN: Payload de envío ---
    
    startTransition(async () => {
        const result = await createManualOrder(payload);
        if(result.success && result.orderId) {
            toast.success(result.message);
            router.push(`/dashboard/pedidos/${result.orderId}`);
        } else {
            const errorMessage = result.error?.message || "Ocurrió un error inesperado.";
            setError(errorMessage);
            toast.error(errorMessage, { description: result.error?.errors ? JSON.stringify(result.error.errors) : '' });
        }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600"/> Cliente y Envío</CardTitle>
            <CardDescription>Selecciona un cliente para autocompletar o introduce sus datos manualmente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Select onValueChange={handleSelectCliente} value={clienteSeleccionadoId}>
              <SelectTrigger><SelectValue placeholder="Opcional: Selecciona un cliente existente..." /></SelectTrigger>
              <SelectContent>{clientes.map(cliente => (<SelectItem key={cliente.id} value={cliente.id}>{cliente.nombre_completo}</SelectItem>))}</SelectContent>
            </Select>

            <div className="space-y-2 pt-4">
                <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                <Input id="nombre_completo" name="nombre_completo" value={manualClient.nombre_completo} onChange={handleManualClientChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" value={manualClient.email} onChange={handleManualClientChange} required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="direccion">Dirección (Calle y Número) *</Label>
                <Input id="direccion" name="direccion" value={manualClient.direccion} onChange={handleManualClientChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label htmlFor="localidad">Localidad *</Label><Input id="localidad" name="localidad" value={manualClient.localidad} onChange={handleManualClientChange} required /></div>
                <div className="space-y-2"><Label htmlFor="provincia">Provincia *</Label><Input id="provincia" name="provincia" value={manualClient.provincia} onChange={handleManualClientChange} required /></div>
                <div className="space-y-2"><Label htmlFor="codigo_postal">Cód. Postal *</Label><Input id="codigo_postal" name="codigo_postal" value={manualClient.codigo_postal} onChange={handleManualClientChange} required /></div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono (Opcional)</Label>
                <Input id="telefono" name="telefono" value={manualClient.telefono} onChange={handleManualClientChange} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-green-600"/> Añadir Productos</CardTitle>
             <CardDescription>Busca productos y añádelos al pedido.</CardDescription>
          </CardHeader>
          <CardContent>
             <Select 
                key={productSelectorKey}
                onValueChange={(productId) => { 
                    if (!productId) return;
                    const producto = productos.find(p => p.id === productId); 
                    if (producto) handleAddItem(producto); 
                }}
             >
              <SelectTrigger><SelectValue placeholder="Busca un producto..." /></SelectTrigger>
              <SelectContent>{productos.map(producto => (<SelectItem key={producto.id} value={producto.id}>{producto.nombre}</SelectItem>))}</SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Items del Pedido</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="w-[120px]">Cantidad</TableHead><TableHead className="text-right">Precio Final</TableHead><TableHead className="text-right">Subtotal</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {items.length > 0 ? items.map(item => {
                const precioFinalUnitario = item.precio_unitario * (1 + item.porcentaje_impuesto / 100);
                return (<TableRow key={item.id_temporal}><TableCell className="font-medium">{item.nombre}</TableCell><TableCell><Input type="number" value={item.cantidad} onChange={(e) => handleUpdateCantidad(item.id_temporal, parseInt(e.target.value) || 1)} className="w-20 text-center" min="1"/></TableCell><TableCell className="text-right">{formatCurrency(precioFinalUnitario)}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(item.subtotal)}</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id_temporal)}><X className="h-4 w-4 text-red-500"/></Button></TableCell></TableRow>)
              }) : (<TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">Añade productos para empezar.</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex justify-end items-center gap-6 mt-8">
         {error && <p className="text-sm text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4"/> {error}</p>}
        <div className="text-right">
            <p className="text-gray-600">Total del Pedido:</p>
            <p className="text-2xl font-bold">{formatCurrency(totalPedido)}</p>
        </div>
        <Button type="submit" size="lg" disabled={isPending || items.length === 0 || (!clienteSeleccionadoId && !manualClient.email)}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Procesando...' : 'Crear Pedido y Factura'}
        </Button>
      </div>
    </form>
  );
}