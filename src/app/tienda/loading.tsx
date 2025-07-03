// src/app/tienda/loading.tsx

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';

// Este componente será renderizado automáticamente por Next.js
// mientras los datos para la página de la tienda se están obteniendo.
export default async function Loading() {
  const supabase = createServerComponentClient({ cookies: () => cookies() });

  // Obtenemos la URL del logo desde la base de datos
  const { data: clinicData } = await supabase
    .from('datos_clinica')
    .select('logo_url')
    .single();
  
  // Usamos la URL del logo o una imagen por defecto si no se encuentra
  const logoUrl = clinicData?.logo_url || '/placeholder.svg';

  return (
    // Contenedor que cubre toda la pantalla con un fondo semi-transparente
    <div className="fixed inset-0 bg-white bg-opacity-95 flex justify-center items-center z-50">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src={logoUrl}
          alt="Cargando..."
          width={120} // Puedes ajustar el tamaño del logo aquí
          height={120}
          className="animate-pulse" // Una animación simple para indicar que está cargando
          priority // Le damos prioridad a la carga de la imagen del logo
        />
        <p className="text-lg font-medium text-gray-600">
          Cargando nuestros mejores productos...
        </p>
      </div>
    </div>
  );
}