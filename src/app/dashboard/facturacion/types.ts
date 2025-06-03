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
  
  export type FacturaParaTabla = {
    id: string;
    numero_factura: string;
    fecha_emision: string;
    fecha_vencimiento: string | null;
    total: number;
    estado: EstadoFacturaPagoValue;
    propietarios: { 
      id: string;
      nombre_completo: string | null;
    } | null;
  };
  
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
    propietarios: PropietarioInfoAnidadoFactura[] | null;
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
    desglose_impuestos: { 
      [tasaKey: string]: { base: number; impuesto: number; };
    } | null;
    propietarios: PropietarioInfoDetalle | null;
    pacientes: PacienteInfoDetalle | null;
    created_at: string;
    updated_at: string | null;
  };
  
  export type PagoFacturaFromDB = {
      id: string;
      factura_id: string;
      fecha_pago: string;
      monto_pagado: number;
      metodo_pago: string | null;
      referencia_pago: string | null;
      notas: string | null;
  };
  
  // --- Tipos para Formularios ---
  
  // Para el selector de propietarios y pacientes
  export type EntidadParaSelector = {
    id: string;
    nombre: string; 
  };
  
  // --- NUEVOS TIPOS PARA SELECCIONAR PROCEDIMIENTOS Y PRODUCTOS EN FACTURA ---
  export type ProcedimientoParaFactura = EntidadParaSelector & {
    precio: number; // Precio base del procedimiento
    porcentaje_impuesto: number; // % de impuesto del procedimiento
  };
  
  export type ProductoInventarioParaFactura = EntidadParaSelector & {
    precio_venta: number | null; // Precio base de venta del producto
    porcentaje_impuesto: number; // % de impuesto del producto
    requiere_lote: boolean;
  };
  
  // Tipo para un ÍTEM individual en el ESTADO DEL FORMULARIO de factura
  export type FacturaItemFormData = {
    id_temporal: string; 
    descripcion: string;
    cantidad: string; 
    precio_unitario: string; // Precio base (sin impuestos)
    porcentaje_impuesto_item: ImpuestoItemValue | string; // ej. "7" para 7%
    
    // Campos para vincular con catálogos
    tipo_origen_item?: 'manual' | 'procedimiento' | 'producto';
    procedimiento_id?: string | null;
    producto_inventario_id?: string | null;
    lote_id?: string | null; // Para cuando se seleccione un producto que requiere lote
  };
  
  // Tipo para los datos de la CABECERA DEL FORMULARIO de factura
  export type FacturaHeaderFormData = {
    propietario_id: string;
    paciente_id?: string; 
    numero_factura: string;
    fecha_emision: string; // Formato YYYY-MM-DD
    fecha_vencimiento?: string; // Formato YYYY-MM-DD
    estado: EstadoFacturaPagoValue;
    notas_cliente?: string;
    notas_internas?: string;
  };
  
  // Tipo para un ÍTEM en el PAYLOAD que se envía a la Server Action
  export type ItemParaPayload = {
    descripcion: string;
    cantidad: string; 
    precio_unitario: string; 
    porcentaje_impuesto_item: string; // Se envía como string (ej. "0", "3", "7")
    procedimiento_id?: string | null;
    producto_inventario_id?: string | null;
    lote_id?: string | null;
  };
  
  // Tipo completo para el PAYLOAD que el formulario envía a las Server Actions
  export type NuevaFacturaPayload = FacturaHeaderFormData & {
    items: ItemParaPayload[];
  };