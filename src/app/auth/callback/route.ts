import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // Obtenemos la URL base desde la variable de entorno para que funcione 
  // tanto en producción como en localhost (usando .env.local).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // Si la variable de entorno no está definida, usamos un fallback seguro.
  if (!siteUrl) {
    console.error("Error Crítico: NEXT_PUBLIC_SITE_URL no está definida. La redirección podría fallar.");
    // Redirigimos a una página de error genérica en el origen de la petición.
    const errorUrl = new URL('/login?error=Configuración%20inválida%20del%20servidor', requestUrl.origin)
    return NextResponse.redirect(errorUrl);
  }

  // 1. Si la autenticación (ej. Google, magic link) nos devuelve un código,
  //    lo intercambiamos por una sesión de usuario.
  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Error al intercambiar el código por una sesión:', sessionError.message);
      // Si hay un error, redirigir a la página de login con un mensaje de error.
      const errorRedirectUrl = new URL('/login?error=Fallo%20de%20autenticación', siteUrl);
      return NextResponse.redirect(errorRedirectUrl);
    }

    // 2. Si tenemos una sesión, comprobamos el rol del usuario en nuestra tabla 'propietarios'.
    if (session?.user) {
        const { data: propietario, error: profileError } = await supabase
            .from('propietarios')
            .select('rol')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error('Error al obtener el perfil del usuario:', profileError.message);
            // Si no podemos obtener el perfil, por seguridad lo enviamos al área de cliente.
            const defaultUserUrl = new URL('/cuenta/pedidos', siteUrl);
            return NextResponse.redirect(defaultUserUrl);
        }

        // 3. Redirigimos al usuario según el rol que tenga en la base de datos.
        if (propietario?.rol === 'administrador') {
            console.log("Usuario administrador detectado. Redirigiendo al dashboard.");
            const adminUrl = new URL('/dashboard', siteUrl);
            return NextResponse.redirect(adminUrl);
        } else {
            console.log("Usuario cliente detectado. Redirigiendo a su cuenta.");
            const clientUrl = new URL('/cuenta/pedidos', siteUrl);
            return NextResponse.redirect(clientUrl);
        }
    }
  }

  // Si la ruta de callback se llama sin un código de autorización,
  // es una situación inesperada, así que lo redirigimos al login.
  console.warn('Ruta de callback llamada sin un código de autorización. Redirigiendo a login.');
  const loginUrl = new URL('/login', siteUrl);
  return NextResponse.redirect(loginUrl);
}