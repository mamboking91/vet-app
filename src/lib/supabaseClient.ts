// lib/supabaseClient.ts
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

// Los siguientes imports y ejemplos comentados son para cuando necesites
// interactuar con Supabase desde el lado del servidor (Server Components,
// Server Actions, API Routes). No son necesarios para el cliente del navegador
// que estamos configurando ahora, pero son una guía útil para el futuro.

// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers'; // Necesario para los helpers del servidor

// --- Cliente Supabase para el Navegador (Client Components) ---
// Este es el cliente que usarás en tus Componentes de Cliente para interactuar
// con Supabase (por ejemplo, para el inicio de sesión, registro, etc.).
// createPagesBrowserClient buscará automáticamente las variables de entorno
// NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.
// Especificarlas aquí es una buena práctica para mayor claridad.
export const supabase = createPagesBrowserClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

// --- EJEMPLOS PARA EL FUTURO (LADO DEL SERVIDOR) ---

// Nota: Ejemplo de cómo crear un cliente Supabase en Server Components
//
// export const createSupabaseServerClient = () => {
//   const cookieStore = cookies(); // Obtiene las cookies del contexto del servidor
//   return createServerComponentClient({ cookies: () => cookieStore }, {
//     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,          // Opcional si están en .env
//     supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,     // Opcional si están en .env
//   });
// }

// Nota: Ejemplo de cómo crear un cliente Supabase en Server Actions o Route Handlers (API Routes)
//
// export const createSupabaseRouteHandlerClient = () => {
//   const cookieStore = cookies(); // Obtiene las cookies del contexto del servidor
//   return createRouteHandlerClient({ cookies: () => cookieStore }, {
//    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,           // Opcional si están en .env
//    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,      // Opcional si están en .env
//   });
// }