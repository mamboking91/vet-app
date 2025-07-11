// src/app/tienda/[productoId]/ProductDisplay.tsx
"use client"

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import ProductGallery from '@/components/ui/ProductGallery';
import AddToCartButton from './AddToCartButton';
import { PackageCheck, PackageX, ShoppingCart } from 'lucide-react';
import type { ProductoCatalogo, ProductoConStock, ImagenProducto } from '@/app/dashboard/inventario/types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; 

interface ProductDisplayProps {
  producto: ProductoCatalogo;
  variantes: ProductoConStock[];
  fallbackImageUrl: string;
}

const TALLA_ORDER: { [key: string]: number } = {
    '3XS': 1, 'XXS': 2, 'XS': 3,
    'S': 4, 'M': 5, 'L': 6,
    'XL': 7, 'XXL': 8, '3XL': 9,
};

const sortVariants = (variants: ProductoConStock[]): ProductoConStock[] => {
    const attrKey = (variants[0]?.atributos && Object.keys(variants[0].atributos)[0] !== 'default')
        ? Object.keys(variants[0].atributos)[0]
        : null;

    return [...variants].sort((a, b) => {
        if (!attrKey || !a.atributos || !b.atributos) {
            return a.nombre.localeCompare(b.nombre);
        }

        const aValue = (a.atributos[attrKey] || '').toString().toUpperCase();
        const bValue = (b.atributos[attrKey] || '').toString().toUpperCase();

        const aIsTalla = TALLA_ORDER[aValue] !== undefined;
        const bIsTalla = TALLA_ORDER[bValue] !== undefined;
        if (aIsTalla && bIsTalla) {
            return TALLA_ORDER[aValue] - TALLA_ORDER[bValue];
        }

        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
        }
        
        return aValue.localeCompare(bValue, undefined, { numeric: true });
    });
};

export default function ProductDisplay({ producto, variantes, fallbackImageUrl }: ProductDisplayProps) {
  const sortedVariants = useMemo(() => sortVariants(variantes), [variantes]);
  
  const [selectedVariant, setSelectedVariant] = useState<ProductoConStock | null>(sortedVariants?.[0] || null);

  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);

  const galleryImages = useMemo(() => {
    return producto.imagenes?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) || [];
  }, [producto.imagenes]);

  useEffect(() => {
    let newImageUrl = fallbackImageUrl;

    if (selectedVariant?.imagen_variante_url) {
      newImageUrl = selectedVariant.imagen_variante_url;
    } 
    else {
      const primaryImage = producto.imagenes?.find(img => img.isPrimary);
      if (primaryImage?.url) {
        newImageUrl = primaryImage.url;
      }
      else if (galleryImages.length > 0) {
        newImageUrl = galleryImages[0].url;
      }
    }
    setMainImageUrl(newImageUrl);
  }, [selectedVariant, producto.imagenes, galleryImages, fallbackImageUrl]);

  const handleSelectVariant = (variant: ProductoConStock) => {
    setSelectedVariant(variant);
  };

  const handleThumbnailClick = (url: string) => {
      setMainImageUrl(url);
  };
  
  const attributeName = useMemo(() => {
    if (sortedVariants.length > 0 && sortedVariants[0].atributos) {
      const keys = Object.keys(sortedVariants[0].atributos);
      if (keys.length > 0 && keys[0] !== 'default') {
        return keys[0];
      }
    }
    return null;
  }, [sortedVariants]);

  const getVariantLabel = (variant: ProductoConStock) => {
    if (variant.atributos && attributeName) {
      return variant.atributos[attributeName] || '';
    }
    return variant.nombre.split(' - ')[1] || 'Opción';
  };
  
  const precioFinalDisplay = selectedVariant?.precio_venta != null 
    ? formatCurrency(selectedVariant.precio_venta * (1 + selectedVariant.porcentaje_impuesto / 100)) 
    : 'Consultar';

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <ProductGallery 
              images={galleryImages}
              fallbackImageUrl={fallbackImageUrl}
              productName={producto.nombre}
              mainImageUrl={mainImageUrl}
              onThumbnailClick={handleThumbnailClick}
            />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">{producto.nombre}</h1>
            
            <div className="mt-4 flex items-center justify-between">
              <p className="text-3xl text-gray-900">{precioFinalDisplay}</p>
            </div>
            
            {sortedVariants.length > 1 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 capitalize">
                  {attributeName || 'Opciones'}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {sortedVariants.map(variant => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                      onClick={() => handleSelectVariant(variant)}
                      className={cn("transition-all", {
                        "ring-2 ring-blue-500": selectedVariant?.id === variant.id
                      })}
                    >
                      {getVariantLabel(variant)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

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