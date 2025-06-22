"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
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
  Eye,
  PlusCircle,
  Layers,
  Package,
  AlertTriangle,
  Euro,
  Calculator,
  BarChart2,
  Store, // <-- Importamos el nuevo icono
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

  if (!productos || productos.length === 0) {
    return (
      <div className="border-dashed border-2 border-gray-300 rounded-lg">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-6 mb-6">
            <Package className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No hay productos en el inventario</h3>
          <p className="text-gray-600 text-center max-w-md mb-6 leading-relaxed">
            Comienza agregando el primer producto para gestionar tu inventario.
          </p>
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
          >
            <Link href="/dashboard/inventario/nuevo">
              <PlusCircle className="mr-2 h-5 w-5" />
              Añadir Primer Producto
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {deleteError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-red-800 font-medium">Error al eliminar producto</h4>
            <p className="text-red-700 text-sm mt-1">{deleteError}</p>
          </div>
        </div>
      )}

      <div className="shadow-lg border-0 bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden">
        {/* Encabezados de tabla */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-b-2 border-blue-200 grid grid-cols-12 gap-4 py-3 px-4">
          <div className="col-span-3 font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              Producto
            </div>
          </div>
          <div className="col-span-1 font-bold text-gray-800 text-center">
            <div className="flex flex-col items-center gap-1">
              <BarChart2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-xs">Stock</span>
            </div>
          </div>
          <div className="col-span-1 hidden md:block font-bold text-gray-800 text-center">
            <div className="flex flex-col items-center gap-1">
              <BarChart2 className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span className="text-xs">Mínimo</span>
            </div>
          </div>
          <div className="col-span-2 font-bold text-gray-800 text-center">
            <div className="flex flex-col items-center gap-1">
              <Euro className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-xs">Precio Base</span>
            </div>
          </div>
          <div className="col-span-1 font-bold text-gray-800 text-center">
            <div className="flex flex-col items-center gap-1">
              <Calculator className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <span className="text-xs">% IGIC</span>
            </div>
          </div>
          <div className="col-span-2 font-bold text-gray-800 text-center">
            <div className="flex flex-col items-center gap-1">
              <Euro className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <span className="text-xs">Precio Final</span>
            </div>
          </div>
          <div className="col-span-2 text-right font-bold text-gray-800">Acciones</div>
        </div>

        {/* Filas de datos */}
        <div>
          {productos.map((producto, index) => {
            const precioBase = producto.precio_venta ?? 0
            const impuestoPorcentaje = producto.porcentaje_impuesto ?? 0
            const montoImpuesto = precioBase * (impuestoPorcentaje / 100)
            const precioFinal = precioBase + montoImpuesto

            return (
              <div
                key={producto.id}
                className={`
                  grid grid-cols-12 gap-4 py-3 px-4
                  hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 
                  transition-all duration-200 border-b border-gray-100
                  ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
                `}
              >
                <div className="col-span-3">
                  <Link
                    href={`/dashboard/inventario/${producto.id}`}
                    className="flex items-center gap-3 hover:text-blue-700 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {producto.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{producto.nombre}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-xs text-gray-500">ID: {producto.id.slice(0, 8)}...</div>
                        {producto.requiere_lote && (
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                            Lotes
                          </Badge>
                        )}
                        {/* --- NUEVO INDICADOR DE TIENDA --- */}
                        {producto.en_tienda && (
                            <Badge variant="outline" className="text-xs bg-pink-100 text-pink-700 border-pink-300">
                                <Store className="h-3 w-3 mr-1" />
                                En tienda
                            </Badge>
                        )}
                        {/* ----------------------------- */}
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <Badge
                      variant={
                        producto.stock_minimo !== null && producto.stock_total_actual <= producto.stock_minimo
                          ? "destructive"
                          : producto.stock_minimo !== null && producto.stock_total_actual <= producto.stock_minimo * 1.2
                            ? "secondary"
                            : "default"
                      }
                      className={cn(
                        "px-2.5 py-1",
                        producto.stock_minimo !== null &&
                          producto.stock_total_actual > producto.stock_minimo &&
                          producto.stock_total_actual <= producto.stock_minimo * 1.2 &&
                          "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200",
                      )}
                    >
                      {producto.stock_total_actual}
                    </Badge>
                    <span className="text-xs text-gray-500 mt-1">({producto.unidad || "u"})</span>
                  </div>
                </div>

                <div className="col-span-1 hidden md:flex items-center justify-center">
                  <span className="text-sm text-gray-600">{producto.stock_minimo ?? "-"}</span>
                </div>

                <div className="col-span-2 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-800">{formatCurrency(precioBase)}</span>
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    {impuestoPorcentaje}%
                  </Badge>
                </div>

                <div className="col-span-2 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-700">{formatCurrency(precioFinal)}</span>
                </div>

                <div className="col-span-2 flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Añadir Stock / Registrar Entrada"
                    onClick={() => handleOpenAddStockModal(producto)}
                    className="h-8 w-8 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 rounded-full"
                  >
                    <Layers className="h-4 w-4" />
                  </Button>

                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    title="Gestionar Lotes/Detalles"
                    className="h-8 w-8 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-full"
                  >
                    <Link href={`/dashboard/inventario/${producto.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    title="Editar Producto (Catálogo)"
                    className="h-8 w-8 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 rounded-full"
                  >
                    <Link href={`/dashboard/inventario/${producto.id}/editar`}>
                      <Edit3 className="h-4 w-4" />
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 rounded-full"
                        title="Eliminar Producto del Catálogo"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                              Confirmar eliminación
                            </AlertDialogTitle>
                          </div>
                        </div>
                        <AlertDialogDescription className="text-gray-600 leading-relaxed">
                          Esta acción <strong>no se puede deshacer</strong>. Se eliminará permanentemente el producto
                          <span className="font-semibold text-gray-900"> "{producto.nombre}"</span>. Si el producto
                          tiene lotes o está en uso, la eliminación podría fallar o tener consecuencias.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                          disabled={isDeleting}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300"
                        >
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleEliminarProducto(producto.id)}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          {isDeleting ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Eliminando...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              Sí, eliminar
                            </div>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pie de tabla */}
        <div className="py-6 text-gray-600 bg-gray-50/50 text-center">
          <div className="flex items-center justify-center gap-2">
            <Package className="h-4 w-4" />
            Catálogo de productos en inventario
          </div>
        </div>
      </div>

      {/* Modal para Añadir Stock */}
      {selectedProductForStock && (
        <Dialog open={isAddStockModalOpen} onOpenChange={setIsAddStockModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Layers className="h-5 w-5 text-green-600" />
                Añadir Stock: {selectedProductForStock.nombre}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {selectedProductForStock.requiere_lote
                  ? "Este producto se gestiona por lotes. Vas a registrar una nueva entrada de lote."
                  : "Este producto no se gestiona por lotes. Se añadirá stock al inventario general del producto."}
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