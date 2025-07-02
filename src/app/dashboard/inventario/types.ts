// src/app/dashboard/inventario/types.ts

// -----------------------------------------------------------------------------
// Constantes y Tipos para Opciones de Selects (Usados en Formularios y Zod)
// -----------------------------------------------------------------------------

export const unidadesDeMedidaInventarioOpciones = [
  { value: "Unidad", label: "Unidad (ud.)" },
  { value: "Caja", label: "Caja" },
  { value: "Blister", label: "Blíster" },
  { value: "Frasco", label: "Frasco" },
  { value: "Tubo", label: "Tubo" },
  { value: "Bolsa", label: "Bolsa" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "L", label: "Litro (L)" },
  { value: "g", label: "Gramo (g)" },
  { value: "kg", label: "Kilogramo (kg)" },
  { value: "Dosis", label: "Dosis" },
  { value: "Otro", label: "Otro" },
] as const;
export type UnidadMedidaInventarioValue = typeof unidadesDeMedidaInventarioOpciones[number]['value'];

export const tiposDeMovimientoInventarioOpciones = [
  { value: "Entrada Compra", label: "Entrada por Compra" },
  { value: "Salida Venta", label: "Salida por Venta" },
  { value: "Salida Venta Online", label: "Salida por Venta Online" },
  { value: "Salida Uso Interno", label: "Salida por Uso Interno" },
  { value: "Ajuste Positivo", label: "Ajuste Positivo de Stock" },
  { value: "Ajuste Negativo", label: "Ajuste Negativo de Stock (Pérdida/Rotura)" },
  { value: "Devolución Cliente", label: "Devolución de Cliente" },
  { value: "Devolución Proveedor", label: "Devolución a Proveedor" },
  { value: "Transferencia", label: "Transferencia entre Almacenes" },
] as const;
export type TipoMovimientoInventarioValue = typeof tiposDeMovimientoInventarioOpciones[number]['value'];

export const impuestoItemOpciones = [
  { value: "0", label: "0% (Exento)" },
  { value: "3", label: "3% (IGIC Reducido)" },
  { value: "7", label: "7% (IGIC General)" },
] as const;
export type ImpuestoItemValue = typeof impuestoItemOpciones[number]['value'];

// -----------------------------------------------------------------------------
// Tipos para Entidades del Inventario (Datos de la BD)
// -----------------------------------------------------------------------------

export type ImagenProducto = {
  url: string;
  order: number;
  isPrimary: boolean;
};

// Representa la tabla `productos_catalogo`
export type ProductoCatalogo = {
  id: string; // UUID
  nombre: string;
  tipo: 'simple' | 'variable';
  descripcion_publica: string | null;
  imagenes: ImagenProducto[] | null;
  categorias_tienda: { nombre: string }[] | null;
  en_tienda: boolean;
  destacado: boolean;
  requiere_lote: boolean;
  porcentaje_impuesto: number; // <-- CORRECCIÓN: Propiedad añadida
};

// Representa una fila de la nueva tabla `producto_variantes`
export type ProductoVariante = {
  id: string; // UUID
  producto_id: string; // UUID
  sku: string | null;
  precio_venta: number | null;
  stock_actual: number; // Para productos sin lote
  atributos: Record<string, any> | null; // JSONB
  imagen_url: string | null;
  created_at: string;
  updated_at: string | null;
};

// Tipo para un lote, ahora enlazado a una variante
export type LoteDeProducto = {
  id: string; 
  variante_id: string; // Clave foránea a producto_variantes.id
  numero_lote: string;
  stock_lote: number;
  fecha_caducidad: string | null;
  fecha_entrada: string;
  esta_activo: boolean;
};

// Tipo para un movimiento, también enlazado a una variante
export type MovimientoInventario = {
  id: string;
  variante_id: string | null; // Clave foránea a producto_variantes.id
  producto_id: string; // Mantenemos el ID del producto padre por si es necesario
  tipo_movimiento: TipoMovimientoInventarioValue;
  cantidad: number; 
  fecha_movimiento: string;
  cita_id: string | null;
  notas: string | null;
};

// Tipo combinado para la VISTA `productos_inventario_con_stock`
// Este será el tipo principal que usarás en la tienda y listados de inventario.
export type ProductoConStock = {
    id: string; // ID de la variante
    producto_padre_id: string;
    nombre: string; // Nombre combinado (ej: "Camiseta - Azul, M")
    descripcion: string | null;
    codigo_producto: string | null; // SKU de la variante
    precio_venta: number | null;
    porcentaje_impuesto: number;
    requiere_lote: boolean;
    en_tienda: boolean;
    destacado: boolean;
    imagen_principal: string | null;
    imagenes: ImagenProducto[] | null; // Imágenes del producto padre
    categorias_tienda: { nombre: string }[] | null;
    stock_total_actual: number;
    proxima_fecha_caducidad: string | null;
};


// -----------------------------------------------------------------------------
// Tipos para Formularios del Inventario
// -----------------------------------------------------------------------------

export type ProductoCatalogoFormData = {
  nombre: string;
  tipo: 'simple' | 'variable';
  descripcion: string;
  codigo_producto: string;
  unidad: UnidadMedidaInventarioValue | ''; 
  stock_minimo: string; 
  precio_compra: string;
  precio_venta: string;
  porcentaje_impuesto: ImpuestoItemValue | string; 
  requiere_lote: boolean; 
  notas_internas: string;
  stock_no_lote_valor?: string;
  en_tienda: boolean;
  destacado: boolean;
  descripcion_publica: string;
  imagenes: ImagenProducto[];
  categorias_tienda: { nombre: string }[];
};