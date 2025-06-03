// app/dashboard/propietarios/types.ts

// Información básica del paciente para anidar en PropietarioDetallado
export type PacienteSimpleInfo = {
    id: string;
    nombre: string;
    especie: string | null;
    raza: string | null;
  };
  
  // Tipo para un Propietario con su lista de Pacientes (para la página de detalle)
  export type PropietarioDetallado = {
    id: string;
    nombre_completo: string;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
    // dni_cif: string | null; // Eliminado
    notas: string | null;
    created_at: string;
    // updated_at: string | null; 
    pacientes: PacienteSimpleInfo[];
  };
  
  // Tipo para el formulario de Propietarios (crear/editar)
  export type PropietarioFormData = {
    nombre_completo: string;
    email: string;
    telefono: string;
    direccion: string;
    // dni_cif: string; // Eliminado
    notas: string;
  };
  
  // Tipo para la tabla de listado de propietarios
  export type PropietarioConConteoMascotas = {
    id: string;
    nombre_completo: string;
    email: string | null;
    telefono: string | null;
    pacientes_count: number;
  };
  
  // Tipo para listar pacientes con su propietario (usado en pacientes/page.tsx)
  // Este tipo parece más relacionado con la sección de pacientes,
  // pero lo mantengo aquí si lo estás usando desde este archivo.
  // Considera moverlo a app/dashboard/pacientes/types.ts si es más apropiado.
  export type PacienteConPropietario = {
    id: string;
    nombre: string;
    especie: string | null;
    raza: string | null;
    fecha_nacimiento: string | null;
    sexo: string | null;
    propietarios: { // Si Supabase devuelve esto como array en la consulta de PacientesPage
      id: string;
      nombre_completo: string;
    }[] | null; 
    // Si la consulta de pacientes devuelve un objeto propietario, sería:
    // propietarios: PropietarioSimpleInfo | null;
  };
  