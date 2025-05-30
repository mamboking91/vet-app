// app/dashboard/configuracion/types.ts
export type ClinicData = {
    id?: boolean;
    nombre_clinica: string;
    direccion_completa: string | null;
    codigo_postal: string | null;
    ciudad: string | null;
    provincia: string | null;
    pais: string | null;
    telefono_principal: string | null;
    email_contacto: string | null;
    nif_cif: string | null;
    logo_url: string | null;
    horarios_atencion: string | null;
    sitio_web: string | null;
    updated_at?: string;
  };