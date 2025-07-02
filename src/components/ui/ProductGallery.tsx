"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ImagenProducto } from '@/app/dashboard/inventario/types';

interface ProductGalleryProps {
  images: ImagenProducto[];
  productName: string;
  fallbackImageUrl: string;
  mainImageUrl: string | null; // <-- Prop para controlar la imagen principal
  onThumbnailClick: (url: string) => void; // <-- Callback para manejar el click
}

export default function ProductGallery({ images, productName, fallbackImageUrl, mainImageUrl, onThumbnailClick }: ProductGalleryProps) {
  // El estado interno para la imagen principal se elimina.
  // La imagen a mostrar ahora viene directamente de la prop 'mainImageUrl'.

  const sortedImages = images.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  
  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <Image 
          src={fallbackImageUrl} 
          alt={productName} 
          width={600} 
          height={600} 
          className="object-cover rounded-lg" 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-24">
        {sortedImages.map((image) => (
          <div
            key={image.url}
            className={cn(
              "aspect-square w-20 h-20 md:w-full md:h-auto flex-shrink-0 cursor-pointer rounded-md border-2 transition-all",
              mainImageUrl === image.url ? 'border-blue-500' : 'border-transparent'
            )}
            // Al hacer clic, llamamos a la función pasada por props.
            onClick={() => onThumbnailClick(image.url)}
          >
            <Image
              src={image.url}
              alt={`${productName} - vista ${image.order}`}
              width={100}
              height={100}
              className="object-cover rounded-md w-full h-full"
            />
          </div>
        ))}
      </div>
      {/* Main Image */}
      <div className="flex-1 aspect-square relative">
        <Image
          src={mainImageUrl || fallbackImageUrl}
          alt={productName}
          fill
          className="object-cover rounded-lg"
        />
      </div>
    </div>
  );
}