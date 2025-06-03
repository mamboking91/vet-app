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
  { value: "Salida Uso Interno", label: "Salida por Uso Interno" },
  { value: "Ajuste Positivo", label: "Ajuste Positivo de Stock" },
  { value: "Ajuste Negativo", label: "Ajuste Negativo de Stock (Pérdida/Rotura)" },
  // Otros tipos que podrían ser usados por el sistema o formularios específicos
  // { value: "Entrada Compra", label: "Entrada por Compra" }, 
  // { value: "Devolución Cliente", label: "Devolución de Cliente" },
  // { value: "Devolución Proveedor", label: "Devolución a Proveedor" },
  // { value: "Transferencia", label: "Transferencia" },
] as const;
export type TipoMovimientoInventarioValue = typeof tiposDeMovimientoInventarioOpciones[number]['value'];

// Opciones de IGIC (idealmente desde un archivo global, o copiadas aquí)
export const impuestoItemOpciones = [
{ value: "0", label: "0% (Exento)" },
{ value: "3", label: "3% (IGIC Reducido)" },
{ value: "7", label: "7% (IGIC General)" },
] as const;
export type ImpuestoItemValue = typeof impuestoItemOpciones[number]['value'];


// -----------------------------------------------------------------------------
// Tipos para Entidades del Inventario (Datos de la BD)
// -----------------------------------------------------------------------------

export type ProductoConStock = { // Para la VISTA productos_inventario_con_stock
id: string;
nombre: string;
descripcion: string | null;
codigo_producto: string | null;
unidad: UnidadMedidaInventarioValue | null;
stock_minimo: number | null;
precio_venta: number | null; // PRECIO BASE DE VENTA (sin impuestos)
porcentaje_impuesto: number; // Porcentaje como número (0, 3, 7)
requiere_lote: boolean;
stock_total_actual: number; 
proxima_fecha_caducidad: string | null; // String ISO de la fecha
// created_at?: string; 
// notas_internas?: string | null; 
};

export type ProductoCatalogo = { // Para la tabla productos_inventario
id: string;
nombre: string;
descripcion: string | null;
codigo_producto: string | null;
unidad: UnidadMedidaInventarioValue | null;
stock_minimo: number | null;
precio_compra: number | null; 
precio_venta: number | null; // PRECIO BASE DE VENTA (sin impuestos)
porcentaje_impuesto: number; // Porcentaje como número (0, 3, 7)
requiere_lote: boolean;
notas_internas: string | null;
created_at?: string; // Opcional si no siempre se selecciona
updated_at?: string | null; // Opcional si no siempre se selecciona
};

export type LoteDeProducto = { // Para la tabla lotes_producto
id: string; 
producto_id: string; 
numero_lote: string;
stock_lote: number;
fecha_caducidad: string | null; // String ISO de la fecha
fecha_entrada: string; // String ISO de la fecha
esta_activo: boolean;
// created_at?: string;
// updated_at?: string | null;
};

export type MovimientoInventario = { // Para la tabla movimientos_inventario
  id: string;
  lote_id: string;
  producto_id: string;
  tipo_movimiento: TipoMovimientoInventarioValue;
  cantidad: number; 
  fecha_movimiento: string; // String ISO
  cita_id: string | null;
  notas: string | null;
  // created_at?: string;
};

// -----------------------------------------------------------------------------
// Tipos para Formularios del Inventario
// -----------------------------------------------------------------------------

export type ProductoCatalogoFormData = { // Para ProductoCatalogoForm
nombre: string;
descripcion: string;
codigo_producto: string;
unidad: UnidadMedidaInventarioValue | ''; 
stock_minimo: string; 
precio_compra: string;
precio_venta: string; // PRECIO BASE DE VENTA (sin impuestos)
porcentaje_impuesto: ImpuestoItemValue | string; 
requiere_lote: boolean; 
notas_internas: string;
stock_no_lote_valor?: string; // Para stock inicial/actual si no usa lotes
};

export type EntradaLoteFormData = { // Para EntradaLoteForm y AñadirStockForm (parte de lotes)
numero_lote: string;
stock_lote: string; // Cantidad que entra
fecha_entrada: string; // Formato YYYY-MM-DD
fecha_caducidad: string; // Formato YYYY-MM-DD o ""
};

export type MovimientoStockFormData = { // Para MovimientoStockForm
  tipo_movimiento: TipoMovimientoInventarioValue | '';
  cantidad: string; 
  notas: string;
};

// Para AñadirStockForm cuando el producto NO requiere lotes
export type AddStockNoLoteFormData = {
  stock_entrada: string; // Cantidad que entra
  fecha_entrada: string; // Formato YYYY-MM-DD
  // numero_lote y fecha_caducidad no son necesarios para el usuario aquí
};