// app/dashboard/inventario/types.ts
export const unidadesDeMedidaInventarioOpciones = [
    // Valores de tu ENUM unidad_medida_inventario
    { value: "Unidad", label: "Unidad" },
    { value: "Caja", label: "Caja" },
    { value: "Blister", label: "Blister" },
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
  
  // Tipo para los datos del formulario del catálogo de productos
  export type ProductoCatalogoFormData = {
    nombre: string;
    descripcion: string;
    codigo_producto: string;
    unidad: string; // Debería ser UnidadMedidaInventarioValue o string vacío
    stock_minimo: string;
    precio_compra: string;
    precio_venta: string;
    requiere_lote: boolean;
    notas_internas: string;
  };