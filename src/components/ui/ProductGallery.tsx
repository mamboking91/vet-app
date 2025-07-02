"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ImagenProducto } from '@/app/dashboard/inventario/types';

interface ProductGalleryProps {
  images: ImagenProducto[];
  productName: string;
  fallbackImageUrl: string;
}

export default function ProductGallery({ images, productName, fallbackImageUrl }: ProductGalleryProps) {
  // State to hold the URL of the currently displayed main image.
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);

  // Sort images once based on the order property.
  const sortedImages = images.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  
  // Effect to set the main image. This runs when the component mounts
  // and whenever the `images` prop array changes (i.e., when a new variant is selected).
  useEffect(() => {
    // Find the primary image from the props (either marked as primary, or the first one).
    const primaryImage = sortedImages.find(img => img.isPrimary) || sortedImages[0];
    // Update the state with the URL of the primary image.
    if (primaryImage) {
      setMainImageUrl(primaryImage.url);
    } else {
      setMainImageUrl(fallbackImageUrl);
    }
    // The dependency array ensures this effect re-runs if the list of images changes.
  }, [images, sortedImages, fallbackImageUrl]);


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
            // When a user clicks a thumbnail, we update the state directly.
            onClick={() => setMainImageUrl(image.url)}
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
