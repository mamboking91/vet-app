// src/app/dashboard/facturacion/nueva/FacturaForm.tsx
"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  XIcon,
  PlusCircleIcon,
  FileTextIcon,
  CalculatorIcon,
  StickyNoteIcon,
  SaveIcon,
  ArrowLeftIcon,
  ShoppingCartIcon,
  AlertCircle
} from "lucide-react"
import { crearFacturaConItems, actualizarFacturaConItems } from "../actions"
import type {
  EntidadParaSelector,
  FacturaItemFormData,
  FacturaHeaderFormData,
  EstadoFacturaPagoValue,
  ImpuestoItemValue,
  NuevaFacturaPayload,
  ItemParaPayload,
  ProcedimientoParaFactura,
  ProductoInventarioParaFactura,
} from "../types"
import { estadosFacturaPagoOpciones, impuestoItemOpciones } from "../types"
import { format, parseISO, isValid as isValidDate } from "date-fns"

const formatCurrency = (amount: number | null | undefined): string => {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "0,00 €"
  }
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount)
}

interface FacturaFormProps {
  propietarios: EntidadParaSelector[]
  pacientes: (EntidadParaSelector & { propietario_id: string; especie?: string | null })[]
  procedimientosDisponibles: ProcedimientoParaFactura[]
  productosDisponibles: ProductoInventarioParaFactura[]
  initialData?: Partial<FacturaHeaderFormData & { items: FacturaItemFormData[] }>
  facturaId?: string
  origen: 'manual' | 'historial' | 'pedido';
  historialId?: string; // <-- AÑADIDO
}

type FieldErrors = {
  [key in keyof FacturaHeaderFormData]?: string[] | undefined
} & {
  items?: ({ [key in keyof ItemParaPayload]?: string[] | undefined } | string)[]
  general?: string
}

const DEFAULT_ITEM_TAX_RATE: ImpuestoItemValue = "7"

export default function FacturaForm({
  propietarios,
  pacientes: todosLosPacientes,
  procedimientosDisponibles,
  productosDisponibles,
  initialData,
  facturaId,
  origen,
  historialId, // <-- AÑADIDO
}: FacturaFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null)

  const isEditMode = Boolean(facturaId && initialData)

  const [propietarioId, setPropietarioId] = useState(initialData?.propietario_id || "")
  const [pacienteId, setPacienteId] = useState(initialData?.paciente_id || "")
  const [fechaEmision, setFechaEmision] = useState<Date | undefined>(
    initialData?.fecha_emision && isValidDate(parseISO(initialData.fecha_emision))
      ? parseISO(initialData.fecha_emision)
      : new Date(),
  )
  const [fechaVencimiento, setFechaVencimiento] = useState<Date | undefined>(
    initialData?.fecha_vencimiento && isValidDate(parseISO(initialData.fecha_vencimiento))
      ? parseISO(initialData.fecha_vencimiento)
      : undefined,
  )
  const [estadoFactura, setEstadoFactura] = useState<EstadoFacturaPagoValue>(initialData?.estado || "Borrador")
  const [notasCliente, setNotasCliente] = useState(initialData?.notas_cliente || "")
  const [notasInternas, setNotasInternas] = useState(initialData?.notas_internas || "")

  const getDefaultNewItem = (): FacturaItemFormData => ({
    id_temporal: crypto.randomUUID(),
    descripcion: "",
    cantidad: "1",
    precio_unitario: "0",
    porcentaje_impuesto_item: DEFAULT_ITEM_TAX_RATE,
    tipo_origen_item: "manual",
    procedimiento_id: null,
    producto_inventario_id: null,
    lote_id: null,
  })

  const [items, setItems] = useState<FacturaItemFormData[]>([getDefaultNewItem()]);

  const [pacientesFiltrados, setPacientesFiltrados] = useState<
    (EntidadParaSelector & { propietario_id: string; especie?: string | null })[]
  >([])

  useEffect(() => {
    if (propietarioId) {
      const filtered = todosLosPacientes.filter((p) => p.propietario_id === propietarioId)
      setPacientesFiltrados(filtered)
      if (!filtered.find((p) => p.id === pacienteId)) {
        setPacienteId("")
      }
    } else {
      setPacientesFiltrados([])
      setPacienteId("")
    }
  }, [propietarioId, todosLosPacientes, pacienteId])


  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setPropietarioId(initialData.propietario_id || "");
      setPacienteId(initialData.paciente_id || "");
      
      const emisionDate = initialData.fecha_emision ? parseISO(initialData.fecha_emision) : new Date();
      setFechaEmision(isValidDate(emisionDate) ? emisionDate : new Date());

      const vencimientoDate = initialData.fecha_vencimiento ? parseISO(initialData.fecha_vencimiento) : undefined;
      setFechaVencimiento(vencimientoDate && isValidDate(vencimientoDate) ? vencimientoDate : undefined);
      
      setEstadoFactura(initialData.estado || "Borrador");
      setNotasCliente(initialData.notas_cliente || "");
      setNotasInternas(initialData.notas_internas || "");

      if (initialData.items && initialData.items.length > 0) {
        const mappedItems = initialData.items.map(item => ({
          id_temporal: item.id_temporal || crypto.randomUUID(),
          descripcion: item.descripcion || '',
          cantidad: item.cantidad?.toString() || '1',
          precio_unitario: item.precio_unitario?.toString() || '0',
          porcentaje_impuesto_item: item.porcentaje_impuesto_item || DEFAULT_ITEM_TAX_RATE,
          tipo_origen_item: item.tipo_origen_item || 'manual',
          procedimiento_id: item.procedimiento_id || null,
          producto_inventario_id: item.producto_inventario_id || null,
          lote_id: item.lote_id || null,
        }));
        setItems(mappedItems);
      } else {
        setItems([getDefaultNewItem()]);
      }
    } else {
      setPropietarioId("");
      setPacienteId("");
      setFechaEmision(new Date());
      setFechaVencimiento(undefined);
      setEstadoFactura("Borrador");
      setNotasCliente("");
      setNotasInternas("");
      setItems([getDefaultNewItem()]);
    }
  }, [initialData]);

  const handleItemChange = (
    index: number,
    field: keyof Omit<FacturaItemFormData, "id_temporal">,
    value: string | null,
  ) => {
    const newItems = [...items]
    const currentItem = { ...newItems[index] }
    ;(currentItem as any)[field] = value

    if (field === "tipo_origen_item") {
      currentItem.descripcion = "" 
      currentItem.precio_unitario = "0"
      currentItem.porcentaje_impuesto_item = DEFAULT_ITEM_TAX_RATE
      currentItem.procedimiento_id = null
      currentItem.producto_inventario_id = null
      currentItem.lote_id = null
    }
    newItems[index] = currentItem
    setItems(newItems)
  }

  const handleCatalogItemSelect = (index: number, catalogItemId: string, type: "procedimiento" | "producto") => {
    const newItems = [...items]
    const currentItem = { ...newItems[index] } 
    let selectedCatalogItem

    currentItem.tipo_origen_item = type;

    if (type === "procedimiento") {
      selectedCatalogItem = procedimientosDisponibles.find((p) => p.id === catalogItemId)
      if (selectedCatalogItem) {
        currentItem.descripcion = selectedCatalogItem.nombre
        currentItem.precio_unitario = selectedCatalogItem.precio.toString()
        currentItem.porcentaje_impuesto_item = selectedCatalogItem.porcentaje_impuesto.toString() as ImpuestoItemValue
        currentItem.procedimiento_id = selectedCatalogItem.id
        currentItem.producto_inventario_id = null
        currentItem.lote_id = null
      }
    } else if (type === "producto") {
      selectedCatalogItem = productosDisponibles.find((p) => p.id === catalogItemId)
      if (selectedCatalogItem) {
        currentItem.descripcion = selectedCatalogItem.nombre
        currentItem.precio_unitario = (selectedCatalogItem.precio_venta || 0).toString()
        currentItem.porcentaje_impuesto_item = selectedCatalogItem.porcentaje_impuesto.toString() as ImpuestoItemValue
        currentItem.producto_inventario_id = selectedCatalogItem.id
        currentItem.procedimiento_id = null
        currentItem.lote_id = null 
      }
    }
    newItems[index] = currentItem
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, getDefaultNewItem()])
  }

  const removeItem = (id_temporal: string) => {
    setItems(items.filter((item) => item.id_temporal !== id_temporal))
  }

  const itemsCalculados = items.map((item) => {
    const cantidad = Number.parseFloat(item.cantidad) || 0
    const precioUnitario = Number.parseFloat(item.precio_unitario) || 0
    const porcentajeImpuestoItem = Number.parseFloat(item.porcentaje_impuesto_item) || 0
    const baseImponibleItem = cantidad * precioUnitario
    const montoImpuestoItem = baseImponibleItem * (porcentajeImpuestoItem / 100)
    const totalItem = baseImponibleItem + montoImpuestoItem
    return { ...item, baseImponibleItem, porcentajeImpuestoItem, montoImpuestoItem, totalItem }
  })

  const subtotalGeneralFactura = itemsCalculados.reduce((sum, item) => sum + item.baseImponibleItem, 0)
  const montoTotalImpuestos = itemsCalculados.reduce((sum, item) => sum + item.montoImpuestoItem, 0)
  const totalFactura = subtotalGeneralFactura + montoTotalImpuestos

  const desgloseImpuestosUI: { [rate: string]: { base: number; impuesto: number } } = {}
  itemsCalculados.forEach((item) => {
    const tasaKey = `${item.porcentajeImpuestoItem}%`
    if (!desgloseImpuestosUI[tasaKey]) {
      desgloseImpuestosUI[tasaKey] = { base: 0, impuesto: 0 }
    }
    desgloseImpuestosUI[tasaKey].base += item.baseImponibleItem
    desgloseImpuestosUI[tasaKey].impuesto += item.montoImpuestoItem
  })

  const tasasRelevantes = Object.keys(desgloseImpuestosUI).filter(
    (tasa) => desgloseImpuestosUI[tasa].base > 0 || desgloseImpuestosUI[tasa].impuesto > 0,
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors(null)

    const payloadItems: ItemParaPayload[] = items.map((item) => ({
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      porcentaje_impuesto_item: item.porcentaje_impuesto_item,
      procedimiento_id: item.procedimiento_id || null,
      producto_inventario_id: item.producto_inventario_id || null,
      lote_id: item.lote_id || null,
    }));

    const payload: NuevaFacturaPayload = {
      propietario_id: propietarioId,
      paciente_id: pacienteId || undefined,
      fecha_emision: fechaEmision ? format(fechaEmision, "yyyy-MM-dd") : "",
      fecha_vencimiento: fechaVencimiento ? format(fechaVencimiento, "yyyy-MM-dd") : undefined,
      estado: estadoFactura,
      notas_cliente: notasCliente || undefined,
      notas_internas: notasInternas || undefined,
      items: payloadItems,
    };

    startTransition(async () => {
      let result;
      // --- INICIO DE LA CORRECCIÓN ---
      // Se pasa el historialId a la acción de creación.
      if (isEditMode && facturaId) {
        result = await actualizarFacturaConItems(facturaId, payload)
      } else {
        result = await crearFacturaConItems(payload, origen, historialId)
      }
      // --- FIN DE LA CORRECCIÓN ---

      if (!result.success) {
        setFormError(result.error?.message || "Ocurrió un error.")
        if (result.error?.errors) {
          setFieldErrors(result.error.errors as FieldErrors)
        }
      } else {
        router.push(isEditMode && result.data?.id ? `/dashboard/facturacion/${result.data.id}` : "/dashboard/facturacion")
        router.refresh()
      }
    })
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <FileTextIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {isEditMode ? "Editar Factura" : "Nueva Factura"}
              </h1>
              <p className="text-sm text-gray-600">
                {isEditMode
                  ? "Modifica los datos de la factura existente"
                  : "Completa los datos para crear una nueva factura"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg py-3">
              <CardTitle className="flex items-center justify-center gap-2 text-lg font-semibold">
                <FileTextIcon className="h-5 w-5" />
                Datos de la Factura
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="numero_factura" className="text-sm font-medium text-gray-700">
                    Número de Factura
                  </Label>
                  <Input
                    id="numero_factura"
                    name="numero_factura"
                    value={isEditMode ? initialData?.numero_factura : "Se generará automáticamente"}
                    readOnly
                    disabled
                    className="h-10 bg-gray-100 dark:bg-slate-800 cursor-not-allowed"
                  />
                  {fieldErrors?.numero_factura && (
                    <p className="text-xs text-red-500">{fieldErrors.numero_factura[0]}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fecha_emision" className="text-sm font-medium text-gray-700">
                    Fecha de Emisión
                  </Label>
                  <DatePicker date={fechaEmision} onDateChange={setFechaEmision} />
                  <input
                    type="hidden"
                    name="fecha_emision"
                    value={fechaEmision ? format(fechaEmision, "yyyy-MM-dd") : ""}
                  />
                  {fieldErrors?.fecha_emision && <p className="text-xs text-red-500">{fieldErrors.fecha_emision[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fecha_vencimiento" className="text-sm font-medium text-gray-700">
                    Fecha de Vencimiento <span className="text-xs text-gray-500">(opcional)</span>
                  </Label>
                  <DatePicker date={fechaVencimiento} onDateChange={setFechaVencimiento} />
                  <input
                    type="hidden"
                    name="fecha_vencimiento"
                    value={fechaVencimiento ? format(fechaVencimiento, "yyyy-MM-dd") : ""}
                  />
                  {fieldErrors?.fecha_vencimiento && (
                    <p className="text-xs text-red-500">{fieldErrors.fecha_vencimiento[0]}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="propietario_id_form" className="text-sm font-medium text-gray-700">
                    Propietario
                  </Label>
                  <Select name="propietario_id" required value={propietarioId} onValueChange={setPropietarioId}>
                    <SelectTrigger id="propietario_id_form" className="h-10 border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Selecciona propietario" />
                    </SelectTrigger>
                    <SelectContent>
                      {propietarios.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors?.propietario_id && (
                    <p className="text-xs text-red-500">{fieldErrors.propietario_id[0]}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="paciente_id_form" className="text-sm font-medium text-gray-700">
                    Paciente <span className="text-xs text-gray-500">(opcional)</span>
                  </Label>
                  <Select
                    name="paciente_id"
                    value={pacienteId}
                    onValueChange={setPacienteId}
                    disabled={!propietarioId || pacientesFiltrados.length === 0}
                  >
                    <SelectTrigger
                      id="paciente_id_form"
                      className="h-10 border-gray-300 focus:border-blue-500 disabled:bg-gray-50"
                    >
                      <SelectValue placeholder="Selecciona paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientesFiltrados.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="estado_form" className="text-sm font-medium text-gray-700">
                    Estado
                  </Label>
                  <Select
                    name="estado"
                    required
                    value={estadoFactura}
                    onValueChange={(value) => setEstadoFactura(value as EstadoFacturaPagoValue)}
                  >
                    <SelectTrigger id="estado_form" className="h-10 border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosFacturaPagoOpciones.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors?.estado && <p className="text-xs text-red-500">{fieldErrors.estado[0]}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg py-3">
              <CardTitle className="flex items-center justify-center gap-2 text-lg font-semibold">
                <ShoppingCartIcon className="h-5 w-5" />
                Ítems de la Factura
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {itemsCalculados.map((item, index) => (
                  <div
                    key={item.id_temporal}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Origen</Label>
                        <Select
                          value={item.tipo_origen_item || "manual"}
                          onValueChange={(value) =>
                            handleItemChange(
                              index,
                              "tipo_origen_item",
                              value as "manual" | "procedimiento" | "producto",
                            )
                          }
                        >
                          <SelectTrigger className="h-9 text-sm border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">✏️ Manual</SelectItem>
                            <SelectItem value="procedimiento">🏥 Procedimiento</SelectItem>
                            <SelectItem value="producto">📦 Producto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {item.tipo_origen_item === "procedimiento" && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600">Procedimiento</Label>
                          <Select
                            value={item.procedimiento_id || ""}
                            onValueChange={(value) => handleCatalogItemSelect(index, value, "procedimiento")}
                          >
                            <SelectTrigger className="h-9 text-sm border-gray-300">
                              <SelectValue placeholder="Selecciona procedimiento" />
                            </SelectTrigger>
                            <SelectContent>
                              {procedimientosDisponibles.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.nombre} ({formatCurrency(p.precio)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {item.tipo_origen_item === "producto" && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600">Producto</Label>
                          <Select
                            value={item.producto_inventario_id || ""}
                            onValueChange={(value) => handleCatalogItemSelect(index, value, "producto")}
                          >
                            <SelectTrigger className="h-9 text-sm border-gray-300">
                              <SelectValue placeholder="Selecciona producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {productosDisponibles.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.nombre} ({formatCurrency(p.precio_venta)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-1 md:col-span-2 lg:col-span-1">
                        <Label className="text-xs font-medium text-gray-600">Descripción</Label>
                        <Input
                          placeholder="Descripción del servicio o producto..."
                          value={item.descripcion}
                          onChange={(e) => handleItemChange(index, "descripcion", e.target.value)}
                          required
                          className="h-9 text-sm border-gray-300"
                          disabled={item.tipo_origen_item !== "manual"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Cantidad</Label>
                        <Input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(index, "cantidad", e.target.value)}
                          required
                          min="1"
                          className="h-9 text-sm text-center border-gray-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Precio Unitario (€)</Label>
                        <Input
                          type="number"
                          value={item.precio_unitario}
                          onChange={(e) => handleItemChange(index, "precio_unitario", e.target.value)}
                          required
                          step="0.01"
                          min="0"
                          className="h-9 text-sm text-right border-gray-300"
                          disabled={item.tipo_origen_item !== "manual"}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">IGIC (%)</Label>
                        <Select
                          value={item.porcentaje_impuesto_item}
                          onValueChange={(value) =>
                            handleItemChange(index, "porcentaje_impuesto_item", value as ImpuestoItemValue | string)
                          }
                          disabled={item.tipo_origen_item !== "manual"}
                        >
                          <SelectTrigger className="h-9 text-sm border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {impuestoItemOpciones.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Base Imponible</Label>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                          <span className="text-sm font-semibold text-blue-700">
                            {formatCurrency(item.baseImponibleItem)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">IGIC</Label>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
                          <span className="text-sm font-semibold text-purple-700">
                            {formatCurrency(item.montoImpuestoItem)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Total Item</Label>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                          <span className="text-sm font-bold text-green-700">{formatCurrency(item.totalItem)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id_temporal)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <XIcon className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <Button
                  type="button"
                  onClick={addItem}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2"
                >
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  Añadir Item
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg py-3">
              <CardTitle className="flex items-center justify-center gap-2 text-lg font-semibold">
                <CalculatorIcon className="h-5 w-5" />
                Resumen y Totales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-base font-medium text-gray-700 pb-2 border-b">
                    <span>Subtotal:</span>
                    <span className="text-blue-600">{formatCurrency(subtotalGeneralFactura)}</span>
                  </div>
                  {tasasRelevantes.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-700 text-sm">Desglose IGIC:</p>
                      {tasasRelevantes.map((tasaKey) => (
                        <div key={tasaKey} className="bg-blue-50 p-2 rounded text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>
                              Base {tasaKey}: {formatCurrency(desgloseImpuestosUI[tasaKey].base)}
                            </span>
                            <span>IGIC: {formatCurrency(desgloseImpuestosUI[tasaKey].impuesto)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center text-base font-medium text-gray-700 py-2 border-t">
                    <span>Total IGIC:</span>
                    <span className="text-purple-600">{formatCurrency(montoTotalImpuestos)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-lg">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(totalFactura)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg py-3">
              <CardTitle className="flex items-center justify-center gap-2 text-lg font-semibold">
                <StickyNoteIcon className="h-5 w-5" />
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="notas_cliente" className="text-sm font-medium text-gray-700">
                  Notas para el Cliente
                </Label>
                <Textarea
                  id="notas_cliente"
                  name="notas_cliente"
                  value={notasCliente}
                  onChange={(e) => setNotasCliente(e.target.value)}
                  rows={3}
                  className="border-gray-300 focus:border-amber-500 resize-none"
                  placeholder="Información adicional visible para el cliente..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notas_internas" className="text-sm font-medium text-gray-700">
                  Notas Internas
                </Label>
                <Textarea
                  id="notas_internas"
                  name="notas_internas"
                  value={notasInternas}
                  onChange={(e) => setNotasInternas(e.target.value)}
                  rows={3}
                  className="border-gray-300 focus:border-amber-500 resize-none"
                  placeholder="Notas internas para uso del equipo..."
                />
              </div>
            </CardContent>
          </Card>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                <XIcon className="h-4 w-4" />
                {formError}
              </p>
            </div>
          )}
          {fieldErrors?.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                <XIcon className="h-4 w-4" />
                {fieldErrors.general}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 justify-center">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 font-semibold"
              size="lg"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isEditMode ? "Actualizando..." : "Creando..."}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SaveIcon className="h-5 w-5" />
                  {isEditMode ? "Guardar Cambios" : "Crear Factura"}
                </div>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-3 font-semibold"
              size="lg"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}