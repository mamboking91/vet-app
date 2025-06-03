"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { DialogFooter } from "@/components/ui/dialog"
import { registrarEntradaLote } from "./actions"
import type { ProductoConStock } from "./types"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar, Package, AlertTriangle, Layers, Clock } from "lucide-react"

interface AñadirStockFormProps {
  producto: ProductoConStock
  onFormSubmit: () => void
  onCancel: () => void
}

type FieldErrors = {
  numero_lote?: string[]
  stock_lote?: string[]
  fecha_entrada?: string[]
  fecha_caducidad?: string[]
  general?: string
}

const NOMBRE_LOTE_GENERICO_PARA_FORMULARIO = "STOCK_UNICO"

export default function AñadirStockForm({ producto, onFormSubmit, onCancel }: AñadirStockFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null)

  const [numeroLote, setNumeroLote] = useState(producto.requiere_lote ? "" : NOMBRE_LOTE_GENERICO_PARA_FORMULARIO)
  const [stockEntrada, setStockEntrada] = useState("")
  const [fechaEntrada, setFechaEntrada] = useState<Date | undefined>(new Date())
  const [fechaCaducidad, setFechaCaducidad] = useState<Date | undefined>(undefined)

  useEffect(() => {
    if (!producto.requiere_lote) {
      setNumeroLote(NOMBRE_LOTE_GENERICO_PARA_FORMULARIO)
    } else {
      setNumeroLote("")
    }
    setStockEntrada("")
    setFechaEntrada(new Date())
    setFechaCaducidad(undefined)
    setFormError(null)
    setFieldErrors(null)
  }, [producto])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors(null)

    const formData = new FormData()
    formData.append("numero_lote", numeroLote)
    formData.append("stock_lote", stockEntrada)
    formData.append("fecha_entrada", fechaEntrada ? format(fechaEntrada, "yyyy-MM-dd") : "")
    if (producto.requiere_lote && fechaCaducidad) {
      formData.append("fecha_caducidad", format(fechaCaducidad, "yyyy-MM-dd"))
    } else if (producto.requiere_lote && !fechaCaducidad) {
      formData.append("fecha_caducidad", "")
    }

    startTransition(async () => {
      const result = await registrarEntradaLote(producto.id, formData)

      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error al añadir stock.")
        if (result.error?.errors) {
          console.error("Errores de campo de Zod:", result.error.errors)
          setFieldErrors(result.error.errors as FieldErrors)
        } else {
          console.error("Error general de la acción:", result.error?.message)
        }
      } else {
        onFormSubmit()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-4">
      {producto.requiere_lote && (
        <div className="space-y-2">
          <Label
            htmlFor="numero_lote_modal_add_stock"
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <Package className="h-4 w-4 text-blue-600" />
            Número de Lote
          </Label>
          <Input
            id="numero_lote_modal_add_stock"
            name="numero_lote"
            value={numeroLote}
            onChange={(e) => setNumeroLote(e.target.value)}
            required={producto.requiere_lote}
            placeholder="Ej: LOTE001"
            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <span className="w-1 h-1 bg-blue-500 rounded-full inline-block"></span>
            Si el lote ya existe, se añadirá stock. Si no, se creará uno nuevo.
          </p>
          {fieldErrors?.numero_lote && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {fieldErrors.numero_lote[0]}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label
          htmlFor="stock_entrada_modal_add_stock"
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <Layers className="h-4 w-4 text-green-600" />
          Cantidad a Añadir
        </Label>
        <Input
          id="stock_entrada_modal_add_stock"
          name="stock_lote"
          type="number"
          value={stockEntrada}
          onChange={(e) => setStockEntrada(e.target.value)}
          min="1"
          required
          placeholder={`En ${producto.unidad || "unidades"}`}
          className="h-10 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
        />
        {fieldErrors?.stock_lote && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {fieldErrors.stock_lote[0]}
          </p>
        )}
      </div>

      <div className={cn("grid gap-5", producto.requiere_lote ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
        <div className="space-y-2">
          <Label
            htmlFor="fecha_entrada_modal_add_stock"
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <Calendar className="h-4 w-4 text-purple-600" />
            Fecha de Entrada
          </Label>
          <div className="relative">
            <DatePicker
              date={fechaEntrada}
              onDateChange={setFechaEntrada}
              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
            />
          </div>
          {fieldErrors?.fecha_entrada && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {fieldErrors.fecha_entrada[0]}
            </p>
          )}
        </div>

        {producto.requiere_lote && (
          <div className="space-y-2">
            <Label
              htmlFor="fecha_caducidad_modal_add_stock"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Clock className="h-4 w-4 text-red-600" />
              Fecha de Caducidad <span className="text-xs text-gray-500">(opcional)</span>
            </Label>
            <div className="relative">
              <DatePicker
                date={fechaCaducidad}
                onDateChange={setFechaCaducidad}
                className="border-gray-300 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
            {fieldErrors?.fecha_caducidad && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {fieldErrors.fecha_caducidad[0]}
              </p>
            )}
          </div>
        )}
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{formError}</p>
        </div>
      )}

      <DialogFooter className="pt-4 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Añadiendo...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Añadir Stock
            </div>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
