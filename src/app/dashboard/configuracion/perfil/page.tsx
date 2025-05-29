// app/dashboard/configuracion/perfil/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import CambioContrasenaForm from './CambioContrasenaForm'; // Crearemos este formulario

export const dynamic = 'force-dynamic';

export default async function PerfilUsuarioPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Esto no debería suceder si el layout del dashboard ya protege la ruta
    return <p>Usuario no autenticado.</p>;
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/configuracion">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Mi Perfil</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información de Usuario</CardTitle>
            <CardDescription>Estos son tus datos de acceso actuales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Último inicio de sesión:</span>
              <span>
                {user.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' }) 
                  : 'N/A'}
              </span>
            </div>
            {/* Aquí podrías añadir más campos si los tuvieras en una tabla 'profiles' */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
            <CardDescription>Actualiza tu contraseña de acceso.</CardDescription>
          </CardHeader>
          <CardContent>
            <CambioContrasenaForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}