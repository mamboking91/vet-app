// app/dashboard/facturacion/types.ts

export const estadosFacturaPagoOpciones = [
    "Borrador", "Pendiente", "Pagada Parcialmente", "Pagada", "Vencida", "Anulada"
  ] as const;
  export type EstadoFacturaPagoValue = typeof estadosFacturaPagoOpciones[number];

  export const impuestoItemOpciones = [
    { value: "0", label: "0% (Exento)" },
    { value: "3", label: "3% (IGIC Reducido)" },
    { value: "7", label: "7% (IGIC General)" },
  ] as const;
  export type ImpuestoItemValue = typeof impuestoItemOpciones[number]['value'];

  export type PropietarioInfoAnidadoFactura = {
    id: string;
    nombre_completo: string | null;
  };

  export type FacturaCrudaDesdeSupabase = {
    id: string;
    numero_factura: string;
    fecha_emision: string;
    fecha_vencimiento: string | null;
    total: number;
    estado: EstadoFacturaPagoValue;
    propietario_id: string;
    propietarios: PropietarioInfoAnidadoFactura[] | null; // Coincide con el error de TS
  };

  export type FacturaParaTabla = {
    id: string;
    numero_factura: string;
    fecha_emision: string;
    fecha_vencimiento: string | null;
    total: number;
    estado: EstadoFacturaPagoValue;
    propietarios: PropietarioInfoAnidadoFactura | null;
  };

  export type ItemFacturaFromDB = {
    id: string;
    factura_id: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    base_imponible_item: number;
    porcentaje_impuesto_item: number;
    monto_impuesto_item: number;
    total_item: number;
    procedimiento_id?: string | null;
    producto_inventario_id?: string | null;
    lote_id?: string | null;
    created_at?: string;
  };

  export type PropietarioInfoDetalle = {
    id: string;
    nombre_completo: string | null;
  };

  export type PacienteInfoDetalle = {
    id: string;
    nombre: string | null;
  };

  export type FacturaHeaderFromDB = {
    id: string;
    numero_factura: string;
    fecha_emision: string;
    fecha_vencimiento: string | null;
    propietario_id: string;
    paciente_id: string | null;
    subtotal: number;
    monto_impuesto: number;
    total: number; // Total de la factura
    estado: EstadoFacturaPagoValue;
    notas_cliente: string | null;
    notas_internas: string | null;
    desglose_impuestos: { [tasaKey: string]: { base: number; impuesto: number; }; } | null;
    propietarios: PropietarioInfoDetalle | null;
    pacientes: PacienteInfoDetalle | null;
    created_at: string;
    updated_at: string | null;
  };

  // --- INICIO: NUEVOS TIPOS Y OPCIONES PARA PAGOS ---
  export const metodosDePagoOpciones = [
    { value: "Efectivo", label: "Efectivo" },
    { value: "Tarjeta", label: "Tarjeta (TPV/SumUp Manual)" },
    { value: "Transferencia", label: "Transferencia Bancaria" },
    { value: "Bizum", label: "Bizum" },
  ] as const;
  export type MetodoPagoValue = typeof metodosDePagoOpciones[number]['value'];

  export type PagoFacturaFromDB = {
    id: string;
    factura_id: string;
    fecha_pago: string; // ISO string
    monto_pagado: number;
    metodo_pago: MetodoPagoValue | string | null; // string si no usas ENUM, MetodoPagoValue si sí
    referencia_pago: string | null;
    notas: string | null;
    created_at?: string; // Es bueno tenerlo
  };

  export type PagoFormData = {
    // factura_id se pasará como argumento, no desde el form directamente
    fecha_pago: string; // Para DatePicker, formato YYYY-MM-DD
    monto_pagado: string; // Para input number
    metodo_pago: MetodoPagoValue | string; // Para Select
    referencia_pago: string; // Se usará string vacío si no se provee
    notas: string; // Se usará string vacío si no se provee
  };
  // --- FIN: NUEVOS TIPOS Y OPCIONES PARA PAGOS ---

  export type EntidadParaSelector = {
    id: string;
    nombre: string;
  };

  export type ProcedimientoParaFactura = EntidadParaSelector & {
    precio: number;
    porcentaje_impuesto: number;
  };

  export type ProductoInventarioParaFactura = EntidadParaSelector & {
    precio_venta: number | null;
    porcentaje_impuesto: number;
    requiere_lote: boolean;
  };

  export type FacturaItemFormData = {
    id_temporal: string;
    descripcion: string;
    cantidad: string;
    precio_unitario: string;
    porcentaje_impuesto_item: ImpuestoItemValue | string;
    tipo_origen_item?: 'manual' | 'procedimiento' | 'producto';
    procedimiento_id?: string | null;
    producto_inventario_id?: string | null;
    lote_id?: string | null;
  };

  export type FacturaHeaderFormData = {
    propietario_id: string;
    paciente_id?: string;
    numero_factura: string;
    fecha_emision: string;
    fecha_vencimiento?: string;
    estado: EstadoFacturaPagoValue;
    notas_cliente?: string;
    notas_internas?: string;
  };

  export type ItemParaPayload = {
    descripcion: string;
    cantidad: string;
    precio_unitario: string;
    porcentaje_impuesto_item: string;
    procedimiento_id?: string | null;
    producto_inventario_id?: string | null;
    lote_id?: string | null;
  };

  export type NuevaFacturaPayload = FacturaHeaderFormData & {
    items: ItemParaPayload[];
  };