// app/dashboard/pacientes/types.ts
export type PacienteConPropietario = {
    id: string;
    nombre: string;
    especie: string | null;
    raza: string | null;
    fecha_nacimiento: string | null;
    propietarios: {
      id: string;
      nombre_completo: string | null;
    }[] | null; // Mantenemos 'propietarios' como array, según el error de build de TS
  };
  
  // Podrías también mover PropietarioSimple aquí si lo usas en varios sitios de 'pacientes'
  // export type PropietarioSimple = {
  //   id: string;
  //   nombre_completo: string;
  // };