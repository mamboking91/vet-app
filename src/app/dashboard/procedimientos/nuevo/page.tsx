// app/dashboard/procedimientos/nuevo/page.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ProcedimientoForm from './ProcedimientoForm'; // Crearemos este componente a continuación

export const dynamic = 'force-dynamic'; // Opcional, pero bueno para formularios que podrían tener datos dinámicos

export default function NuevoProcedimientoPage() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/procedimientos">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Añadir Nuevo Procedimiento</h1>
      </div>
      <ProcedimientoForm />
    </div>
  );
}