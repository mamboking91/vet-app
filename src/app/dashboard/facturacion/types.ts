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
  
  type PropietarioInfoAnidadoFactura = {
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
    propietarios: any; // <--- CAMBIO TEMPORAL A 'any' PARA DEPURAR LA ASERCIÓN
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
  
  // ... (resto de tus tipos como estaban en facturacion_types_v4_fix_propid) ...
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
  };
  type PropietarioInfoDetalle = { id: string; nombre_completo: string | null; };
  type PacienteInfoDetalle = { id: string; nombre: string | null; };
  export type FacturaHeaderFromDB = {
    id: string;
    numero_factura: string;
    fecha_emision: string;
    fecha_vencimiento: string | null;
    propietario_id: string; 
    paciente_id: string | null;  
    subtotal: number; 
    monto_impuesto: number; 
    total: number;
    estado: EstadoFacturaPagoValue;
    notas_cliente: string | null;
    notas_internas: string | null;
    desglose_impuestos: { [tasaKey: string]: { base: number; impuesto: number; }; } | null;
    propietarios: PropietarioInfoDetalle | null;
    pacientes: PacienteInfoDetalle | null;
    created_at: string;
    updated_at: string | null;
  };
  export type PagoFacturaFromDB = { id: string; factura_id: string; fecha_pago: string; monto_pagado: number; metodo_pago: string | null; referencia_pago: string | null; notas: string | null; };
  export type EntidadParaSelector = { id: string; nombre: string; };
  export type ProcedimientoParaFactura = EntidadParaSelector & { precio: number; porcentaje_impuesto: number; };
  export type ProductoInventarioParaFactura = EntidadParaSelector & { precio_venta: number | null; porcentaje_impuesto: number; requiere_lote: boolean; };
  export type FacturaItemFormData = { id_temporal: string; descripcion: string; cantidad: string; precio_unitario: string; porcentaje_impuesto_item: ImpuestoItemValue | string; tipo_origen_item?: 'manual' | 'procedimiento' | 'producto'; procedimiento_id?: string | null; producto_inventario_id?: string | null; lote_id?: string | null; };
  export type FacturaHeaderFormData = { propietario_id: string; paciente_id?: string; numero_factura: string; fecha_emision: string; fecha_vencimiento?: string; estado: EstadoFacturaPagoValue; notas_cliente?: string; notas_internas?: string; };
  export type ItemParaPayload = { descripcion: string; cantidad: string; precio_unitario: string; porcentaje_impuesto_item: string; procedimiento_id?: string | null; producto_inventario_id?: string | null; lote_id?: string | null; };
  export type NuevaFacturaPayload = FacturaHeaderFormData & { items: ItemParaPayload[]; };
  