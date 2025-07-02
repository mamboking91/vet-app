"use client"

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import ProductGallery from '@/components/ui/ProductGallery';
import AddToCartButton from './AddToCartButton';
import { PackageCheck, PackageX } from 'lucide-react';
import type { ProductoCatalogo, ProductoConStock, ImagenProducto } from '@/app/dashboard/inventario/types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; 

interface ProductDisplayProps {
  producto: ProductoCatalogo;
  variantes: ProductoConStock[];
  fallbackImageUrl: string;
}

export default function ProductDisplay({ producto, variantes, fallbackImageUrl }: ProductDisplayProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductoConStock | null>(variantes?.[0] || null);
  // Añadimos un estado para la URL de la imagen principal
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);

  const allImages = useMemo(() => {
    // La lógica de las imágenes se mantiene, pero ya no se usará para la imagen principal directamente
    const imageSet = new Set<string>();
    const combinedImages: ImagenProducto[] = [];

    // Añadir imagen de la variante si existe
    if (selectedVariant?.imagen_principal) {
        if (!imageSet.has(selectedVariant.imagen_principal)) {
            combinedImages.push({
                url: selectedVariant.imagen_principal, 
                isPrimary: true, 
                order: -1
            });
            imageSet.add(selectedVariant.imagen_principal);
        }
    }
    
    // Añadir imágenes del producto padre
    if (producto.imagenes) {
        producto.imagenes.forEach(img => {
            if (!imageSet.has(img.url)) {
                combinedImages.push({ ...img, isPrimary: selectedVariant ? img.url === selectedVariant.imagen_principal : img.isPrimary });
                imageSet.add(img.url);
            }
        });
    }

    return combinedImages.sort((a,b) => a.order - b.order);
  }, [selectedVariant, producto.imagenes]);

  // useEffect para actualizar la imagen principal cuando cambia la variante o las imágenes
  useEffect(() => {
    // Prioridad 1: Imagen principal de la variante seleccionada
    if (selectedVariant?.imagen_principal) {
        setMainImageUrl(selectedVariant.imagen_principal);
        return;
    }
    // Prioridad 2: Imagen primaria de la lista combinada de imágenes
    const primaryImage = allImages.find(img => img.isPrimary) || allImages[0];
    if (primaryImage) {
        setMainImageUrl(primaryImage.url);
    } else {
    // Prioridad 3: Fallback si no hay imágenes
        setMainImageUrl(fallbackImageUrl);
    }
  }, [selectedVariant, allImages, fallbackImageUrl]);


  const handleSelectVariant = (variant: ProductoConStock) => {
    setSelectedVariant(variant);
    // No es necesario actualizar mainImageUrl aquí, el useEffect se encargará.
  };

  const handleThumbnailClick = (url: string) => {
      setMainImageUrl(url);
  };

  const precioFinalDisplay = selectedVariant?.precio_venta != null 
    ? formatCurrency(selectedVariant.precio_venta * (1 + selectedVariant.porcentaje_impuesto / 100)) 
    : 'Consultar';

  const stockDisponible = selectedVariant?.stock_total_actual ?? 0;

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <ProductGallery 
              images={allImages}
              fallbackImageUrl={fallbackImageUrl}
              productName={producto.nombre}
              mainImageUrl={mainImageUrl} // Pasamos el estado de la imagen principal
              onThumbnailClick={handleThumbnailClick} // Pasamos la función para manejar el clic
            />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">{producto.nombre}</h1>
            
            <div className="mt-4 flex items-center justify-between">
              <p className="text-3xl text-gray-900">{precioFinalDisplay}</p>
              {stockDisponible > 0 ? (
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                  <PackageCheck className="mr-2 h-5 w-5" /> {stockDisponible} {stockDisponible === 1 ? 'unidad disponible' : 'unidades disponibles'}
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <PackageX className="mr-2 h-4 w-4" /> Agotado
                </Badge>
              )}
            </div>
            
            {/* Selector de Variantes */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Opciones</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {variantes.map(variant => (
                  <Button
                    key={variant.id}
                    variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                    onClick={() => handleSelectVariant(variant)}
                    className={cn("transition-all", {
                      "ring-2 ring-blue-500": selectedVariant?.id === variant.id
                    })}
                  >
                    {variant.nombre.split(' - ')[1] || 'Opción única'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800">Descripción</h3>
              <div className="mt-2 prose prose-sm text-gray-600 max-w-none" dangerouslySetInnerHTML={{ __html: producto.descripcion_publica?.replace(/\n/g, '<br />') || 'No hay descripción disponible.' }} />
            </div>

            <div className="mt-8">
              <AddToCartButton product={selectedVariant} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}