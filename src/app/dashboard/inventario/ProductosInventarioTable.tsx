// app/dashboard/inventario/ProductosInventarioTable.tsx
"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Edit3Icon, Trash2Icon, EyeIcon, PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns'; // parseISO para manejar fechas de la BD
import { es } from 'date-fns/locale';
// Importamos el tipo desde la página de listado (o un archivo types.ts si lo moviste)
import type { ProductoConStock } from './page'; 
import { eliminarProductoCatalogo } from './actions'; // Importamos la acción de eliminar

interface ProductosInventarioTableProps {
  productos: ProductoConStock[];
}

const formatCurrency = (amount: number | null | undefined): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '-'; // O 'N/A'
  }
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

export default function ProductosInventarioTable({ productos }: ProductosInventarioTableProps) {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleEliminarProducto = async (productoId: string) => {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await eliminarProductoCatalogo(productoId);
      if (!result.success) {
        setDeleteError(result.error?.message || "Ocurrió un error al eliminar el producto.");
        console.error("Error al eliminar producto del catálogo (cliente):", result.error);
      } else {
        router.refresh(); // Refresca la lista
      }
    });
  };

  if (!productos || productos.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 mb-4">No hay productos en el catálogo de inventario todavía.</p>
        <Button asChild>
          <Link href="/dashboard/inventario/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Primer Producto
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {deleteError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md" role="alert">
          Error al eliminar: {deleteError}
        </div>
      )}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableCaption className="py-4">Lista de productos en el catálogo de inventario.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Nombre</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Código</TableHead>
              <TableHead className="font-semibold text-center">Stock Actual</TableHead>
              <TableHead className="font-semibold text-center hidden sm:table-cell">Stock Mínimo</TableHead>
              <TableHead className="font-semibold text-right hidden sm:table-cell">Precio Venta</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Próx. Caducidad</TableHead>
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell className="font-medium">
                  {/* Enlaza a la página de detalle/gestión de lotes del producto */}
                  <Link href={`/dashboard/inventario/${producto.id}`} className="hover:underline text-primary">
                    {producto.nombre}
                  </Link>
                  {producto.requiere_lote && <Badge variant="outline" className="ml-2 text-xs">Lotes</Badge>}
                </TableCell>
                <TableCell className="hidden md:table-cell">{producto.codigo_producto || '-'}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={
                    producto.stock_total_actual <= (producto.stock_minimo || 0) 
                      ? "destructive" 
                      : producto.stock_total_actual <= (producto.stock_minimo || 0) * 1.2 // Umbral para "advertencia"
                        ? "secondary" // Usamos secondary, o puedes crear una variante 'warning'
                        : "default"   // O 'success' si la tienes
                  }>
                    {producto.stock_total_actual}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-1">({producto.unidad || 'Unidad'})</span>
                </TableCell>
                <TableCell className="text-center hidden sm:table-cell">{producto.stock_minimo ?? '-'}</TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  {formatCurrency(producto.precio_venta)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {producto.proxima_fecha_caducidad 
                    ? format(parseISO(producto.proxima_fecha_caducidad), 'dd/MM/yy', { locale: es }) 
                    : '-'}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button asChild variant="ghost" size="icon-sm" title="Gestionar Lotes/Detalles">
                    <Link href={`/dashboard/inventario/${producto.id}`}>
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="icon-sm" title="Editar Producto (Catálogo)">
                    <Link href={`/dashboard/inventario/${producto.id}/editar`}>
                      <Edit3Icon className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" title="Eliminar Producto" disabled={isDeleting}>
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el producto del catálogo
                          &quot;{producto.nombre}&quot;. Si el producto tiene lotes o está en uso, la eliminación podría fallar o tener consecuencias.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleEliminarProducto(producto.id)}
                          disabled={isDeleting}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}