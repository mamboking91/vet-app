// app/dashboard/configuracion/clinica/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ClinicDataForm from './ClinicDataForm'; // Crearemos este componente a continuación

// Tipo para los datos de la clínica, debe coincidir con la tabla datos_clinica
// y con lo que el ClinicDataForm espera como initialData.
// Podrías mover esto a un archivo types.ts en la carpeta 'configuracion'.
export type ClinicData = {
  id?: boolean; // El ID es true
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

export const dynamic = 'force-dynamic';

export default async function DatosClinicaPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtenemos los datos de la clínica (asumimos que solo hay una fila con id=true)
  const { data: clinicData, error } = await supabase
    .from('datos_clinica')
    .select('*')
    .eq('id', true) // Buscamos la fila única
    .maybeSingle<ClinicData>(); // .maybeSingle() para que no dé error si no existe la fila aún

  if (error) {
    console.error("Error fetching clinic data:", error);
    // Considera mostrar un mensaje de error más amigable
    return <p className="text-red-500">Error al cargar los datos de la clínica: {error.message}</p>;
  }

  // Preparamos los datos iniciales para el formulario
  // Si no hay datos (primera vez), pasamos un objeto con valores por defecto (strings vacíos o null)
  const initialData: ClinicData = clinicData || {
    nombre_clinica: '',
    direccion_completa: null,
    codigo_postal: null,
    ciudad: null,
    provincia: null,
    pais: null,
    telefono_principal: null,
    email_contacto: null,
    nif_cif: null,
    logo_url: null,
    horarios_atencion: null,
    sitio_web: null,
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/configuracion"> {/* Volver a la página principal de Configuración */}
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Datos de la Clínica</h1>
      </div>
      <ClinicDataForm initialData={initialData} />
    </div>
  );
}