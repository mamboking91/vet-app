// app/dashboard/citas/types.ts

// Para el selector de pacientes en los formularios de citas
export type PacienteParaSelector = {
    id: string; // ID del paciente
    nombre_display: string; // Ejemplo: "Bobby (Perro) - Dueño: Juan Pérez"
  };
  
  // Información del paciente tal como se anida en CitaConDetalles (para mostrar en listas/agendas)
  export type PacienteInfoForCita = {
    id: string;
    nombre: string;
    propietarios: {
      id: string;
      nombre_completo: string | null;
    } | null; 
  } | null; 
  
  // Tipo completo para mostrar una cita con detalles del paciente (usado en CitasAgendaDiaria)
  export type CitaConDetalles = {
    id: string;
    fecha_hora_inicio: string; // String ISO de la base de datos
    fecha_hora_fin: string | null; // String ISO de la base de datos
    duracion_estimada_minutos: number | null;
    motivo: string | null;
    tipo: string | null;       // Valor del ENUM tipo_cita_opciones de la BD
    estado: string;            // Valor del ENUM estado_cita de la BD
    pacientes: PacienteInfoForCita; 
    // veterinario_asignado_id?: string | null; // Descomenta si lo seleccionas y usas
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
  
  // Tipo para los datos que maneja el CitaForm internamente y para initialData
  // Todos los campos son strings porque los inputs HTML trabajan con strings.
  export type CitaFormData = {
    paciente_id: string;
    fecha_hora_inicio: string; // Formato esperado por <input type="datetime-local">: "YYYY-MM-DDTHH:mm"
    duracion_estimada_minutos: string;
    motivo: string;
    tipo: string;       // Debería ser TipoCitaValue o string vacío
    estado: string;     // Debería ser EstadoCitaValue o string vacío
    notas_cita: string;
  };
  
  // Tipo para el registro de cita tal como viene de la BD (antes de formatear para el form)
  export type CitaDBRecord = {
    id: string;
    paciente_id: string;
    fecha_hora_inicio: string; // String ISO de Supabase
    fecha_hora_fin: string | null; // String ISO de Supabase
    duracion_estimada_minutos: number | null;
    motivo: string | null;
    tipo: TipoCitaValue | null; // Coincide con los valores del ENUM
    estado: EstadoCitaValue;    // Coincide con los valores del ENUM
    notas_cita: string | null;
    veterinario_asignado_id: string | null; // Si lo tienes en tu tabla
    created_at: string;
    updated_at: string | null;
  };