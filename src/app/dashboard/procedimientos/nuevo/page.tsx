// app/dashboard/procedimientos/nuevo/page.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ProcedimientoForm from './ProcedimientoForm'; // Asumiendo que el form está aquí

export const dynamic = 'force-dynamic';

export default function NuevoProcedimientoPage() {
  // Si el ProcedimientoForm necesita props (como las opciones de categoría o impuesto),
  // se obtendrían aquí y se pasarían.
  // Por ahora, ProcedimientoForm importa las opciones de impuesto directamente.
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/procedimientos">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        {/* El título lo gestionará el ProcedimientoForm, o lo puedes poner aquí */}
        {/* <h1 className="text-2xl md:text-3xl font-bold">Añadir Nuevo Procedimiento</h1> */}
      </div>
      {/* Pasarías initialData y procedimientoId si este fuera un formulario de edición,
        pero para 'nuevo', no se pasan.
      */}
      <ProcedimientoForm />
    </div>
  );
}