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

// --- TIPOS AÑADIDOS ---

// Tipo base para un Paciente (refleja la estructura de tu tabla 'pacientes')
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
  // Esta propiedad se añade dinámicamente con la consulta
  historiales_medicos?: HistorialMedico[]; 
};

// Tipo para una entrada del historial médico
export type HistorialMedico = {
  id: string;
  paciente_id: string;
  fecha_evento: string | null;       // <--- CORREGIDO
  tipo: string | null;               // <--- CORREGIDO (usaremos 'tipo' como el motivo principal)
  descripcion: string | null;        // <--- AÑADIDO
  diagnostico: string | null;
  tratamiento_indicado: string | null;
  notas_seguimiento: string | null;  // <-- Nombre corregido de 'notas'
  created_at: string;
  proximo_seguimiento: string | null; // Mantenido por si existe en la BD
};


// --- FIN DE TIPOS AÑADIDOS ---

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