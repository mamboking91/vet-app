"use client";

import { useState } from 'react';
import Image from 'next/image';
import type { ImagenProducto } from '@/app/dashboard/inventario/types';
import { cn } from '@/lib/utils';
import ProductImage from './ProductImage'; // Reutilizamos nuestro componente de imagen seguro

interface ProductGalleryProps {
  images: ImagenProducto[];
  fallbackImageUrl: string;
  productName: string;
}

export default function ProductGallery({ images, fallbackImageUrl, productName }: ProductGalleryProps) {
  // Si no hay imágenes, muestra solo la de fallback
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square relative overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
        <ProductImage
          src={fallbackImageUrl}
          alt={`Logo de la tienda para ${productName}`}
          width={600}
          height={600}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Ordena las imágenes y establece la imagen principal como la primera a mostrar
  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  const primaryImage = sortedImages.find(img => img.isPrimary) || sortedImages[0];
  const [selectedImage, setSelectedImage] = useState<ImagenProducto>(primaryImage);

  return (
    <div className="grid gap-4">
      {/* Imagen Principal Seleccionada */}
      <div className="w-full aspect-square relative overflow-hidden rounded-lg shadow-lg bg-gray-100 flex items-center justify-center">
        <ProductImage
          src={selectedImage.url}
          alt={`Imagen principal de ${productName}`}
          width={800}
          height={800}
          className="w-full h-full object-cover transition-transform duration-300"
        />
      </div>
      
      {/* Miniaturas */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {sortedImages.map((image) => (
            <button
              key={image.url}
              onClick={() => setSelectedImage(image)}
              className={cn(
                "aspect-square relative overflow-hidden rounded-md transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                selectedImage.url === image.url ? "ring-2 ring-blue-500" : "hover:opacity-80"
              )}
            >
              <ProductImage
                src={image.url}
                alt={`Miniatura de ${productName}`}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
