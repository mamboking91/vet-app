"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ProductImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export default function ProductImage({ src, alt, width, height, className }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const handleError = () => {
    // CORRECCIÓN: La URL por defecto ahora tiene el formato correcto.
    setImgSrc(`https://placehold.co/${width}x${height}/e2e8f0/e2e8f0.png?text=Imagen+no+disponible`);
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
}
