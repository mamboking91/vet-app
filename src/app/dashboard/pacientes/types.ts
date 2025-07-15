// app/dashboard/pacientes/types.ts

// Información básica del propietario para anidar en Paciente
export type PropietarioSimpleInfo = {
  id: string;
  nombre_completo: string | null;
};

// Tipo para un Paciente, incluyendo la información de su Propietario
export type PacienteConPropietario = {
  id: string;
  nombre: string;
  especie: string | null;
  raza: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  propietarios: PropietarioSimpleInfo | null;
};

// Opciones para el tipo de recordatorio
export const tiposDeRecordatorioOpciones = [
    'Vacunación',
    'Desparasitación Interna',
    'Desparasitación Externa',
    'Test Leucemia/Inmunodeficiencia',
    'Revisión Dental',
    'Análisis de Sangre',
    'Otro'
] as const;
export type TipoRecordatorio = typeof tiposDeRecordatorioOpciones[number];

// Tipo para una entrada de medición
export type MedicionPaciente = {
  id: string;
  created_at: string;
  paciente_id: string;
  fecha_medicion: string;
  peso: number | null;
  temperatura: number | null;
  frecuencia_cardiaca: number | null;
  frecuencia_respiratoria: number | null;
  mucosas: string | null;
  notas: string | null;
};

// Tipo para una entrada de recordatorio de salud
export type RecordatorioSalud = {
  id: string;
  created_at: string;
  paciente_id: string;
  tipo: TipoRecordatorio;
  fecha_proxima: string;
  completado: boolean;
  notas: string | null;
};

// Tipo para una entrada del historial médico
export type HistorialMedico = {
  id: string;
  paciente_id: string;
  fecha_evento: string | null;
  tipo: string | null;
  descripcion: string | null;
  diagnostico: string | null;
  tratamiento_indicado: string | null;
  notas_seguimiento: string | null;
  created_at: string;
  proximo_seguimiento: string | null;
  factura_id?: string | null;
};

// Tipo base para un Paciente
export type Paciente = {
  id: string;
  created_at: string;
  nombre: string;
  propietario_id: string;
  especie: string | null;
  raza: string | null;
  fecha_nacimiento: string;
  sexo: 'Macho' | 'Hembra' | null;
  chip: string | null;
  notas: string | null;
  condiciones_medicas_preexistentes: string | null;
};

// --- NUEVO TIPO CENTRALIZADO ---
// Este tipo combina el paciente con todas sus relaciones para usarlo en la página de detalles
export type PacienteDetalleCompleto = Paciente & {
  propietarios: {
    id: string;
    nombre_completo: string | null;
  } | null;
  historiales_medicos: HistorialMedico[];
  mediciones_paciente: MedicionPaciente[];
  recordatorios_salud: RecordatorioSalud[];
};


// Tipo para el formulario de Pacientes (crear/editar)
export type PacienteFormData = {
  nombre: string;
  propietario_id: string;
  especie: string;
  raza: string;
  fecha_nacimiento: string;
  sexo: string;
  chip: string;
  notas: string;
};

// Para selectores, si es necesario
export type EntidadParaSelector = {
  id: string;
  nombre: string;
};