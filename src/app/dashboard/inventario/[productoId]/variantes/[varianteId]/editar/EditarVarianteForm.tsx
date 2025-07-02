"use client"

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Save, AlertTriangle, CheckCircle, Trash2, Euro } from 'lucide-react';
import type { ProductoCatalogo, ProductoVariante } from '../../../../types';
import { actualizarVariante, eliminarVariante } from '../../../../actions';

interface EditarVarianteFormProps {
  productoPadre: ProductoCatalogo;
  variante: ProductoVariante;
}

export default function EditarVarianteForm({ productoPadre, variante }: EditarVarianteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estado del formulario, inicializado con los datos de la variante
  const [sku, setSku] = useState(variante.sku || '');
  const [precioBase, setPrecioBase] = useState(variante.precio_venta?.toString() || '');
  const [precioFinal, setPrecioFinal] = useState('');
  const [lastInput, setLastInput] = useState<'base' | 'final'>('base');
  const [stock, setStock] = useState(variante.stock_actual?.toString() || '0');

  const tax = productoPadre.porcentaje_impuesto;

  // Lógica para el cálculo de precios
  useEffect(() => {
    if (lastInput === 'base') {
      const base = parseFloat(precioBase);
      if (!isNaN(base) && !isNaN(tax)) {
        setPrecioFinal((base * (1 + tax / 100)).toFixed(2));
      } else {
        setPrecioFinal('');
      }
    }
  }, [precioBase, tax, lastInput]);

  useEffect(() => {
    if (lastInput === 'final') {
      const final = parseFloat(precioFinal);
      if (!isNaN(final) && !isNaN(tax) && (1 + tax / 100) !== 0) {
        setPrecioBase((final / (1 + tax / 100)).toFixed(2));
      } else {
        setPrecioBase('');
      }
    }
  }, [precioFinal, tax, lastInput]);

  // Inicializa los precios al cargar el componente
  useEffect(() => {
    const base = parseFloat(variante.precio_venta?.toString() || '');
    if (!isNaN(base) && !isNaN(tax)) {
      setPrecioFinal((base * (1 + tax / 100)).toFixed(2));
    }
  }, [variante.precio_venta, tax]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    formData.set('precio_venta', precioBase); // Aseguramos que se envía el precio base correcto

    startTransition(async () => {
      const result = await actualizarVariante(variante.id, formData);
      
      if (!result.success) {
        setError(result.error?.message || 'Ocurrió un error.');
      } else {
        setSuccess(true);
        setTimeout(() => {
            router.push(`/dashboard/inventario/${productoPadre.id}`);
            router.refresh();
        }, 1500)
      }
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    const result = await eliminarVariante(variante.id, productoPadre.id);
    if (!result.success) {
        setError(result.error?.message || 'No se pudo eliminar la variante.');
        setIsDeleting(false);
    } else {
        router.push(`/dashboard/inventario/${productoPadre.id}`);
        router.refresh();
    }
  };

  if (success) {
    return (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
                <h4 className="font-semibold text-green-800">¡Variante actualizada!</h4>
                <p className="text-sm text-green-700">Serás redirigido en un momento...</p>
            </div>
          </div>
        </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Detalles de la Variante</CardTitle>
          <CardDescription>
            Modifica el SKU, precio y stock para esta variante específica. Los atributos no se pueden cambiar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label>Atributos (solo lectura)</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(variante.atributos || {}).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-base py-1 px-3">
                  <span className="font-semibold capitalize mr-2">{key}:</span>
                  <span>{value as string}</span>
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU de la variante"
              />
            </div>
            {!productoPadre.requiere_lote && (
              <div className="space-y-2">
                <Label htmlFor="stock_actual">Stock Actual</Label>
                <Input
                  id="stock_actual"
                  name="stock_actual"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Se registrará un movimiento de ajuste si modificas este valor.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
             <div className="space-y-2">
                <Label htmlFor="precio_base">Precio Base (€ sin IGIC)</Label>
                <Input
                  id="precio_base"
                  name="precio_venta" // El nombre debe coincidir con la columna de la BD
                  type="number"
                  value={precioBase}
                  onChange={(e) => { setPrecioBase(e.target.value); setLastInput('base'); }}
                  step="0.01"
                  min="0"
                  placeholder="19.99"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_final">Precio Final (€ con {tax}% IGIC)</Label>
                <Input
                  id="precio_final"
                  type="number"
                  value={precioFinal}
                  onChange={(e) => { setPrecioFinal(e.target.value); setLastInput('final'); }}
                  step="0.01"
                  min="0"
                  placeholder="21.39"
                />
              </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={isPending || isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Variante
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente esta variante. Si es la última variante de un producto, la eliminación fallará para proteger la integridad del producto.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                    {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
              <Button type="submit" disabled={isPending || isDeleting}>
                {isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
