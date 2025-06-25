// src/app/dashboard/descuentos/nuevo/page.tsx
'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, TicketPercent } from 'lucide-react';
import DescuentoForm from './DescuentoForm';

export default function NuevoDescuentoPage() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-2xl">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/descuentos">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
            <TicketPercent className="h-8 w-8 text-purple-600"/>
            <div>
                <h1 className="text-3xl font-bold">Nuevo Código de Descuento</h1>
                <p className="text-muted-foreground">Rellena los datos para crear un nuevo cupón.</p>
            </div>
        </div>
      </div>
      
      <DescuentoForm />
    </div>
  );
}
