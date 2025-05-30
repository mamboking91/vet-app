// app/dashboard/facturacion/types.ts

// Opciones y tipo para el ESTADO de la factura
export const estadosFacturaPagoOpciones = [
    "Borrador", "Pendiente", "Pagada Parcialmente", "Pagada", "Vencida", "Anulada"
  ] as const;
  export type EstadoFacturaPagoValue = typeof estadosFacturaPagoOpciones[number];
  
  // Opciones y tipo para el PORCENTAJE DE IMPUESTO por ítem
  export const impuestoItemOpciones = [
    { value: "0", label: "0% (Exento)" },
    { value: "3", label: "3% (IGIC Reducido)" },
    { value: "7", label: "7% (IGIC General)" },
  ] as const;
  export type ImpuestoItemValue = typeof impuestoItemOpciones[number]['value'];
  
  
  // Para mostrar una FACTURA en la tabla de listado principal
  export type FacturaParaTabla = {
    id: string;
    numero_factura: string;
    fecha_emision: string; // String ISO de la BD
    fecha_vencimiento: string | null;
    total: number;
    estado: EstadoFacturaPagoValue;
    propietarios: { 
      id: string;
      nombre_completo: string | null;
    } | null;
  };
  
  // Para la Factura tal como la devuelve Supabase en la consulta de LISTADO
  // (con 'propietarios' como array, que luego procesamos)
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
  
  
  // Para un ÍTEM DE FACTURA cuando se OBTIENE DE LA BD (ej. para detalle de factura)
  export type ItemFacturaFromDB = {
    id: string;
    factura_id: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number; // Precio base (sin impuestos)
    base_imponible_item: number;
    porcentaje_impuesto_item: number; // Ya es un número desde la BD
    monto_impuesto_item: number;
    total_item: number;
    procedimiento_id?: string | null;
    producto_inventario_id?: string | null;
    lote_id?: string | null;
  };
  
  // Para la CABECERA DE LA FACTURA cuando se OBTIENE DE LA BD (ej. para detalle de factura)
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
  
  // Para un PAGO cuando se OBTIENE DE LA BD
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
  
  // Para un ÍTEM individual en el ESTADO DEL FORMULARIO de factura
  export type FacturaItemFormData = {
    id_temporal: string; 
    descripcion: string;
    cantidad: string; // String, Zod lo coercerá a número
    precio_unitario: string; // String, Zod lo coercerá a número
    porcentaje_impuesto_item: ImpuestoItemValue | string; // String (ej. "7"), Zod lo validará y transformará
  };
  
  // Para los datos de la CABECERA DEL FORMULARIO de factura
  export type FacturaHeaderFormData = {
    propietario_id: string;
    paciente_id?: string; 
    numero_factura: string;
    fecha_emision: string; // Formato YYYY-MM-DD (del DatePicker o input)
    fecha_vencimiento?: string; // Formato YYYY-MM-DD
    estado: EstadoFacturaPagoValue;
    notas_cliente?: string;
    notas_internas?: string;
  };
  
  // Para un ÍTEM en el PAYLOAD que se envía a la Server Action
  // Aquí los campos que son números en la BD pero strings en el form siguen siendo strings
  export type ItemParaPayload = {
    descripcion: string;
    cantidad: string; 
    precio_unitario: string; 
    porcentaje_impuesto_item: string; // Se envía como string (ej. "0", "3", "7")
  };
  
  // Tipo completo para el PAYLOAD que el formulario envía a las Server Actions
  export type NuevaFacturaPayload = FacturaHeaderFormData & {
    items: ItemParaPayload[];
  };
  
  // Tipo genérico para selectores (Propietarios, Pacientes)
  export type EntidadParaSelector = {
    id: string;
    nombre: string; 
  };