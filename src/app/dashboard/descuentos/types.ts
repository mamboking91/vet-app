// src/app/dashboard/descuentos/types.ts

// Define la estructura de un código de descuento, tal como viene de la base de datos.
export interface CodigoDescuento {
    id: string;
    created_at: string;
    codigo: string;
    tipo_descuento: 'porcentaje' | 'fijo';
    valor: number;
    fecha_expiracion: string | null;
    usos_maximos: number | null;
    usos_actuales: number;
    compra_minima: number;
    activo: boolean;
  }
  