"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { agregarProductoYVariantes, actualizarProductoCatalogo } from "../actions"
import {
  impuestoItemOpciones,
  type ProductoCatalogoFormData,
  type ImpuestoItemValue,
  type ImagenProducto
} from "../types"
import {
  Package,
  Save,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Layers,
  Store,
  Star,
  Image as ImageIcon,
  X,
  ArrowUp,
  ArrowDown,
  Crown,
  Box,
  Boxes,
  Palette,
  PlusCircle,
  Trash2,
  Euro,
  Calculator,
  BarChart2
} from "lucide-react"

interface ProductoCatalogoFormProps {
  initialData?: Partial<ProductoCatalogoFormData>
  productoId?: string
}

type FieldErrors = {
  [key in keyof ProductoCatalogoFormData]?: string[] | undefined
} & { general?: string }

const DEFAULT_PRODUCT_TAX_RATE: ImpuestoItemValue = "7"

// Tipo para una variante en el estado del formulario
type FormVariant = {
  id: number;
  sku: string;
  precio_venta: string; // Precio base
  precio_final: string; // Precio con impuesto
  stock_inicial: string;
  lastPriceInput: 'base' | 'final'; // Para saber cuál calcular
  imagePreviewUrl?: string | null; // Para previsualizar la imagen de la variante
  atributos: Record<string, string>;
};

export default function ProductoCatalogoForm({ initialData, productoId }: ProductoCatalogoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null)
  const [success, setSuccess] = useState(false)
  const isEditMode = Boolean(productoId && initialData)

  // --- Estados del Formulario ---
  const [nombre, setNombre] = useState(initialData?.nombre || "")
  const [tipo, setTipo] = useState<'simple' | 'variable'>(initialData?.tipo || 'simple');
  const [requiereLote, setRequiereLote] = useState(initialData?.requiere_lote === undefined ? true : initialData.requiere_lote)
  const [porcentajeImpuestoStr, setPorcentajeImpuestoStr] = useState<ImpuestoItemValue | string>(initialData?.porcentaje_impuesto || DEFAULT_PRODUCT_TAX_RATE)
  
  // Estados para E-commerce
  const [enTienda, setEnTienda] = useState(initialData?.en_tienda || false);
  const [destacado, setDestacado] = useState(initialData?.destacado || false);
  const [descripcionPublica, setDescripcionPublica] = useState(initialData?.descripcion_publica || "");
  const [categoriasStr, setCategoriasStr] = useState(Array.isArray(initialData?.categorias_tienda) ? initialData.categorias_tienda.map(c => c.nombre).join(', ') : "");
  const [images, setImages] = useState<ImagenProducto[]>(initialData?.imagenes || []);

  // --- Estados para Producto Simple ---
  const [simpleSku, setSimpleSku] = useState(initialData?.codigo_producto || "")
  const [simplePrecioBase, setSimplePrecioBase] = useState(initialData?.precio_venta || "")
  const [simplePrecioFinal, setSimplePrecioFinal] = useState("")
  const [simpleLastInput, setSimpleLastInput] = useState<'base' | 'final'>('base')
  const [simpleStock, setSimpleStock] = useState(initialData?.stock_no_lote_valor || "")

  // --- Estados para Producto Variable ---
  const [attributeStr, setAttributeStr] = useState('Talla, Color');
  const [variants, setVariants] = useState<FormVariant[]>([{ id: Date.now(), sku: '', precio_venta: '', precio_final: '', stock_inicial: '', lastPriceInput: 'base', atributos: {} }]);

  // --- Lógica de Cálculo de Precios ---
  useEffect(() => {
    if (simpleLastInput === 'base') {
      const base = parseFloat(simplePrecioBase);
      const tax = parseFloat(porcentajeImpuestoStr as string);
      if (!isNaN(base) && !isNaN(tax)) setSimplePrecioFinal((base * (1 + tax / 100)).toFixed(2));
      else setSimplePrecioFinal("");
    }
  }, [simplePrecioBase, porcentajeImpuestoStr, simpleLastInput]);

  useEffect(() => {
    if (simpleLastInput === 'final') {
      const final = parseFloat(simplePrecioFinal);
      const tax = parseFloat(porcentajeImpuestoStr as string);
      if (!isNaN(final) && !isNaN(tax) && (1 + tax / 100) !== 0) setSimplePrecioBase((final / (1 + tax / 100)).toFixed(2));
      else setSimplePrecioBase("");
    }
  }, [simplePrecioFinal, porcentajeImpuestoStr, simpleLastInput]);

  useEffect(() => {
    const tax = parseFloat(porcentajeImpuestoStr as string);
    if (isNaN(tax)) return;
    setVariants(currentVariants => currentVariants.map(variant => {
      if (variant.lastPriceInput === 'base') {
        const base = parseFloat(variant.precio_venta);
        const newFinal = !isNaN(base) ? (base * (1 + tax / 100)).toFixed(2) : '';
        return { ...variant, precio_final: newFinal };
      } else {
        const final = parseFloat(variant.precio_final);
        const newBase = !isNaN(final) && (1 + tax / 100) !== 0 ? (final / (1 + tax / 100)).toFixed(2) : '';
        return { ...variant, precio_venta: newBase };
      }
    }));
  }, [porcentajeImpuestoStr]);


  const attributeNames = attributeStr.split(',').map(s => s.trim()).filter(Boolean);

  const handleAddVariant = () => {
    setVariants(prev => [...prev, { id: Date.now(), sku: '', precio_venta: '', precio_final: '', stock_inicial: '', lastPriceInput: 'base', atributos: {} }]);
  };

  const handleRemoveVariant = (id: number) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const handleVariantChange = (id: number, field: 'sku' | 'stock_inicial', value: string) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };
  
  const handleVariantImageChange = (id: number, file: File | null) => {
    if (!file) {
      setVariants(prev => prev.map(v => v.id === id ? { ...v, imagePreviewUrl: null } : v));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setVariants(prev => prev.map(v => v.id === id ? { ...v, imagePreviewUrl: previewUrl } : v));
  };

  const handleVariantPriceChange = (id: number, field: 'precio_venta' | 'precio_final', value: string) => {
    const tax = parseFloat(porcentajeImpuestoStr as string);
    if (isNaN(tax)) return;
    setVariants(prev => prev.map(v => {
      if (v.id !== id) return v;
      if (field === 'precio_venta') {
        const base = parseFloat(value);
        const newFinal = !isNaN(base) ? (base * (1 + tax / 100)).toFixed(2) : '';
        return { ...v, precio_venta: value, precio_final: newFinal, lastPriceInput: 'base' };
      } else {
        const final = parseFloat(value);
        const newBase = !isNaN(final) && (1 + tax / 100) !== 0 ? (final / (1 + tax / 100)).toFixed(2) : '';
        return { ...v, precio_final: value, precio_venta: newBase, lastPriceInput: 'final' };
      }
    }));
  };
  
  const handleAttributeChange = (id: number, attributeName: string, value: string) => {
    setVariants(prev => prev.map(v => 
      v.id === id ? { ...v, atributos: { ...v.atributos, [attributeName]: value } } : v
    ));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors(null)

    const formData = new FormData(event.currentTarget);
    formData.append("existing_images", JSON.stringify(images));
    
    if (tipo === 'simple') {
      formData.set('precio_venta', simplePrecioBase);
    }
    
    if (tipo === 'variable') {
      formData.append('variants_data', JSON.stringify(variants));
      const variantImageInputs = event.currentTarget.querySelectorAll<HTMLInputElement>('input[name^="variant_image_"]');
      variantImageInputs.forEach(input => {
        if (input.files && input.files[0]) {
          formData.append(input.name, input.files[0]);
        }
      });
    }
    
    startTransition(async () => {
      const result = isEditMode && productoId
        ? await actualizarProductoCatalogo(productoId, formData)
        : await agregarProductoYVariantes(formData);

      if (!result.success) {
        if ('error' in result && result.error) {
          setFormError(result.error.message || "Ocurrió un error.");
          if (result.error.errors) {
            setFieldErrors(result.error.errors as FieldErrors);
          }
        } else {
          setFormError("Ocurrió un error inesperado.");
        }
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard/inventario")
          router.refresh()
        }, 1500)
      }
    })
  }
  
  const handleSetPrimary = (url: string) => setImages(images.map(img => ({ ...img, isPrimary: img.url === url })));
  const handleRemoveImage = (url: string) => {
    const newImages = images.filter(img => img.url !== url);
    if (!newImages.some(img => img.isPrimary) && newImages.length > 0) newImages[0].isPrimary = true;
    setImages(newImages);
  };
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
      const newImages = [...images];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newImages.length) return;
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      setImages(newImages.map((img, idx) => ({ ...img, order: idx })));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-green-100 p-6 mb-6"><CheckCircle className="h-16 w-16 text-green-600" /></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Producto {isEditMode ? "actualizado" : "creado"} exitosamente!</h2>
              <p className="text-gray-600 text-center">El producto ha sido {isEditMode ? "actualizado" : "registrado"} correctamente en el catálogo.</p>
              <div className="mt-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button type="button" variant="ghost" onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200 px-3 py-2 rounded-lg">
            <ArrowLeft className="h-5 w-5" /><span className="text-sm font-medium">Volver</span>
          </Button>
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg"><Package className="h-8 w-8 text-white" /></div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{isEditMode ? "Editar Producto del Catálogo" : "Añadir Nuevo Producto"}</h1>
              <p className="text-gray-600 mt-1">{isEditMode ? "Modifica la información del producto" : "Registra un nuevo producto en el catálogo"}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Información Principal</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre del Producto *</Label>
                        <Input id="nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej: Collar antiparasitario..."/>
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de Producto *</Label>
                        <RadioGroup name="tipo" value={tipo} onValueChange={(v) => setTipo(v as 'simple' | 'variable')} className="flex gap-4 pt-2">
                            <Label htmlFor="tipo-simple" className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer flex-1 transition-all has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
                                <RadioGroupItem value="simple" id="tipo-simple" /> <Box className="h-5 w-5 text-blue-600"/>
                                <div><p className="font-semibold">Producto Simple</p><p className="text-xs text-muted-foreground">Un producto sin variaciones.</p></div>
                            </Label>
                            <Label htmlFor="tipo-variable" className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer flex-1 transition-all has-[:checked]:bg-purple-50 has-[:checked]:border-purple-500">
                                <RadioGroupItem value="variable" id="tipo-variable" /> <Boxes className="h-5 w-5 text-purple-600"/>
                                <div><p className="font-semibold">Producto Variable</p><p className="text-xs text-muted-foreground">Con opciones como tallas o colores.</p></div>
                            </Label>
                        </RadioGroup>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="porcentaje_impuesto" className="flex items-center gap-2"><Calculator className="h-4 w-4 text-purple-600" />% IGIC Aplicable</Label>
                            <Select name="porcentaje_impuesto" value={porcentajeImpuestoStr} onValueChange={setPorcentajeImpuestoStr} required>
                                <SelectTrigger id="porcentaje_impuesto"><SelectValue placeholder="IGIC %" /></SelectTrigger>
                                <SelectContent>{impuestoItemOpciones.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200 self-end">
                            <Checkbox id="requiere_lote" name="requiere_lote" checked={requiereLote} onCheckedChange={(s) => setRequiereLote(Boolean(s === true))}/>
                            <Label htmlFor="requiere_lote" className="text-sm font-medium text-blue-800 flex items-center gap-2"><Layers className="h-4 w-4" />Gestionar por lotes</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {tipo === 'simple' && (
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader><CardTitle>Precio y Stock (Producto Simple)</CardTitle></CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" name="sku" value={simpleSku} onChange={(e) => setSimpleSku(e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="precio_venta">Precio Base (€)</Label><Input id="precio_venta" name="precio_venta" type="number" value={simplePrecioBase} onChange={(e) => {setSimplePrecioBase(e.target.value); setSimpleLastInput('base');}} step="0.01" min="0" /></div>
                            <div className="space-y-2"><Label htmlFor="precio_final_simple">Precio Final (€)</Label><Input id="precio_final_simple" type="number" value={simplePrecioFinal} onChange={(e) => {setSimplePrecioFinal(e.target.value); setSimpleLastInput('final');}} step="0.01" min="0" /></div>
                        </div>
                        {!requiereLote && (<div className="space-y-2"><Label htmlFor="stock_no_lote_valor">Stock Inicial</Label><Input id="stock_no_lote_valor" name="stock_no_lote_valor" type="number" value={simpleStock} onChange={(e) => setSimpleStock(e.target.value)} min="0" /></div>)}
                    </CardContent>
                </Card>
            )}

            {tipo === 'variable' && (
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-purple-600"/>Atributos y Variantes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="attributes">Nombres de Atributos</Label>
                            <Input id="attributes" name="attributes" value={attributeStr} onChange={e => setAttributeStr(e.target.value)} placeholder="Talla, Color, Material..."/>
                            <p className="text-xs text-muted-foreground">Separa los nombres por comas.</p>
                        </div>
                        <div className="space-y-4">
                            {variants.map((variant) => (
                                <div key={variant.id} className="p-4 border rounded-lg bg-gray-50 space-y-4 relative">
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleRemoveVariant(variant.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {attributeNames.map(attrName => (
                                            <div key={attrName} className="space-y-1">
                                                <Label htmlFor={`variant-${variant.id}-${attrName}`} className="text-xs capitalize">{attrName}</Label>
                                                <Input id={`variant-${variant.id}-${attrName}`} placeholder={`Valor para ${attrName}`} value={variant.atributos[attrName] || ''} onChange={e => handleAttributeChange(variant.id, attrName, e.target.value)} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 border-t">
                                        <div className="space-y-1 lg:col-span-1"><Label htmlFor={`variant-${variant.id}-sku`} className="text-xs">SKU</Label><Input id={`variant-${variant.id}-sku`} placeholder="SKU de variante" value={variant.sku} onChange={e => handleVariantChange(variant.id, 'sku', e.target.value)} /></div>
                                        <div className="space-y-1 lg:col-span-1"><Label htmlFor={`variant-${variant.id}-precio-base`} className="text-xs">Precio Base (€)</Label><Input id={`variant-${variant.id}-precio-base`} type="number" placeholder="19.99" value={variant.precio_venta} onChange={e => handleVariantPriceChange(variant.id, 'precio_venta', e.target.value)} /></div>
                                        <div className="space-y-1 lg:col-span-1"><Label htmlFor={`variant-${variant.id}-precio-final`} className="text-xs">Precio Final (€)</Label><Input id={`variant-${variant.id}-precio-final`} type="number" placeholder="21.39" value={variant.precio_final} onChange={e => handleVariantPriceChange(variant.id, 'precio_final', e.target.value)} /></div>
                                        {!requiereLote && (
                                            <div className="space-y-1 lg:col-span-1"><Label htmlFor={`variant-${variant.id}-stock`} className="text-xs">Stock Inicial</Label><Input id={`variant-${variant.id}-stock`} type="number" placeholder="0" value={variant.stock_inicial} onChange={e => handleVariantChange(variant.id, 'stock_inicial', e.target.value)} /></div>
                                        )}
                                        <div className="space-y-1 lg:col-span-1">
                                            <Label htmlFor={`variant_image_${variant.id}`} className="text-xs">Imagen Variante</Label>
                                            {variant.imagePreviewUrl && <Image src={variant.imagePreviewUrl} alt="Previsualización" width={40} height={40} className="rounded object-cover"/>}
                                            <Input id={`variant_image_${variant.id}`} name={`variant_image_${variant.id}`} type="file" accept="image/*" onChange={(e) => handleVariantImageChange(variant.id, e.target.files ? e.target.files[0] : null)} className="text-xs"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" onClick={handleAddVariant} className="w-full"><PlusCircle className="mr-2 h-4 w-4"/>Añadir otra variante</Button>
                    </CardContent>
                </Card>
            )}
            
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" />Datos para la Tienda Online</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="flex items-center space-x-3 p-4 bg-pink-50 rounded-lg border border-pink-200 h-full"><Checkbox id="en_tienda" name="en_tienda" checked={enTienda} onCheckedChange={(s) => setEnTienda(Boolean(s === true))} /><Label htmlFor="en_tienda" className="text-sm font-medium text-pink-800 flex items-center gap-2 cursor-pointer"><Store className="h-4 w-4" />Mostrar en la tienda</Label></div>
                        <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200 h-full"><Checkbox id="destacado" name="destacado" checked={destacado} onCheckedChange={(s) => setDestacado(Boolean(s === true))} /><Label htmlFor="destacado" className="text-sm font-medium text-yellow-800 flex items-center gap-2 cursor-pointer"><Star className="h-4 w-4" />Marcar como destacado</Label></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="descripcion_publica">Descripción Pública</Label><Textarea id="descripcion_publica" name="descripcion_publica" value={descripcionPublica} onChange={(e) => setDescripcionPublica(e.target.value)} rows={4} placeholder="Descripción para la página del producto..."/></div>
                    <div className="space-y-2"><Label htmlFor="categorias_tienda">Categorías</Label><Input id="categorias_tienda" name="categorias_tienda" value={categoriasStr} onChange={(e) => setCategoriasStr(e.target.value)} placeholder="Ej: Alimentación, Juguetes" /><p className="text-xs text-muted-foreground">Separa las categorías por comas.</p></div>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Imágenes Principales del Producto</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {isEditMode && images.length > 0 && (
                        <div className="space-y-3 p-4 border rounded-lg bg-slate-50">
                            <p className="text-xs text-muted-foreground mb-2">Gestionar imágenes actuales:</p>
                            {images.map((image, index) => (
                                <div key={image.url} className="flex items-center gap-3 p-2 border rounded-md bg-white">
                                    <Image src={image.url} alt="Imagen de producto" width={64} height={64} className="rounded border object-cover h-16 w-16"/>
                                    <div className="flex-grow text-xs truncate text-muted-foreground">{image.url.split('/').pop()}</div>
                                    <div className="flex items-center gap-1">
                                        <Button type="button" variant={image.isPrimary ? "default" : "outline"} size="sm" onClick={() => handleSetPrimary(image.url)} title="Marcar como principal"><Crown className={`h-4 w-4 ${image.isPrimary ? 'text-yellow-300' : ''}`}/></Button>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleMoveImage(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4"/></Button>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleMoveImage(index, 'down')} disabled={index === images.length - 1}><ArrowDown className="h-4 w-4"/></Button>
                                        <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveImage(image.url)}><X className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div>
                        <Label htmlFor="imagenes" className="text-xs text-muted-foreground">Añadir nuevas imágenes principales:</Label>
                        <Input id="imagenes" name="imagenes[]" type="file" multiple accept="image/png, image/jpeg, image/webp" />
                    </div>
                </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex justify-center">
                        <Button type="submit" disabled={isPending} size="lg" className="px-8 py-3">{isPending ? "Guardando..." : "Guardar Producto"}</Button>
                    </div>
                </CardContent>
            </Card>
        </form>
      </div>
    </div>
  )
}
