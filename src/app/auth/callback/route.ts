import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // Esta línea es la clave: leerá la variable correcta según el entorno.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // Si la variable no está definida, es un error de configuración.
  if (!siteUrl) {
    console.error("Error Crítico: NEXT_PUBLIC_SITE_URL no está definida.");
    const errorUrl = new URL('/login?error=Configuración%20inválida%20del%20servidor', requestUrl.origin)
    return NextResponse.redirect(errorUrl);
  }
  
  // A partir de aquí, el código usa `siteUrl` para todas las redirecciones.
  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Error al intercambiar el código por una sesión:', sessionError.message);
      const errorRedirectUrl = new URL('/login?error=Fallo%20de%20autenticación', siteUrl);
      return NextResponse.redirect(errorRedirectUrl);
    }

    if (session?.user) {
        const { data: propietario, error: profileError } = await supabase
            .from('propietarios')
            .select('rol')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error('Error al obtener el perfil del usuario:', profileError.message);
            const defaultUserUrl = new URL('/cuenta/pedidos', siteUrl);
            return NextResponse.redirect(defaultUserUrl);
        }

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

  console.warn('Ruta de callback llamada sin un código de autorización. Redirigiendo a login.');
  const loginUrl = new URL('/login', siteUrl);
  return NextResponse.redirect(loginUrl);
}