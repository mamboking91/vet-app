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

// Este es un Componente de Cliente. Maneja su propio estado y eventos.
export default function ProductImage({ src, alt, width, height, className }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  // Aseguramos que la imagen se actualice si la prop 'src' cambia.
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  // Este manejador de eventos es seguro porque vive dentro de un Componente de Cliente.
  const handleError = () => {
    setImgSrc(`https://placehold.co/${width}x${height}/e2e8f0/e2e8f0?text=Imagen+no+disponible`);
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
