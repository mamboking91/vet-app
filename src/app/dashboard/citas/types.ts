// src/app/dashboard/citas/types.ts
import type React from "react";
import { Stethoscope, Pill, FileText } from 'lucide-react';

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
  ] as const;
  export type TipoCitaValue = typeof tiposDeCitaOpciones[number]['value'];
  
  export const estadosDeCitaOpciones = [
    "Programada", "Confirmada", "Cancelada por Clínica", 
    "Cancelada por Cliente", "Completada", "No Asistió", "Reprogramada"
  ] as const;
  export type EstadoCitaValue = typeof estadosDeCitaOpciones[number];
  
  // -----------------------------------------------------------------------------
  // Tipos para Selectores de Formulario
  // -----------------------------------------------------------------------------
  
  export type PacienteParaSelector = {
    id: string; // ID del paciente
    nombre_display: string; // Ejemplo: "Bobby (Perro) - Dueño: Juan Pérez"
  };
  
  // -----------------------------------------------------------------------------
  // Tipos para Datos de Citas (Estructuras Anidadas)
  // -----------------------------------------------------------------------------
  
  // Representa un objeto Propietario individual (simplificado)
  type PropietarioInfoAnidado = {
    id: string;
    nombre_completo: string | null;
  };
  
  // Representa un objeto Paciente individual con su Propietario (o array de propietarios si la consulta lo devuelve así)
  // Basado en el error de TypeScript, la consulta anidada devuelve 'propietarios' como un array.
  type PacienteInfoConPropietariosArray = {
    id: string;
    nombre: string;
    // especie?: string | null; // Puedes añadir más campos del paciente si los seleccionas y necesitas
    propietarios: PropietarioInfoAnidado[] | null; 
  };
  
  // Tipo para la CITA tal como la devuelve Supabase con anidamientos de arrays
  // según la inferencia del compilador de TypeScript que causó el error.
  export type CitaConArraysAnidados = {
    id: string;
    fecha_hora_inicio: string; 
    fecha_hora_fin: string | null; 
    duracion_estimada_minutos: number | null;
    motivo: string | null;
    tipo: TipoCitaValue | null; 
    estado: EstadoCitaValue;      
    pacientes: PacienteInfoConPropietariosArray[] | null; // Pacientes es un array
    // veterinario_asignado_id?: string | null;
  };
  
  
  // --- Tipos para la UI (después de procesar/aplanar los arrays si es necesario) ---
  
  // Información del Paciente (con un solo propietario) para mostrar en la UI
  export type PacienteInfoProcesada = {
    id: string;
    nombre: string;
    propietarios: PropietarioInfoAnidado | null; // Propietario es un objeto o null
  } | null; 
  
  // Tipo Cita con datos de Paciente (y su Propietario) ya procesados para fácil visualización
  export type CitaConDetalles = {
    id: string;
    fecha_hora_inicio: string;
    fecha_hora_fin: string | null;
    duracion_estimada_minutos: number | null;
    motivo: string | null;
    tipo: TipoCitaValue | null;
    estado: EstadoCitaValue;
    pacientes: PacienteInfoProcesada; // Paciente es un objeto (o null)
    // veterinario_asignado_id?: string | null;
  };
  
  // -----------------------------------------------------------------------------
  // Tipos para Formularios y Registros de BD individuales
  // -----------------------------------------------------------------------------
  
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
  
  // Tipo para el registro de cita tal como viene de la BD (para edición, antes de formatear para el form)
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
  
  // -----------------------------------------------------------------------------
  // Tipos para la Vista de Calendario Mensual Personalizada
  // -----------------------------------------------------------------------------
  
  export type DayInMonth = {
    date: Date;             // Objeto Date para el día
    isCurrentMonth: boolean;  // Si el día pertenece al mes que se está visualizando
    isToday: boolean;         // Si es el día actual
    dayNumber: number;        // El número del día (1-31)
    citasDelDia: CitaConDetalles[]; // Array de citas (ya procesadas) para este día específico
  };
  
  export type WeekInMonth = DayInMonth[]; // Un array de días representa una semana
  
  // Tipo para el objeto que agrupa citas por fecha (YYYY-MM-DD) ANTES de convertir a 'semanas'
  // Este tipo podría no ser necesario exportarlo si la transformación ocurre solo en page.tsx
  export type CitasAgrupadasPorFecha = {
    [fecha: string]: CitaConDetalles[];
  };