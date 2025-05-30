// app/dashboard/facturacion/types.ts

// -----------------------------------------------------------------------------
// Constantes y Tipos para Opciones de Selects (Usados en Formularios y Zod)
// -----------------------------------------------------------------------------

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
  
  
  // -----------------------------------------------------------------------------
  // Tipos para Entidades y Datos de la Base de Datos (Leídos)
  // -----------------------------------------------------------------------------
  
  // Tipo para el objeto Propietario individual tal como viene anidado en las consultas
  type PropietarioInfoAnidado = {
    id: string;
    nombre_completo: string | null;
  };
  
  // Tipo para la Factura tal como la devuelve Supabase en la consulta de LISTADO
  // donde 'propietarios' puede ser un array debido al select anidado.
  export type FacturaCrudaDesdeSupabase = {
    id: string;
    numero_factura: string;
    fecha_emision: string; // String ISO
    fecha_vencimiento: string | null; // String ISO
    total: number;
    estado: EstadoFacturaPagoValue;
    propietarios: PropietarioInfoAnidado[] | null; // Supabase puede devolver esto como array
  };
  
  // Tipo para mostrar una FACTURA en la TABLA DE LISTADO (después de procesar FacturaCrudaDesdeSupabase)
  export type FacturaParaTabla = {
    id: string;
    numero_factura: string;
    fecha_emision: string;
    fecha_vencimiento: string | null;
    total: number;
    estado: EstadoFacturaPagoValue;
    propietarios: PropietarioInfoAnidado | null; // Aquí ya es un objeto o null
  };
  
  // Tipo para un ÍTEM DE FACTURA cuando se OBTIENE DE LA BD (ej. para detalle de factura)
  export type ItemFacturaFromDB = {
    id: string;
    factura_id: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number; // Precio base (sin impuestos)
    base_imponible_item: number;
    porcentaje_impuesto_item: number;
    monto_impuesto_item: number;
    total_item: number;
    procedimiento_id?: string | null;
    producto_inventario_id?: string | null;
    lote_id?: string | null;
    // created_at: string;
  };
  
  // Tipo para la CABECERA DE LA FACTURA cuando se OBTIENE DE LA BD (ej. para detalle de factura)
  // Aquí también asumimos que las relaciones anidadas 'propietarios' y 'pacientes'
  // podrían venir como arrays si se seleccionan de forma similar, o como objetos si la relación es directa.
  // Para el detalle, es más común que sean objetos si haces .single() y el select es directo.
  // Vamos a mantenerlos como objetos o null para el tipo de detalle procesado.
  type PropietarioInfoDetalle = { id: string; nombre_completo: string | null; };
  type PacienteInfoDetalle = { id: string; nombre: string | null; };
  
  export type FacturaHeaderFromDB = {
    id: string;
    numero_factura: string;
    fecha_emision: string; // String ISO
    fecha_vencimiento: string | null; // String ISO
    propietario_id: string; 
    paciente_id: string | null;  
    subtotal: number; 
    monto_impuesto: number; 
    total: number;
    estado: EstadoFacturaPagoValue;
    notas_cliente: string | null;
    notas_internas: string | null;
    desglose_impuestos: { 
      [tasaKey: string]: { 
        base: number;
        impuesto: number;
      };
    } | null;
    propietarios: PropietarioInfoDetalle | null; // Objeto o null
    pacientes: PacienteInfoDetalle | null;   // Objeto o null
    created_at: string;
    updated_at: string | null;
  };
  
  // Tipo para un PAGO cuando se OBTIENE DE LA BD
  export type PagoFacturaFromDB = {
      id: string;
      factura_id: string;
      fecha_pago: string; // String ISO
      monto_pagado: number;
      metodo_pago: string | null;
      referencia_pago: string | null;
      notas: string | null;
  };
  
  
  // -----------------------------------------------------------------------------
  // Tipos para Formularios
  // -----------------------------------------------------------------------------
  
  // Tipo para un ÍTEM individual en el ESTADO DEL FORMULARIO de factura
  export type FacturaItemFormData = {
    id_temporal: string; 
    descripcion: string;
    cantidad: string; 
    precio_unitario: string; 
    porcentaje_impuesto_item: ImpuestoItemValue | string; 
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
    porcentaje_impuesto_item: string; // Se envía como string, Zod lo convierte
  };
  
  // Tipo completo para el PAYLOAD que el formulario envía a la Server Action
  export type NuevaFacturaPayload = FacturaHeaderFormData & {
    items: ItemParaPayload[];
    // No incluye porcentaje_impuesto_predeterminado si lo eliminamos del form
  };
  
  
  // Tipo genérico para selectores (Propietarios, Pacientes)
  export type EntidadParaSelector = {
    id: string;
    nombre: string; // nombre_completo para propietario, nombre_display para paciente
  };