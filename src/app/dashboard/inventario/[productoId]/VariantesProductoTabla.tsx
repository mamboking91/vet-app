"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Layers, Tag, Euro, BarChart2, AlertCircle, ImageIcon } from 'lucide-react';
import type { ProductoVariante, ProductoCatalogo } from '../types';
import { formatCurrency } from '@/lib/utils';

interface VariantesProductoTablaProps {
  variantes: ProductoVariante[];
  productoPadre: ProductoCatalogo;
}

// Componente para mostrar los atributos de forma legible
const AtributosDisplay = ({ atributos }: { atributos: Record<string, any> | null }) => {
  if (!atributos || atributos.default === 'default') {
    return <span className="text-gray-500 italic">Variante por defecto</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(atributos).map(([key, value]) => (
        <Badge key={key} variant="outline" className="text-xs">
          <span className="font-semibold capitalize mr-1">{key}:</span>
          <span>{value}</span>
        </Badge>
      ))}
    </div>
  );
};

export default function VariantesProductoTabla({ variantes, productoPadre }: VariantesProductoTablaProps) {
  if (!variantes || variantes.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-gray-50 rounded-b-lg">
        <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-800">No hay variantes</h3>
        <p className="text-sm text-gray-500 mt-1">Este producto no tiene variantes definidas.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-100">
            <TableHead className="w-[60px] p-2"></TableHead>
            <TableHead>Atributos</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Precio Venta</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variantes.map((variante) => (
            <TableRow key={variante.id}>
              <TableCell className="p-2">
                <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center border">
                  {variante.imagen_url ? (
                    <Image
                      src={variante.imagen_url}
                      alt={`Imagen de ${variante.sku || 'variante'}`}
                      width={48}
                      height={48}
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <AtributosDisplay atributos={variante.atributos} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tag className="h-3 w-3 text-gray-400" />
                  <span className="font-mono text-xs text-gray-600">{variante.sku || 'N/A'}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Euro className="h-3 w-3 text-gray-400" />
                  <span className="font-semibold text-gray-800">{formatCurrency(variante.precio_venta)}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                 <div className="flex items-center justify-center gap-2">
                    <BarChart2 className="h-3 w-3 text-gray-400" />
                    <span className="font-bold">
                        {productoPadre.requiere_lote ? 'Ver Lotes' : variante.stock_actual}
                    </span>
                 </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {productoPadre.requiere_lote && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/inventario/${productoPadre.id}/variantes/${variante.id}/lotes`}>
                        <Layers className="mr-2 h-3 w-3" />
                        Lotes
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/inventario/${productoPadre.id}/variantes/${variante.id}/editar`}>
                      <Edit className="mr-2 h-3 w-3" />
                      Editar
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}