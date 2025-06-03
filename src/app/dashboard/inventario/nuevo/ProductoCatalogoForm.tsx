"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { agregarProductoCatalogo, actualizarProductoCatalogo } from "../actions"
import {
  unidadesDeMedidaInventarioOpciones,
  impuestoItemOpciones,
  type ProductoCatalogoFormData,
  type UnidadMedidaInventarioValue,
  type ImpuestoItemValue,
} from "../types"
import {
  Package,
  FileText,
  Ruler,
  BarChart2,
  Euro,
  Calculator,
  Save,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Layers,
  StickyNote,
  ShoppingCart,
  Tag,
} from "lucide-react"

interface ProductoCatalogoFormProps {
  initialData?: Partial<ProductoCatalogoFormData> // Incluye stock_no_lote_valor
  productoId?: string
}

type FieldErrors = {
  [key in keyof ProductoCatalogoFormData]?: string[] | undefined
} & { general?: string }

const DEFAULT_PRODUCT_TAX_RATE: ImpuestoItemValue = "7" // O "0" si prefieres exento por defecto

export default function ProductoCatalogoForm({ initialData, productoId }: ProductoCatalogoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null)
  const [success, setSuccess] = useState(false)

  const isEditMode = Boolean(productoId && initialData)

  // Estados generales del producto
  const [nombre, setNombre] = useState(initialData?.nombre || "")
  const [descripcion, setDescripcion] = useState(initialData?.descripcion || "")
  const [codigoProducto, setCodigoProducto] = useState(initialData?.codigo_producto || "")
  const [unidad, setUnidad] = useState<UnidadMedidaInventarioValue | "">(
    (initialData?.unidad as UnidadMedidaInventarioValue) || "Unidad",
  )
  const [stockMinimo, setStockMinimo] = useState(initialData?.stock_minimo || "0")
  const [precioCompra, setPrecioCompra] = useState(initialData?.precio_compra || "")
  const [requiereLote, setRequiereLote] = useState(
    initialData?.requiere_lote === undefined ? true : initialData.requiere_lote,
  )
  const [notasInternas, setNotasInternas] = useState(initialData?.notas_internas || "")

  // Estados para precios de venta e impuestos
  const [precioVentaBaseStr, setPrecioVentaBaseStr] = useState(initialData?.precio_venta || "")
  const [porcentajeImpuestoStr, setPorcentajeImpuestoStr] = useState<ImpuestoItemValue | string>(
    initialData?.porcentaje_impuesto || DEFAULT_PRODUCT_TAX_RATE,
  )
  const [precioVentaFinalStr, setPrecioVentaFinalStr] = useState("")
  const [lastPriceInput, setLastPriceInput] = useState<"base" | "final">(initialData?.precio_venta ? "base" : "final")

  // Estado para stock de productos SIN lote
  const [stockNoLoteValorStr, setStockNoLoteValorStr] = useState(initialData?.stock_no_lote_valor || "")

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || "")
      setDescripcion(initialData.descripcion || "")
      setCodigoProducto(initialData.codigo_producto || "")
      setUnidad((initialData.unidad as UnidadMedidaInventarioValue) || "Unidad")
      setStockMinimo(initialData.stock_minimo || "0")
      setPrecioCompra(initialData.precio_compra || "")
      const initialRequiereLote = initialData.requiere_lote === undefined ? true : initialData.requiere_lote
      setRequiereLote(initialRequiereLote)
      setNotasInternas(initialData.notas_internas || "")
      setPorcentajeImpuestoStr(initialData.porcentaje_impuesto || DEFAULT_PRODUCT_TAX_RATE)

      const initialBasePrice = initialData.precio_venta || ""
      setPrecioVentaBaseStr(initialBasePrice)
      setLastPriceInput("base")

      if (initialBasePrice) {
        const base = Number.parseFloat(initialBasePrice)
        const tax = Number.parseFloat(
          (initialData.porcentaje_impuesto as string) || (DEFAULT_PRODUCT_TAX_RATE as string),
        )
        if (!isNaN(base) && !isNaN(tax)) {
          const final = base * (1 + tax / 100)
          setPrecioVentaFinalStr(final.toFixed(2))
        } else {
          setPrecioVentaFinalStr("")
        }
      } else {
        setPrecioVentaFinalStr("")
      }

      setStockNoLoteValorStr(initialData.stock_no_lote_valor || "")
    } else {
      // Valores por defecto para un nuevo formulario
      setNombre("")
      setDescripcion("")
      setCodigoProducto("")
      setUnidad("Unidad")
      setStockMinimo("0")
      setPrecioCompra("")
      setRequiereLote(true)
      setNotasInternas("")
      setPrecioVentaBaseStr("")
      setPorcentajeImpuestoStr(DEFAULT_PRODUCT_TAX_RATE)
      setPrecioVentaFinalStr("")
      setLastPriceInput("base")
      setStockNoLoteValorStr("")
    }
  }, [initialData])

  // Calcular precio final cuando cambia el base o el impuesto
  useEffect(() => {
    if (lastPriceInput === "base") {
      const base = Number.parseFloat(precioVentaBaseStr)
      const tax = Number.parseFloat(porcentajeImpuestoStr as string)
      if (!isNaN(base) && !isNaN(tax)) {
        const final = base * (1 + tax / 100)
        setPrecioVentaFinalStr(final.toFixed(2))
      } else if (precioVentaBaseStr === "" && !isNaN(tax)) {
        setPrecioVentaFinalStr("")
      }
    }
  }, [precioVentaBaseStr, porcentajeImpuestoStr, lastPriceInput])

  // Calcular precio base cuando cambia el final o el impuesto
  useEffect(() => {
    if (lastPriceInput === "final") {
      const final = Number.parseFloat(precioVentaFinalStr)
      const tax = Number.parseFloat(porcentajeImpuestoStr as string)
      if (!isNaN(final) && !isNaN(tax) && 1 + tax / 100 !== 0) {
        const base = final / (1 + tax / 100)
        setPrecioVentaBaseStr(base.toFixed(2))
      } else if (precioVentaFinalStr === "" && !isNaN(tax)) {
        setPrecioVentaBaseStr("")
      }
    }
  }, [precioVentaFinalStr, porcentajeImpuestoStr, lastPriceInput])

  const handlePrecioVentaBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrecioVentaBaseStr(e.target.value)
    setLastPriceInput("base")
  }

  const handlePrecioVentaFinalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrecioVentaFinalStr(e.target.value)
    setLastPriceInput("final")
  }

  const handlePorcentajeImpuestoChange = (value: ImpuestoItemValue | string) => {
    setPorcentajeImpuestoStr(value)
    // Al cambiar el impuesto, forzar el recálculo basado en el modo de entrada actual
    if (lastPriceInput === "base") {
      // Disparar el efecto de cálculo de precio final
      const base = Number.parseFloat(precioVentaBaseStr)
      const tax = Number.parseFloat(value as string)
      if (!isNaN(base) && !isNaN(tax)) {
        const final = base * (1 + tax / 100)
        setPrecioVentaFinalStr(final.toFixed(2))
      } else if (precioVentaBaseStr === "" && !isNaN(tax)) {
        setPrecioVentaFinalStr("")
      }
    } else {
      // lastPriceInput === 'final'
      // Disparar el efecto de cálculo de precio base
      const final = Number.parseFloat(precioVentaFinalStr)
      const tax = Number.parseFloat(value as string)
      if (!isNaN(final) && !isNaN(tax) && 1 + tax / 100 !== 0) {
        const base = final / (1 + tax / 100)
        setPrecioVentaBaseStr(base.toFixed(2))
      } else if (precioVentaFinalStr === "" && !isNaN(tax)) {
        setPrecioVentaBaseStr("")
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors(null)

    const formData = new FormData()
    formData.append("nombre", nombre)
    formData.append("descripcion", descripcion)
    formData.append("codigo_producto", codigoProducto)
    formData.append("unidad", unidad)
    formData.append("stock_minimo", stockMinimo)
    formData.append("precio_compra", precioCompra)
    formData.append("precio_venta", precioVentaBaseStr)
    formData.append("porcentaje_impuesto", porcentajeImpuestoStr as string)
    formData.append("requiere_lote", requiereLote ? "on" : "off")
    formData.append("notas_internas", notasInternas)

    if (!requiereLote && stockNoLoteValorStr) {
      // Enviar si no requiere lote y tiene valor
      formData.append("stock_no_lote_valor", stockNoLoteValorStr)
    } else if (!requiereLote && isEditMode && stockNoLoteValorStr === "") {
      // Si en modo edición se borra el stock para un producto sin lote, enviar '0'
      formData.append("stock_no_lote_valor", "0")
    }

    startTransition(async () => {
      let result
      if (isEditMode && productoId) {
        result = await actualizarProductoCatalogo(productoId, formData)
      } else {
        result = await agregarProductoCatalogo(formData)
      }

      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.")
        if (result.error?.errors) setFieldErrors(result.error.errors as FieldErrors)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard/inventario")
          router.refresh()
        }, 1500)
      }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-green-100 p-6 mb-6">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Producto {isEditMode ? "actualizado" : "creado"} exitosamente!
              </h2>
              <p className="text-gray-600 text-center">
                El producto ha sido {isEditMode ? "actualizado" : "registrado"} correctamente en el catálogo.
              </p>
              <div className="mt-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Arrow Button */}
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200 px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Volver</span>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {isEditMode ? "Editar Producto del Catálogo" : "Añadir Nuevo Producto al Catálogo"}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditMode
                  ? "Modifica la información del producto en el catálogo"
                  : "Registra un nuevo producto en el catálogo de inventario"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Package className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    Nombre del Producto/Medicamento *
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="Ej: Antibiótico X, Vacuna Y..."
                  />
                  {fieldErrors?.nombre && <p className="text-xs text-red-500">{fieldErrors.nombre[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="codigo_producto"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <Tag className="h-4 w-4 text-purple-600" />
                    Código/SKU <span className="text-xs text-gray-500">(opcional)</span>
                  </Label>
                  <Input
                    id="codigo_producto"
                    name="codigo_producto"
                    value={codigoProducto}
                    onChange={(e) => setCodigoProducto(e.target.value)}
                    className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                    placeholder="Ej: MED001, VAC002..."
                  />
                  {fieldErrors?.codigo_producto && (
                    <p className="text-xs text-red-500">{fieldErrors.codigo_producto[0]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  Descripción <span className="text-xs text-gray-500">(opcional)</span>
                </Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 resize-none"
                  placeholder="Descripción detallada del producto..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="unidad" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-amber-600" />
                    Unidad de Medida
                  </Label>
                  <Select
                    name="unidad"
                    value={unidad}
                    onValueChange={(value) => setUnidad(value as UnidadMedidaInventarioValue | "")}
                    defaultValue="Unidad"
                  >
                    <SelectTrigger
                      id="unidad"
                      className="h-11 border-gray-300 focus:border-amber-500 focus:ring-amber-500/20"
                    >
                      <SelectValue placeholder="Selecciona unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesDeMedidaInventarioOpciones.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors?.unidad && <p className="text-xs text-red-500">{fieldErrors.unidad[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_minimo" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-red-600" />
                    Stock Mínimo <span className="text-xs text-gray-500">(opcional)</span>
                  </Label>
                  <Input
                    id="stock_minimo"
                    name="stock_minimo"
                    type="number"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                    min="0"
                    placeholder="0"
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500/20 transition-all duration-200"
                  />
                  {fieldErrors?.stock_minimo && <p className="text-xs text-red-500">{fieldErrors.stock_minimo[0]}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="precio_compra" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-indigo-600" />
                  Precio de Compra (€) <span className="text-xs text-gray-500">(opcional)</span>
                </Label>
                <Input
                  id="precio_compra"
                  name="precio_compra"
                  type="number"
                  value={precioCompra}
                  onChange={(e) => setPrecioCompra(e.target.value)}
                  step="0.01"
                  min="0"
                  className="h-11 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                  placeholder="25.00"
                />
                {fieldErrors?.precio_compra && <p className="text-xs text-red-500">{fieldErrors.precio_compra[0]}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Precios de Venta e Impuestos */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Euro className="h-5 w-5" />
                Precio de Venta e Impuestos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="precio_venta_base"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <Euro className="h-4 w-4 text-green-600" />
                    Precio Venta Base (€ sin IGIC) *
                  </Label>
                  <Input
                    id="precio_venta_base"
                    name="precio_venta"
                    type="number"
                    value={precioVentaBaseStr}
                    onChange={handlePrecioVentaBaseChange}
                    step="0.01"
                    min="0"
                    required
                    className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    placeholder="25.00"
                  />
                  {fieldErrors?.precio_venta && <p className="text-xs text-red-500">{fieldErrors.precio_venta[0]}</p>}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="porcentaje_impuesto_prod"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <Calculator className="h-4 w-4 text-purple-600" />% IGIC Aplicable *
                  </Label>
                  <Select
                    name="porcentaje_impuesto"
                    value={porcentajeImpuestoStr}
                    onValueChange={handlePorcentajeImpuestoChange}
                    required
                  >
                    <SelectTrigger
                      id="porcentaje_impuesto_prod"
                      className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
                    >
                      <SelectValue placeholder="IGIC %" />
                    </SelectTrigger>
                    <SelectContent>
                      {impuestoItemOpciones.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors?.porcentaje_impuesto && (
                    <p className="text-xs text-red-500">{fieldErrors.porcentaje_impuesto[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="precio_venta_final"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <Euro className="h-4 w-4 text-emerald-600" />
                    Precio Venta Final (€ con IGIC)
                  </Label>
                  <Input
                    id="precio_venta_final"
                    type="number"
                    value={precioVentaFinalStr}
                    onChange={handlePrecioVentaFinalChange}
                    step="0.01"
                    min="0"
                    className="h-11 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
                    placeholder="26.75"
                  />
                  <p className="text-xs text-gray-500">Modifique para calcular el precio base.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gestión de Lotes y Stock */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Layers className="h-5 w-5" />
                Gestión de Lotes y Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Checkbox
                  id="requiere_lote"
                  name="requiere_lote"
                  checked={requiereLote}
                  onCheckedChange={(checkedState) => setRequiereLote(Boolean(checkedState === true))}
                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <Label htmlFor="requiere_lote" className="text-sm font-medium text-purple-800 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Este producto se gestiona por lotes
                </Label>
              </div>

              {!requiereLote && (
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label
                    htmlFor="stock_no_lote_valor"
                    className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  >
                    <BarChart2 className="h-4 w-4 text-blue-600" />
                    {isEditMode ? "Stock Actual (si no usa lotes)" : "Stock Inicial (si no usa lotes)"}
                  </Label>
                  <Input
                    id="stock_no_lote_valor"
                    name="stock_no_lote_valor"
                    type="number"
                    value={stockNoLoteValorStr}
                    onChange={(e) => setStockNoLoteValorStr(e.target.value)}
                    min="0"
                    placeholder="0"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <p className="text-xs text-blue-700">
                    {isEditMode
                      ? "Modifique para ajustar el stock actual de este producto (se registrará un movimiento de ajuste)."
                      : "Cantidad inicial si este producto no usa lotes específicos."}
                  </p>
                  {fieldErrors?.stock_no_lote_valor && (
                    <p className="text-xs text-red-500">{fieldErrors.stock_no_lote_valor[0]}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas Internas */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <StickyNote className="h-5 w-5" />
                Notas Internas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label htmlFor="notas_internas" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-amber-600" />
                  Notas Internas <span className="text-xs text-gray-500">(opcional)</span>
                </Label>
                <Textarea
                  id="notas_internas"
                  name="notas_internas"
                  value={notasInternas}
                  onChange={(e) => setNotasInternas(e.target.value)}
                  rows={3}
                  className="border-gray-300 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-200 resize-none"
                  placeholder="Notas internas para el equipo..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Mensaje de Error */}
          {formError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-red-800 font-medium">
                      Error al {isEditMode ? "actualizar" : "crear"} producto
                    </h4>
                    <p className="text-red-700 text-sm mt-1">{formError}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de Acción */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 h-12 font-semibold"
                  size="lg"
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {isEditMode ? "Actualizando..." : "Guardando..."}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      {isEditMode ? "Guardar Cambios" : "Guardar Producto"}
                    </div>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isPending}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 px-8 py-3 h-12 font-semibold"
                  size="lg"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Cancelar
                </Button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Los campos marcados con <span className="text-red-500">*</span> son obligatorios
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
