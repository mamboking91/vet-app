// app/dashboard/propietarios/types.ts

// --- NUEVO TIPO ---
// Tipo base para un único propietario, que coincide con los campos de la tabla
export type Propietario = {
  id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  localidad: string | null;
  provincia: string | null;
  codigo_postal: string | null;
  notas: string | null;
  created_at: string;
};

// --- TIPOS EXISTENTES ---
export type PacienteSimpleInfo = {
    id: string;
    nombre: string;
    especie: string | null;
    raza: string | null;
  };
  
export type PropietarioDetallado = Propietario & {
    pacientes: PacienteSimpleInfo[];
};
  
export type PropietarioFormData = {
    nombre_completo: string;
    email: string;
    telefono: string;
    direccion: string;
    localidad: string | null;
    provincia: string | null;
    codigo_postal: string | null;
    notas: string;
};
  
export type PropietarioConConteoMascotas = {
    id: string;
    nombre_completo: string;
    email: string | null;
    telefono: string | null;
    pacientes_count: number;
};
  
export type PacienteConPropietario = {
    id: string;
    nombre: string;
    especie: string | null;
    raza: string | null;
    fecha_nacimiento: string | null;
    sexo: string | null;
    propietarios: {
      id: string;
      nombre_completo: string;
    }[] | null; 
};
