// app/dashboard/citas/types.ts

// Para el selector de pacientes en los formularios de citas
export type PacienteParaSelector = {
    id: string; // ID del paciente
    nombre_display: string; // Ejemplo: "Bobby (Perro) - Dueño: Juan Pérez"
  };
  
  // Opciones para el <Select> de Tipo de Cita en el formulario
  export const tiposDeCitaOpciones = [
    { value: "Consulta General", label: "Consulta General" },
    { value: "Vacunación", label: "Vacunación" },
    { value: "Desparasitación", label: "Desparasitación" },
    { value: "Revisión", label: "Revisión" },
    { value: "Cirugía Programada", label: "Cirugía Programada" },
    { value: "Urgencia", label: "Urgencia" },
    { value: "Peluquería", label: "Peluquería" },
    { value: "Otro", label: "Otro" },
  ] as const; // 'as const' es importante para que Zod y TypeScript infieran los valores literales
  export type TipoCitaValue = typeof tiposDeCitaOpciones[number]['value'];
  
  // Opciones para el <Select> de Estado de Cita en el formulario
  export const estadosDeCitaOpciones = [
    "Programada", "Confirmada", "Cancelada por Clínica", 
    "Cancelada por Cliente", "Completada", "No Asistió", "Reprogramada"
  ] as const;
  export type EstadoCitaValue = typeof estadosDeCitaOpciones[number];
  
  // Información del paciente tal como se anida en CitaConDetalles (para mostrar en listas/agendas)
  export type PacienteInfoForCita = {
    id: string;
    nombre: string;
    propietarios: {
      id: string;
      nombre_completo: string | null;
    } | null; 
  } | null; 
  
  // Tipo completo para mostrar una cita con detalles del paciente (usado en la vista de agenda/calendario)
  export type CitaConDetalles = {
    id: string;
    fecha_hora_inicio: string; // String ISO de la base de datos
    fecha_hora_fin: string | null; // String ISO de la base de datos
    duracion_estimada_minutos: number | null;
    motivo: string | null;
    tipo: TipoCitaValue | null; // Usamos el tipo derivado del ENUM
    estado: EstadoCitaValue;    // Usamos el tipo derivado del ENUM
    pacientes: PacienteInfoForCita; 
    // veterinario_asignado_id?: string | null; // Descomenta si lo seleccionas y usas
  };
  
  // Tipo para los datos que maneja el CitaForm internamente y para initialData
  // Todos los campos son strings porque los inputs HTML trabajan con strings.
  export type CitaFormData = {
    paciente_id: string;
    fecha_hora_inicio: string; // Formato esperado por <input type="datetime-local">: "YYYY-MM-DDTHH:mm"
    duracion_estimada_minutos: string;
    motivo: string;
    tipo: string;       // Debería ser TipoCitaValue o string vacío
    estado: string;     // Debería ser EstadoCitaValue o string vacío (especialmente en edición)
    notas_cita: string;
  };
  
  // Tipo para el registro de cita tal como viene de la BD (antes de formatear para el form de edición)
  export type CitaDBRecord = {
    id: string;
    paciente_id: string;
    fecha_hora_inicio: string; // String ISO de Supabase
    fecha_hora_fin: string | null; // String ISO de Supabase
    duracion_estimada_minutos: number | null;
    motivo: string | null;
    tipo: TipoCitaValue | null;
    estado: EstadoCitaValue;
    notas_cita: string | null;
    veterinario_asignado_id: string | null;
    created_at: string;
    updated_at: string | null;
  };
  
  // Tipos para la estructura de la cuadrícula del calendario mensual
  export type DayInMonth = {
    date: Date;             // Objeto Date para el día
    isCurrentMonth: boolean;  // Si el día pertenece al mes que se está visualizando
    isToday: boolean;         // Si es el día actual
    dayNumber: number;        // El número del día (1-31)
    citasDelDia: CitaConDetalles[]; // Array de citas para este día específico
  };
  
  export type WeekInMonth = DayInMonth[]; // Un array de días representa una semana
  
  // Tipo para el objeto que agrupa citas por fecha (YYYY-MM-DD)
  // Usado en CitasPage.tsx antes de transformarlo a 'semanas'
  export type CitasAgrupadasPorFecha = {
    [fecha: string]: CitaConDetalles[];
  };