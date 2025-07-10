// src/app/dashboard/inventario/ProductosInventarioTable.tsx
"use client"

import React, { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Edit3,
  Trash2,
  Layers,
  PlusCircle,
  Package,
  AlertTriangle,
  Euro,
  Calculator,
  BarChart2,
  Store,
  ChevronDown,
} from "lucide-react"
import type { ProductoConStock } from "./types"
import { eliminarProductoCatalogo } from "./actions"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import AñadirStockForm from "./AñadirStockForm"

interface ProductosInventarioTableProps {
  productos: ProductoConStock[]
}

export default function ProductosInventarioTable({ productos }: ProductosInventarioTableProps) {
  const router = useRouter()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false)
  const [selectedProductForStock, setSelectedProductForStock] = useState<ProductoConStock | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const handleEliminarProducto = async (productoId: string) => {
    setDeleteError(null)
    startDeleteTransition(async () => {
      const result = await eliminarProductoCatalogo(productoId)
      if (!result.success) {
        setDeleteError(result.error?.message || "Ocurrió un error al eliminar el producto.")
      } else {
        router.refresh()
      }
    })
  }

  const handleOpenAddStockModal = (producto: ProductoConStock) => {
    setSelectedProductForStock(producto)
    setIsAddStockModalOpen(true)
  }

  const handleAddStockModalClose = (refresh?: boolean) => {
    setIsAddStockModalOpen(false)
    setSelectedProductForStock(null)
    if (refresh) {
      router.refresh()
    }
  }

  const toggleExpandRow = (rowId: string) => {
    setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const productosAgrupados = useMemo(() => {
    if (!productos) return [];
    const agrupados: Record<string, ProductoConStock[]> = {};
    productos.forEach(p => {
        if (!agrupados[p.producto_padre_id]) {
            agrupados[p.producto_padre_id] = [];
        }
        agrupados[p.producto_padre_id].push(p);
    });
    return Object.values(agrupados);
  }, [productos]);


  if (!productos || productos.length === 0) {
    return (
      <div className="border-dashed border-2 border-gray-300 rounded-lg"><div className="flex flex-col items-center justify-center py-16"><div className="rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-6 mb-6"><Package className="h-12 w-12 text-blue-600" /></div><h3 className="text-xl font-bold text-gray-900 mb-3">No hay productos en el inventario</h3><p className="text-gray-600 text-center max-w-md mb-6 leading-relaxed">Comienza agregando el primer producto para gestionar tu inventario.</p><Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"><Link href="/dashboard/inventario/nuevo"><PlusCircle className="mr-2 h-5 w-5" />Añadir Primer Producto</Link></Button></div></div>
    )
  }

  return (
    <>
      {deleteError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"><AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" /><div><h4 className="text-red-800 font-medium">Error al eliminar producto</h4><p className="text-red-700 text-sm mt-1">{deleteError}</p></div></div>
      )}

      <div className="shadow-lg border-0 bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-b-2 border-blue-200 grid grid-cols-12 gap-4 py-3 px-4">
          <div className="col-span-4 font-bold text-gray-800 flex items-center gap-2"><Package className="h-4 w-4 text-blue-600" />Producto</div>
          <div className="col-span-2 font-bold text-gray-800 text-center flex flex-col items-center gap-1"><BarChart2 className="h-4 w-4 text-green-600" /><span className="text-xs">Stock Total</span></div>
          <div className="col-span-2 font-bold text-gray-800 text-center flex flex-col items-center gap-1"><Store className="h-4 w-4" /><span className="text-xs">En Tienda</span></div>
          <div className="col-span-4 text-right font-bold text-gray-800">Acciones</div>
        </div>

        <div>
          {productosAgrupados.map((grupoVariantes, index) => {
            const productoPadre = grupoVariantes[0];
            const nombrePadre = productoPadre.nombre.split(' - ')[0];
            const stockTotalGrupo = grupoVariantes.reduce((sum, v) => sum + (v.stock_total_actual || 0), 0);
            const isExpanded = expandedRows[productoPadre.producto_padre_id];
            const hasMultipleVariants = grupoVariantes.length > 1;

            return (
                <div key={productoPadre.producto_padre_id} className="border-b border-gray-100 last:border-b-0">
                    <div className={cn("grid grid-cols-12 gap-4 py-3 px-4 items-center hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200", index % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                        <div className="col-span-4 flex items-center gap-3">
                            <Image
                                src={productoPadre.imagenes?.[0]?.url || 'https://placehold.co/100x100/e2e8f0/e2e8f0.png?text=N/A'}
                                alt={nombrePadre}
                                width={48}
                                height={48}
                                className="rounded-lg object-cover h-12 w-12 shadow-sm flex-shrink-0"
                            />
                            <div>
                                <Link href={`/dashboard/inventario/${productoPadre.producto_padre_id}`} className="font-semibold text-gray-900 hover:text-blue-700">{nombrePadre}</Link>
                                <div className="flex items-center gap-2 mt-1">
                                  {hasMultipleVariants ? <Badge variant="outline">{grupoVariantes.length} variantes</Badge> : <Badge variant="outline">Simple</Badge>}
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2 text-center"><Badge variant={stockTotalGrupo > 0 ? "default" : "destructive"}>{stockTotalGrupo}</Badge></div>
                        <div className="col-span-2 text-center">
                          <Badge variant={productoPadre.en_tienda ? "default" : "secondary"}>{productoPadre.en_tienda ? 'Sí' : 'No'}</Badge>
                        </div>
                        <div className="col-span-4 flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" title={isExpanded ? "Ocultar variantes" : "Mostrar variantes"} onClick={() => toggleExpandRow(productoPadre.producto_padre_id)} className="h-8 w-8 rounded-full">
                                <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                            <Button asChild variant="ghost" size="icon" title="Editar Producto" className="h-8 w-8 rounded-full"><Link href={`/dashboard/inventario/${productoPadre.producto_padre_id}/editar`}><Edit3 className="h-4 w-4" /></Link></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-full" title="Eliminar Producto" disabled={isDeleting}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle><AlertDialogDescription>Se eliminará permanentemente "{nombrePadre}" y TODAS sus variantes.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleEliminarProducto(productoPadre.producto_padre_id)}>{isDeleting ? 'Eliminando...' : 'Sí, eliminar'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                    {isExpanded && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-100 dark:bg-slate-800 text-xs">
                              <tr>
                                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Variante</th>
                                <th className="px-4 py-2 text-center font-medium text-muted-foreground">Stock</th>
                                <th className="px-4 py-2 text-center font-medium text-muted-foreground">Precio Final</th>
                                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-700">
                              {grupoVariantes.map(variante => {
                                const precioFinal = (variante.precio_venta || 0) * (1 + (variante.porcentaje_impuesto || 0) / 100);
                                return (
                                  <tr key={variante.id}>
                                      <td className="px-4 py-2 whitespace-nowrap font-medium">{variante.nombre.split(' - ')[1] || 'Variante única'}</td>
                                      <td className="px-4 py-2 text-center font-medium">{variante.stock_total_actual}</td>
                                      <td className="px-4 py-2 text-center font-semibold text-indigo-600">{formatCurrency(precioFinal)}</td>
                                      <td className="px-4 py-2 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenAddStockModal(variante)}><Layers className="h-3 w-3 mr-2" /> Stock</Button>
                                        <Button variant="ghost" size="sm" asChild><Link href={`/dashboard/inventario/${variante.producto_padre_id}/variantes/${variante.id}/editar`}><Edit3 className="h-3 w-3 mr-2" /> Editar</Link></Button>
                                      </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </div>
            )
          })}
        </div>
      </div>

      {selectedProductForStock && (
        <Dialog open={isAddStockModalOpen} onOpenChange={setIsAddStockModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Stock: {selectedProductForStock.nombre}</DialogTitle>
              <DialogDescription>
                {selectedProductForStock.requiere_lote
                  ? "Este producto requiere lote. Registra una nueva entrada."
                  : "Añade stock directamente a esta variante."}
              </DialogDescription>
            </DialogHeader>
            <AñadirStockForm
              producto={selectedProductForStock}
              onFormSubmit={() => handleAddStockModalClose(true)}
              onCancel={() => handleAddStockModalClose(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}