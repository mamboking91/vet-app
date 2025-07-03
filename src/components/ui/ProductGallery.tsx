"use client"

import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ImagenProducto } from '@/app/dashboard/inventario/types';

interface ProductGalleryProps {
  images: ImagenProducto[];
  productName: string;
  fallbackImageUrl: string;
  mainImageUrl: string | null;
  onThumbnailClick: (url: string) => void;
}

export default function ProductGallery({ images, productName, fallbackImageUrl, mainImageUrl, onThumbnailClick }: ProductGalleryProps) {
  
  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full rounded-lg flex items-center justify-center">
        <Image 
          src={fallbackImageUrl} 
          alt={productName} 
          width={600} 
          height={600} 
          className="object-contain rounded-lg" 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-24">
        {images.map((image) => (
          <div
            key={image.url}
            className={cn(
              "aspect-square w-20 h-20 md:w-full md:h-auto flex-shrink-0 cursor-pointer rounded-md border-2 transition-all p-1 bg-white",
              mainImageUrl === image.url ? 'border-blue-500' : 'border-gray-200'
            )}
            onClick={() => onThumbnailClick(image.url)}
          >
            <Image
              src={image.url}
              alt={`${productName} - vista ${image.order}`}
              width={100}
              height={100}
              className="object-contain rounded-md w-full h-full"
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
          className="object-contain rounded-lg"
        />
      </div>
    </div>
  );
}