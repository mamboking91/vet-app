// src/app/components/SearchInput.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input'; // Asume que @/components apunta a src/components
import { Button } from '@/components/ui/button'; // Asume que @/components apunta a src/components
import { Search as SearchIcon } from 'lucide-react'; // Renombrado para evitar colisión si Search es un componente

interface SearchInputProps {
  placeholder?: string;
  initialQuery?: string;
  queryParamName?: string;
}

export default function SearchInput({ 
  placeholder = "Buscar...", 
  initialQuery = '',
  queryParamName = 'q' 
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams(); // Renombrado para claridad

  const [searchTerm, setSearchTerm] = useState(initialQuery);

  useEffect(() => {
    setSearchTerm(initialQuery || ''); // Asegurar que sea string
  }, [initialQuery]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(currentSearchParams.toString());
    if (searchTerm.trim()) {
      params.set(queryParamName, searchTerm.trim());
    } else {
      params.delete(queryParamName);
    }
    
    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
  };

  const clearSearch = () => {
    setSearchTerm('');
    const params = new URLSearchParams(currentSearchParams.toString());
    params.delete(queryParamName);
    const clearUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(clearUrl);
  };

  return (
    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-6 w-full max-w-lg">
      <div className="relative flex-grow">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full" 
        />
      </div>
      <Button type="submit">Buscar</Button>
      {/* Mostrar botón para limpiar solo si hay un término de búsqueda activo en la URL o en el input */}
      {(currentSearchParams.get(queryParamName) || searchTerm) && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={clearSearch}
        >
          Limpiar
        </Button>
      )}
    </form>
  );
}