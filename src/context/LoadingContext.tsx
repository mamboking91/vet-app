// src/context/LoadingContext.tsx
'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Envolvemos los setters en un requestAnimationFrame para evitar flashes rápidos en navegaciones muy cortas
  const showLoader = () => requestAnimationFrame(() => setIsLoading(true));
  const hideLoader = () => requestAnimationFrame(() => setIsLoading(false));

  return (
    <LoadingContext.Provider value={{ isLoading, showLoader, hideLoader }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading debe ser usado dentro de un LoadingProvider');
  }
  return context;
}