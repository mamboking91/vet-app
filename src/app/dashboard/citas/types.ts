import { Stethoscope, Pill, FileText } from "lucide-react"

// -----------------------------------------------------------------------------
// Constantes y Tipos para Opciones de Selects (Formularios y Zod)
// -----------------------------------------------------------------------------

export const tiposDeCitaOpciones = [
  { value: "Consulta General", label: "Consulta General", icon: Stethoscope },
  { value: "Vacunación", label: "Vacunación", icon: Pill },
  { value: "Desparasitación", label: "Desparasitación", icon: Pill },
  { value: "Revisión", label: "Revisión", icon: Stethoscope },
  { value: "Cirugía Programada", label: "Cirugía Programada", icon: Stethoscope },
  { value: "Urgencia", label: "Urgencia", icon: Stethoscope },
  { value: "Peluquería", label: "Peluquería", icon: FileText },
  { value: "Otro", label: "Otro", icon: FileText },
] as const
export type TipoCitaValue = (typeof tiposDeCitaOpciones)[number]["value"]

export const estadosDeCitaOpciones = [
  "Pendiente de Confirmación", 
  "Programada",
  "Confirmada",
  "Cancelada por Clínica",
  "Cancelada por Cliente",
  "Completada",
  "No Asistió",
  "Reprogramada",
] as const
export type EstadoCitaValue = (typeof estadosDeCitaOpciones)[number]

// -----------------------------------------------------------------------------
// Tipos para Selectores y Transferencia de Datos (DTOs)
// -----------------------------------------------------------------------------

/**
 * Representa a un paciente con la información esencial de su propietario.
 * Es ideal para pasar como prop a los formularios.
 */
export type PacienteConPropietario = {
  paciente_id: string
  paciente_nombre: string
  propietario_id: string
  propietario_nombre: string
}

/**
 * Tipo específico para el selector de pacientes en formularios.
 * Contiene la información formateada para mostrar en el dropdown.
 */
export type PacienteParaSelector = {
  id: string
  nombre_display: string
}

// -----------------------------------------------------------------------------
// Tipos para Datos de Citas (Representando la estructura de la BD)
// -----------------------------------------------------------------------------

/**
 * Representa la estructura de un propietario cuando se obtiene de forma anidada.
 */
type PropietarioInfoAnidado = {
  id: string
  nombre_completo: string | null
}

/**
 * Representa un paciente con su propietario anidado, tal como lo devuelve Supabase
 * con una consulta como .select('*, propietarios(*)').
 */
type PacienteInfoConPropietarioAnidado = {
  id: string
  nombre: string
  propietarios: PropietarioInfoAnidado | null
}

/**
 * Tipo para la CITA tal como la devuelve Supabase con el paciente y propietario anidados.
 */
export type CitaConDetallesAnidados = {
  id: string
  fecha_hora_inicio: string
  fecha_hora_fin: string | null
  duracion_estimada_minutos: number | null
  motivo: string | null
  tipo: TipoCitaValue | null
  estado: EstadoCitaValue
  pacientes: PacienteInfoConPropietarioAnidado | null
}

// Alias para compatibilidad con componentes existentes
export type CitaConDetalles = CitaConDetallesAnidados

// -----------------------------------------------------------------------------
// Tipos para Formularios y Registros de BD individuales
// -----------------------------------------------------------------------------

/**
 * Define la estructura de datos que maneja el CitaForm internamente.
 * Todos los campos son strings porque los inputs HTML trabajan con strings.
 */
export type CitaFormData = {
  paciente_id: string
  fecha_hora_inicio: string // Formato esperado por <input type="datetime-local">: "YYYY-MM-DDTHH:mm"
  duracion_estimada_minutos: string
  motivo: string
  tipo: string
  estado: string
  notas_cita: string
}

/**
 * Representa un registro de Cita tal como viene de la tabla en la BD.
 * Es útil para la edición de una cita existente.
 */
export type CitaDBRecord = {
  id: string
  paciente_id: string
  fecha_hora_inicio: string // String ISO de Supabase
  fecha_hora_fin: string | null // String ISO de Supabase
  duracion_estimada_minutos: number | null
  motivo: string | null
  tipo: TipoCitaValue | null
  estado: EstadoCitaValue
  notas_cita: string | null
  veterinario_asignado_id: string | null
  created_at: string
  updated_at: string | null
}

// -----------------------------------------------------------------------------
// Tipos para la Vista de Calendario Mensual Personalizada
// -----------------------------------------------------------------------------

export type DayInMonth = {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  dayNumber: number
  citasDelDia: CitaConDetallesAnidados[] // El calendario puede usar directamente el tipo anidado
}

export type WeekInMonth = DayInMonth[]

