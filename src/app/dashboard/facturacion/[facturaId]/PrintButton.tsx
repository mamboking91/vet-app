// app/dashboard/facturacion/[facturaId]/PrintButton.tsx
"use client"; // Marcar como Client Component

import React from 'react';
import { Button } from "@/components/ui/button";
import { Printer } from 'lucide-react';

export default function PrintButton() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" /> Imprimir/PDF
    </Button>
  );
}