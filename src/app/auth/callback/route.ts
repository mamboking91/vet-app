import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // 1. Si Google nos devuelve un código, lo intercambiamos por una sesión
  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Error al intercambiar el código por una sesión:', sessionError.message);
      // Si hay un error, redirigir a la página de login con un mensaje de error
      return NextResponse.redirect(new URL('/login?error=Fallo%20de%20autenticación', request.url))
    }

    // 2. Si tenemos una sesión, comprobamos el rol del usuario
    if (session?.user) {
        const { data: propietario, error: profileError } = await supabase
            .from('propietarios')
            .select('rol')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error('Error al obtener el perfil del usuario:', profileError.message);
            // Si no podemos obtener el perfil, lo enviamos al área de cliente por seguridad
            return NextResponse.redirect(new URL('/cuenta/pedidos', request.url));
        }

        // 3. Redirigimos según el rol
        if (propietario?.rol === 'administrador') {
            console.log("Usuario administrador detectado. Redirigiendo al dashboard.");
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
            console.log("Usuario cliente detectado. Redirigiendo a su cuenta.");
            return NextResponse.redirect(new URL('/cuenta/pedidos', request.url));
        }
    }
  }

  // Si no hay código en la URL, redirigir al login por si acaso
  console.warn('Ruta de callback llamada sin un código de autorización.');
  return NextResponse.redirect(new URL('/login', request.url))
}