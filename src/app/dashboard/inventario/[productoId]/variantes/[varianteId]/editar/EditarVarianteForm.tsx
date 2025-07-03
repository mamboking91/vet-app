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
import { Save, AlertTriangle, CheckCircle, Trash2, Euro, Image as ImageIcon } from 'lucide-react';
import type { ProductoCatalogo, ProductoVariante } from '../../../../types';
import { actualizarVariante, eliminarVariante } from '../../../../actions';
import NextImage from 'next/image';

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

  const [sku, setSku] = useState(variante.sku || '');
  const [precioBase, setPrecioBase] = useState(variante.precio_venta?.toString() || '');
  const [precioFinal, setPrecioFinal] = useState('');
  const [lastInput, setLastInput] = useState<'base' | 'final'>('base');
  const [imagePreview, setImagePreview] = useState<string | null>(variante.imagen_url || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const tax = productoPadre.porcentaje_impuesto;

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

  useEffect(() => {
    const base = parseFloat(variante.precio_venta?.toString() || '');
    if (!isNaN(base) && !isNaN(tax)) {
      setPrecioFinal((base * (1 + tax / 100)).toFixed(2));
    }
  }, [variante.precio_venta, tax]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    formData.set('precio_venta', precioBase);
    if (imageFile) {
        formData.set('imagen', imageFile);
        // Indica a la acción que esta imagen debe ser la principal para la variante
        formData.set('set_como_principal', 'true');
    }

    startTransition(async () => {
      const result = await actualizarVariante(variante.id, productoPadre.id, formData);
      
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
            Modifica el SKU, precio e imagen para esta variante específica.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
             <div className="space-y-2">
                <Label htmlFor="precio_base">Precio Base (€ sin IGIC)</Label>
                <Input
                  id="precio_base"
                  name="precio_venta"
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

          <div className="space-y-2">
            <Label htmlFor="imagen">Imagen de la Variante</Label>
            <div className="flex items-center gap-4">
                {imagePreview ? (
                    <NextImage src={imagePreview} alt="Previsualización" width={80} height={80} className="rounded-md object-cover border" />
                ) : (
                    <div className="w-20 h-20 bg-slate-100 rounded-md flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                )}
                <Input
                    id="imagen"
                    name="imagen"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="max-w-xs"
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