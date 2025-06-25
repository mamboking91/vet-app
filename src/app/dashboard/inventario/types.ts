// app/dashboard/inventario/types.ts

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
  // Usados en el formulario de MovimientoStockForm
  { value: "Salida Venta", label: "Salida por Venta" },
  { value: "Salida Venta Online", label: "Salida por Venta Online" },
  { value: "Salida Uso Interno", label: "Salida por Uso Interno" },
  { value: "Ajuste Positivo", label: "Ajuste Positivo de Stock" },
  { value: "Ajuste Negativo", label: "Ajuste Negativo de Stock (Pérdida/Rotura)" },
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

export type ProductoConStock = {
  id: string;
  nombre: string;
  descripcion: string | null;
  codigo_producto: string | null;
  unidad: UnidadMedidaInventarioValue | null;
  stock_minimo: number | null;
  precio_venta: number | null;
  porcentaje_impuesto: number;
  requiere_lote: boolean;
  stock_total_actual: number; 
  proxima_fecha_caducidad: string | null;
  en_tienda?: boolean;
};

export type ProductoCatalogo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  codigo_producto: string | null;
  unidad: UnidadMedidaInventarioValue | null;
  stock_minimo: number | null;
  precio_compra: number | null; 
  precio_venta: number | null;
  porcentaje_impuesto: number;
  requiere_lote: boolean;
  notas_internas: string | null;
  en_tienda: boolean;
  destacado: boolean;
  descripcion_publica: string | null;
  imagenes: ImagenProducto[] | null; // Usamos el nuevo tipo
  categorias_tienda: { nombre: string }[] | null;
  created_at?: string;
  updated_at?: string | null;
  stock_disponible?: number | null;
};

export type LoteDeProducto = {
  id: string; 
  producto_id: string; 
  numero_lote: string;
  stock_lote: number;
  fecha_caducidad: string | null;
  fecha_entrada: string;
  esta_activo: boolean;
};

export type MovimientoInventario = {
  id: string;
  lote_id: string;
  producto_id: string;
  tipo_movimiento: TipoMovimientoInventarioValue;
  cantidad: number; 
  fecha_movimiento: string;
  cita_id: string | null;
  notas: string | null;
};

// -----------------------------------------------------------------------------
// Tipos para Formularios del Inventario
// -----------------------------------------------------------------------------

export type ProductoCatalogoFormData = {
  nombre: string;
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
  imagenes: ImagenProducto[]; // Usamos el nuevo tipo
  categorias_tienda: { nombre: string }[];
};

export type EntradaLoteFormData = {
  numero_lote: string;
  stock_lote: string;
  fecha_entrada: string;
  fecha_caducidad: string;
};

export type MovimientoStockFormData = {
  tipo_movimiento: TipoMovimientoInventarioValue | '';
  cantidad: string; 
  notas: string;
};

export type AddStockNoLoteFormData = {
  stock_entrada: string;
  fecha_entrada: string;
};
