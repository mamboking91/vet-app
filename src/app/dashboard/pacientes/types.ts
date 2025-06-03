// app/dashboard/pacientes/types.ts

// Información básica del propietario para anidar en Paciente
export type PropietarioSimpleInfo = {
  id: string;
  nombre_completo: string | null;
  // Puedes añadir más campos si los necesitas y los seleccionas
};

// Tipo para un Paciente, incluyendo la información de su Propietario
export type PacienteConPropietario = {
  id: string;
  nombre: string;
  especie: string | null;
  raza: string | null;
  fecha_nacimiento: string | null; // Asumiendo que es un string ISO de la BD
  sexo: string | null;
  // Otros campos del paciente que puedas necesitar en la tabla o detalle
  // propietario_id: string; // El ID del propietario, si lo seleccionas directamente
  propietarios: PropietarioSimpleInfo | null; // <--- CORREGIDO: Propietario como objeto único o null
};

// Tipo para el formulario de Pacientes (crear/editar)
export type PacienteFormData = {
  nombre: string;
  propietario_id: string; // Se usa para el <Select> de propietario
  especie: string;
  raza: string;
  fecha_nacimiento: string; // Para el input type="date" (YYYY-MM-DD)
  sexo: string;
  chip: string; // Ejemplo de otro campo
  notas: string; // Ejemplo de otro campo
  // ... otros campos que tengas en tu formulario
};

// Para selectores, si es necesario
export type EntidadParaSelector = {
  id: string;
  nombre: string;
};
