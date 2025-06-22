// Define los posibles estados de un pedido para usarlos en toda la aplicación
export const ESTADOS_PEDIDO = [
    'procesando',
    'pendiente_pago',
    'enviado',
    'completado',
    'cancelado',
  ] as const;
  
  export type EstadoPedido = typeof ESTADOS_PEDIDO[number];
  
  // CORRECCIÓN: Se añade 'nombre_completo' y se hacen opcionales los campos antiguos
  // para mantener la coherencia con el formulario de checkout.
  export type DireccionEnvio = {
    nombre_completo?: string;
    nombre?: string;
    apellidos?: string;
    direccion: string;
    localidad: string;
    provincia: string;
    codigo_postal: string;
    telefono?: string;
  };
  
  // Tipo que representa un pedido en la base de datos
  export type Pedido = {
    id: string;
    created_at: string;
    estado: EstadoPedido;
    total: number;
    propietario_id: string | null; // Puede ser null para invitados
    email_cliente: string;
    direccion_envio: DireccionEnvio;
    factura_id: string | null; // Enlace a la factura generada
  };
  
  // Tipo extendido para mostrar en la tabla de pedidos, incluyendo el nombre del cliente
  export type PedidoParaTabla = Pedido & {
    // El cliente puede venir de la tabla propietarios o de los datos de envío
    nombre_cliente: string; 
  };
  