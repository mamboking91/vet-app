"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { DialogFooter } from "@/components/ui/dialog"
import { agregarStock } from "./actions"
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
  cantidad?: string[]
  numero_lote?: string[]
  fecha_entrada?: string[]
  fecha_caducidad?: string[]
  general?: string
}

export default function AñadirStockForm({ producto, onFormSubmit, onCancel }: AñadirStockFormProps) {
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null)

  const [cantidad, setCantidad] = useState("")
  const [numeroLote, setNumeroLote] = useState("")
  const [fechaEntrada, setFechaEntrada] = useState<Date | undefined>(new Date())
  const [fechaCaducidad, setFechaCaducidad] = useState<Date | undefined>(undefined)

  useEffect(() => {
    setCantidad("")
    setNumeroLote("")
    setFechaEntrada(new Date())
    setFechaCaducidad(undefined)
    setFormError(null)
    setFieldErrors(null)
  }, [producto])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors(null)

    const formData = new FormData(event.currentTarget)
    // CORRECCIÓN: Añadimos las fechas manualmente al FormData ya que DatePicker no tiene 'name'
    if (fechaEntrada) {
        formData.append('fecha_entrada', format(fechaEntrada, "yyyy-MM-dd"));
    }
    if (fechaCaducidad) {
        formData.append('fecha_caducidad', format(fechaCaducidad, "yyyy-MM-dd"));
    }
    
    startTransition(async () => {
      // Llamamos a la nueva acción unificada, pasando el ID de la variante
      const result = await agregarStock(producto.id, formData)

      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error al añadir stock.")
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors)
        }
      } else {
        onFormSubmit()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-4">
      <div className="space-y-2">
        <Label htmlFor="cantidad_modal_add_stock" className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Layers className="h-4 w-4 text-green-600" />
          Cantidad a Añadir
        </Label>
        <Input
          id="cantidad_modal_add_stock"
          name="cantidad"
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          min="1"
          required
          placeholder="Ej: 10" // <-- CORRECCIÓN: Placeholder simplificado
          className="h-10 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
        />
        {fieldErrors?.cantidad && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {fieldErrors.cantidad[0]}
          </p>
        )}
      </div>

      {producto.requiere_lote && (
        <>
            <div className="space-y-2">
              <Label htmlFor="numero_lote_modal_add_stock" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Package className="h-4 w-4 text-blue-600" />
                Número de Lote
              </Label>
              <Input
                id="numero_lote_modal_add_stock"
                name="numero_lote"
                value={numeroLote}
                onChange={(e) => setNumeroLote(e.target.value)}
                required
                placeholder="Ej: LOTE001"
                className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
              />
              {fieldErrors?.numero_lote && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {fieldErrors.numero_lote[0]}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="fecha_entrada_modal_add_stock" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    Fecha de Entrada
                  </Label>
                  {/* CORRECCIÓN: Se elimina la prop 'name' */}
                  <DatePicker date={fechaEntrada} onDateChange={setFechaEntrada} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_caducidad_modal_add_stock" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Clock className="h-4 w-4 text-red-600" />
                    Fecha de Caducidad <span className="text-xs text-gray-500">(opcional)</span>
                  </Label>
                  {/* CORRECCIÓN: Se elimina la prop 'name' */}
                  <DatePicker date={fechaCaducidad} onDateChange={setFechaCaducidad} />
                </div>
            </div>
        </>
      )}

      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{formError}</p>
        </div>
      )}

      <DialogFooter className="pt-4 gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}> Cancelar </Button>
        <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white">
          {isPending ? 'Añadiendo...' : 'Añadir Stock'}
        </Button>
      </DialogFooter>
    </form>
  )
}