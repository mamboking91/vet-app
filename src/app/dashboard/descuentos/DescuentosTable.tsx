// src/app/dashboard/descuentos/DescuentosTable.tsx
"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Loader2, Copy } from 'lucide-react';
import type { CodigoDescuento } from './types';
import { eliminarCodigoDescuento } from './actions';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card'; // <-- CORRECCIÓN: Se ha añadido esta línea

interface DescuentosTableProps {
  descuentos: CodigoDescuento[];
}

export default function DescuentosTable({ descuentos }: DescuentosTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Código "${code}" copiado al portapapeles.`);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    const result = await eliminarCodigoDescuento(id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error?.message);
    }
    setIsDeleting(null);
  };

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Descuento</TableHead>
            <TableHead className="hidden md:table-cell">Condiciones</TableHead>
            <TableHead className="hidden sm:table-cell">Usos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {descuentos.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center h-24">No se han encontrado códigos de descuento.</TableCell></TableRow>
          ) : (
            descuentos.map(d => (
              <TableRow key={d.id}>
                <TableCell>
                  <div className="font-mono text-sm font-semibold flex items-center gap-2">
                    {d.codigo}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(d.codigo)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={d.tipo_descuento === 'porcentaje' ? 'secondary' : 'outline'}>
                    {d.valor}{d.tipo_descuento === 'porcentaje' ? '%' : '€'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  <div>{d.compra_minima > 0 ? `Mín. ${d.compra_minima}€` : 'Sin compra mínima'}</div>
                  <div>{d.fecha_expiracion ? `Expira: ${format(parseISO(d.fecha_expiracion), 'P', { locale: es })}` : 'No expira'}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                    {d.usos_actuales} / {d.usos_maximos || '∞'}
                </TableCell>
                <TableCell>
                  <Badge className={cn(d.activo ? 'bg-green-500' : 'bg-red-500', "hover:bg-opacity-80 text-white")}>
                    {d.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* <Button variant="outline" size="sm" disabled>
                      <Edit className="h-4 w-4" />
                    </Button> */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting === d.id}>
                          {isDeleting === d.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción eliminará permanentemente el código <strong>{d.codigo}</strong> y no se podrá deshacer.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(d.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
