"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SearchInput from '@/components/ui/SearchInput';
import { Filter, X } from 'lucide-react';

interface FiltrosTiendaProps {
  categorias: string[];
}

export default function FiltrosTienda({ categorias }: FiltrosTiendaProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || '');

  useEffect(() => {
    // Sincronizar el estado si los parámetros de la URL cambian (ej. al usar el botón "Atrás" del navegador)
    setSelectedCategory(searchParams.get('categoria') || '');
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category && category !== 'todas') {
      params.set('categoria', category);
    } else {
      params.delete('categoria');
    }
    // Navegar a la nueva URL con los parámetros actualizados
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname); // Navegar a la URL sin parámetros
  };
  
  const hasActiveFilters = searchParams.get('q') || searchParams.get('categoria');

  return (
    <div className="bg-white/80 dark:bg-slate-800/20 backdrop-blur-sm p-4 rounded-lg border mb-8 flex flex-col md:flex-row items-center gap-4">
      <div className="w-full md:w-auto md:flex-grow">
        <SearchInput
            placeholder="Buscar por nombre de producto..."
            initialQuery={searchParams.get('q') || ''}
            queryParamName="q"
        />
      </div>
      <div className="w-full md:w-auto flex items-center gap-4">
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full md:w-[220px]">
            <SelectValue placeholder="Filtrar por categoría..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} title="Limpiar filtros">
                <X className="h-4 w-4 mr-2"/>
                Limpiar
            </Button>
        )}
      </div>
    </div>
  );
}