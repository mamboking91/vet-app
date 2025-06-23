import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Si la ruta no es del dashboard, no hacemos nada.
  if (!req.nextUrl.pathname.startsWith('/dashboard')) {
    return res;
  }

  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Si no hay sesión, redirigir al login.
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Si hay sesión, verificamos el rol.
  const { data: propietario, error } = await supabase
    .from('propietarios')
    .select('rol')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('[Middleware] Error al obtener el perfil:', error.message);
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // --- CORRECCIÓN CLAVE AQUÍ ---
  // Hacemos la comprobación más segura:
  // 1. Verificamos que el perfil exista.
  // 2. Nos aseguramos de que la propiedad 'rol' exista.
  // 3. Limpiamos y convertimos a minúsculas el valor antes de comparar.
  const esAdmin = propietario?.rol?.trim().toLowerCase() === 'administrador';

  if (!esAdmin) {
    // Si no es admin, lo redirigimos a su área de cliente.
    return NextResponse.redirect(new URL('/cuenta/pedidos', req.url));
  }

  // Si es administrador, le permitimos el acceso.
  return res;
}

// La configuración del matcher se mantiene igual.
export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}