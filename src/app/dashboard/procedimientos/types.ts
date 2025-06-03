// app/dashboard/procedimientos/types.ts

// Opciones de impuesto (pueden ser compartidas globalmente o específicas del módulo)
export const impuestoItemOpciones = [
    { value: "0", label: "0% (Exento)" },
    { value: "3", label: "3% (IGIC Reducido)" },
    { value: "7", label: "7% (IGIC General)" },
  ] as const;
  export type ImpuestoItemValue = typeof impuestoItemOpciones[number]['value']; // "0" | "3" | "7"
  
  // Tipo para un Procedimiento como viene de la BD y se usa en la tabla
  export type Procedimiento = {
    id: string;
    nombre: string;
    descripcion: string | null;
    duracion_estimada_minutos: number | null;
    precio: number; // Este es el Precio BASE (sin impuestos)
    categoria: string | null; // El ENUM 'categoria_procedimiento' se leerá como string
    porcentaje_impuesto: number; // Porcentaje como número (0, 3, 7)
    notas_internas: string | null;
    // created_at?: string;
    // updated_at?: string;
  };
  
  // Tipo para el formulario de Procedimientos
  // Campos numéricos y de fecha son strings debido a los inputs.
  export type ProcedimientoFormData = {
    nombre: string;
    descripcion: string;
    duracion_estimada_minutos: string;
    precio: string; // Precio BASE (sin impuestos)
    categoria: string; // El Select maneja string
    porcentaje_impuesto: ImpuestoItemValue | string; // El Select usará "0", "3", "7"
    notas_internas: string;
  };