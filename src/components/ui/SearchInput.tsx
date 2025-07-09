// src/components/ui/SearchInput.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, X } from 'lucide-react';

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
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(initialQuery);

  const performSearch = useCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set(queryParamName, term);
    } else {
      params.delete(queryParamName);
    }
    // Usamos { scroll: false } para que la página no salte al inicio en cada búsqueda
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, queryParamName, pathname, router]);

  // --- INICIO DE LA CORRECCIÓN: Lógica de debounce integrada ---
  useEffect(() => {
    // Sincroniza el estado del input si la URL cambia (ej. al usar el botón "Atrás")
    setSearchTerm(searchParams.get(queryParamName) || '');
  }, [searchParams, queryParamName]);

  useEffect(() => {
    // Establece un temporizador para ejecutar la búsqueda
    const timerId = setTimeout(() => {
      // Solo busca si el término actual es diferente al de la URL
      if (searchTerm !== (searchParams.get(queryParamName) || '')) {
        performSearch(searchTerm);
      }
    }, 300); // Espera 300ms después de que el usuario deja de teclear

    // Limpia el temporizador si el usuario sigue escribiendo
    return () => clearTimeout(timerId);
  }, [searchTerm, performSearch, searchParams, queryParamName]);
  // --- FIN DE LA CORRECCIÓN ---

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="flex items-center gap-2 mb-6 w-full max-w-lg">
      <div className="relative flex-grow">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 w-full"
        />
        {searchTerm && (
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
            onClick={clearSearch}
            title="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}