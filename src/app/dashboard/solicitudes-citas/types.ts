// El tipo ENUM para el estado, debe coincidir con el que creamos en la base de datos
export const estadosSolicitud = ['pendiente', 'contactado', 'cancelada', 'completada'] as const;
export type EstadoSolicitud = typeof estadosSolicitud[number];

// El tipo que representa una solicitud de la base de datos
export type SolicitudCitaPublica = {
  id: string;
  created_at: string;
  nombre_cliente: string;
  email: string;
  telefono: string;
  nombre_mascota: string;
  descripcion_mascota: string | null;
  motivo_cita: string;
  estado: EstadoSolicitud;
  notas_admin: string | null;
  propietario_id?: string | null;
  paciente_id?: string | null;
  fecha_preferida?: string | null;
  franja_horaria?: string | null;
};