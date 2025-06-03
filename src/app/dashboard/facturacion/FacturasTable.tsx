"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Badge } from "@/components/ui/badge"
import {
  EyeIcon,
  Edit3Icon,
  XCircle,
  Trash2Icon,
  Receipt,
  AlertCircle,
  Calendar,
  User,
  Euro,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import type { FacturaParaTabla, EstadoFacturaPagoValue } from "./types"
import { eliminarFacturaBorrador, anularFactura } from "./actions"
import { cn } from "@/lib/utils"

interface FacturasTableProps {
  facturas: FacturaParaTabla[]
}

const formatCurrency = (amount: number | null | undefined): string => {
  if (typeof amount !== "number" || isNaN(amount)) return "-"
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

const getEstadoFacturaBadgeVariant = (
  estado?: EstadoFacturaPagoValue | string | null,
): "default" | "destructive" | "outline" | "secondary" => {
  switch (estado?.toLowerCase()) {
    case "borrador":
      return "outline"
    case "pendiente":
    case "vencida":
      return "secondary"
    case "pagada parcialmente":
      return "default"
    case "pagada":
      return "default"
    case "anulada":
      return "destructive"
    default:
      return "secondary"
  }
}

const getEstadoIcon = (estado?: EstadoFacturaPagoValue | string | null) => {
  switch (estado?.toLowerCase()) {
    case "borrador":
      return <FileText className="h-3 w-3" />
    case "pendiente":
      return <Clock className="h-3 w-3" />
    case "vencida":
      return <AlertTriangle className="h-3 w-3" />
    case "pagada parcialmente":
      return <AlertCircle className="h-3 w-3" />
    case "pagada":
      return <CheckCircle className="h-3 w-3" />
    case "anulada":
      return <XCircle className="h-3 w-3" />
    default:
      return <Clock className="h-3 w-3" />
  }
}

export default function FacturasTable({ facturas }: FacturasTableProps) {
  const router = useRouter()
  const [isProcessing, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  const handleEliminarBorrador = async (facturaId: string) => {
    setActionError(null)
    startTransition(async () => {
      const result = await eliminarFacturaBorrador(facturaId)
      if (!result.success) {
        setActionError(result.error?.message || "Error al eliminar la factura borrador.")
      } else {
        router.refresh()
      }
    })
  }

  const handleAnularFactura = async (facturaId: string) => {
    setActionError(null)
    startTransition(async () => {
      const result = await anularFactura(facturaId)
      if (!result.success) {
        setActionError(result.error?.message || "Error al anular la factura.")
      } else {
        router.refresh()
      }
    })
  }

  if (!facturas || facturas.length === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <Receipt className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay facturas registradas</h3>
          <p className="text-gray-500 text-center max-w-md">
            Cuando emitas tu primera factura, aparecerá aquí junto con toda la información de facturación.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3" role="alert">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-red-800 font-medium">Error en la operación</h4>
            <p className="text-red-700 text-sm mt-1">{actionError}</p>
          </div>
        </div>
      )}

      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg py-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Receipt className="h-5 w-5" />
            Facturas Emitidas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableCaption className="py-4 text-gray-600">
                Lista completa de facturas emitidas en el sistema
              </TableCaption>
              <TableHeader>
                <TableRow className="border-b border-gray-200 bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-700 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Nº Factura
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      Fecha Emisión
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600" />
                      Propietario
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Euro className="h-4 w-4 text-emerald-600" />
                      Total
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">Estado Pago</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((factura, index) => (
                  <TableRow
                    key={factura.id}
                    className={cn(
                      "hover:bg-blue-50/50 transition-colors duration-200",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                    )}
                  >
                    <TableCell className="font-medium py-4">
                      <Link
                        href={`/dashboard/facturacion/${factura.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors duration-200"
                      >
                        {factura.numero_factura}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {factura.fecha_emision
                        ? format(parseISO(factura.fecha_emision), "dd/MM/yyyy", { locale: es })
                        : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-700">
                      {factura.propietarios?.nombre_completo || "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatCurrency(factura.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={getEstadoFacturaBadgeVariant(factura.estado)}
                        className={cn(
                          "text-xs font-medium flex items-center gap-1 w-fit mx-auto px-3 py-1",
                          factura.estado === "Pagada" && "bg-green-500 hover:bg-green-600 text-white",
                          factura.estado === "Vencida" && "bg-orange-500 hover:bg-orange-600 text-white",
                          factura.estado === "Pagada Parcialmente" && "bg-blue-500 hover:bg-blue-600 text-white",
                          factura.estado === "Pendiente" && "bg-amber-500 hover:bg-amber-600 text-white",
                          factura.estado === "Borrador" && "bg-gray-500 hover:bg-gray-600 text-white",
                          factura.estado === "Anulada" && "bg-red-500 hover:bg-red-600 text-white",
                        )}
                      >
                        {getEstadoIcon(factura.estado)}
                        {factura.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          title="Ver Detalles"
                        >
                          <Link href={`/dashboard/facturacion/${factura.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        {factura.estado === "Borrador" && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                            title="Editar Factura"
                          >
                            <Link href={`/dashboard/facturacion/${factura.id}/editar`}>
                              <Edit3Icon className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {factura.estado === "Borrador" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                title="Eliminar Borrador"
                                disabled={isProcessing}
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-0 shadow-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-red-700">
                                  <Trash2Icon className="h-5 w-5" />
                                  ¿Eliminar factura borrador?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600">
                                  Esto eliminará permanentemente la factura borrador{" "}
                                  <strong>Nº {factura.numero_factura}</strong>. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={isProcessing} className="hover:bg-gray-100">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleEliminarBorrador(factura.id)}
                                  disabled={isProcessing}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  {isProcessing ? "Eliminando..." : "Sí, eliminar"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          (factura.estado === "Pendiente" ||
                            factura.estado === "Pagada Parcialmente" ||
                            factura.estado === "Vencida") && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                  title="Anular Factura"
                                  disabled={isProcessing}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white border-0 shadow-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2 text-orange-700">
                                    <XCircle className="h-5 w-5" />
                                    ¿Anular esta factura?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-600">
                                    Esto cambiará el estado de la factura <strong>Nº {factura.numero_factura}</strong> a
                                    "Anulada". No se eliminará, pero se considerará inválida.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={isProcessing} className="hover:bg-gray-100">
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleAnularFactura(factura.id)}
                                    disabled={isProcessing}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                  >
                                    {isProcessing ? "Anulando..." : "Sí, anular"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
