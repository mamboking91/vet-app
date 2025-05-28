// app/dashboard/inventario/types.ts

// -----------------------------------------------------------------------------
// Constantes y Tipos para Opciones de Selects (Formularios y Zod)
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
    // Tipos de movimiento que el usuario podría seleccionar en un formulario de ajuste/salida
    { value: "Salida Venta", label: "Salida por Venta" },
    { value: "Salida Uso Interno", label: "Salida por Uso Interno" },
    { value: "Ajuste Positivo", label: "Ajuste Positivo de Stock" },
    { value: "Ajuste Negativo", label: "Ajuste Negativo de Stock (Pérdida/Rotura)" },
    // Los siguientes son más informativos y podrían ser usados por el sistema internamente
    // o en formularios más específicos.
    // { value: "Entrada Compra", label: "Entrada por Compra" }, 
    // { value: "Devolución Cliente", label: "Devolución de Cliente" },
    // { value: "Devolución Proveedor", label: "Devolución a Proveedor" },
    // { value: "Transferencia", label: "Transferencia" },
  ] as const;
  export type TipoMovimientoInventarioValue = typeof tiposDeMovimientoInventarioOpciones[number]['value'];
  
  
  // -----------------------------------------------------------------------------
  // Tipos para Entidades del Inventario
  // -----------------------------------------------------------------------------
  
  // Para los datos de la VISTA productos_inventario_con_stock (usado en la lista principal)
  export type ProductoConStock = {
    id: string;
    nombre: string;
    descripcion: string | null;
    codigo_producto: string | null;
    unidad: UnidadMedidaInventarioValue | null;
    stock_minimo: number | null;
    precio_venta: number | null;
    requiere_lote: boolean;
    stock_total_actual: number; // Calculado por la vista
    proxima_fecha_caducidad: string | null; // String ISO de la fecha
    // created_at?: string; // Descomenta si lo necesitas y seleccionas
    // notas_internas?: string | null; // Descomenta si lo necesitas y seleccionas
  };
  
  // Para los datos base de un producto del catálogo (tabla productos_inventario)
  // Usado al obtener un producto para editar su información de catálogo.
  export type ProductoCatalogo = {
    id: string;
    nombre: string;
    descripcion: string | null;
    codigo_producto: string | null;
    unidad: UnidadMedidaInventarioValue | null;
    stock_minimo: number | null;
    precio_compra: number | null; 
    precio_venta: number | null;
    requiere_lote: boolean;
    notas_internas: string | null;
    // proveedor_id?: string | null; // Si añades la relación con proveedores
    // categoria_producto_id?: string | null; // Si añades categorías de producto
    // created_at: string;
    // updated_at: string | null;
  };
  
  // Para un lote individual de producto (tabla lotes_producto)
  export type LoteDeProducto = {
    id: string; // ID del lote
    producto_id: string; // ID del producto al que pertenece
    numero_lote: string;
    stock_lote: number;
    fecha_caducidad: string | null; // String ISO de la fecha
    fecha_entrada: string; // String ISO de la fecha
    // precio_compra_lote?: number | null; // Si el precio de compra es por lote
    // created_at: string;
    // updated_at: string | null;
  };
  
  // Para un movimiento de inventario individual (tabla movimientos_inventario)
  export type MovimientoInventario = {
      id: string;
      lote_id: string;
      producto_id: string;
      tipo_movimiento: TipoMovimientoInventarioValue; // Debería ser el tipo ENUM de la BD
      cantidad: number; 
      fecha_movimiento: string; // String ISO
      cita_id: string | null;
      // factura_id: string | null;
      // usuario_id: string | null;
      notas: string | null;
      // created_at: string;
  };
  
  
  // -----------------------------------------------------------------------------
  // Tipos para Formularios del Inventario
  // -----------------------------------------------------------------------------
  
  // Para el formulario de ProductoCatalogoForm (añadir/editar catálogo)
  // Campos como strings porque así los manejan los inputs HTML
  export type ProductoCatalogoFormData = {
    nombre: string;
    descripcion: string;
    codigo_producto: string;
    unidad: UnidadMedidaInventarioValue | ''; // El Select puede tener un valor vacío
    stock_minimo: string; // Input type="number" devuelve string
    precio_compra: string;
    precio_venta: string;
    requiere_lote: boolean; // Checkbox
    notas_internas: string;
  };
  
  // Para el formulario de EntradaLoteForm
  export type EntradaLoteFormData = {
    numero_lote: string;
    stock_lote: string; // Cantidad que entra, input number devuelve string
    fecha_entrada: string; // Input date devuelve string YYYY-MM-DD
    fecha_caducidad: string; // Input date devuelve string YYYY-MM-DD o ""
  };
  
  // Para el formulario de MovimientoStockForm (salidas, ajustes)
  export type MovimientoStockFormData = {
      tipo_movimiento: TipoMovimientoInventarioValue | '';
      cantidad: string; // Input number devuelve string
      notas: string;
  };