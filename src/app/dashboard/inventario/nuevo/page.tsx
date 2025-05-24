// app/dashboard/inventario/nuevo/page.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ProductoCatalogoForm from './ProductoCatalogoForm'; // Crearemos este componente

export const dynamic = 'force-dynamic';

export default function NuevoProductoCatalogoPage() {
  // Podríamos obtener aquí listas para selectores si fueran dinámicas (ej. proveedores, categorías de producto)
  // Por ahora, las unidades de medida las manejará el formulario directamente.

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/inventario">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Añadir Nuevo Producto al Catálogo</h1>
      </div>
      <ProductoCatalogoForm />
    </div>
  );
}