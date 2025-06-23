import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
// Importamos el nuevo componente de la barra lateral
import CuentaSidebar from './CuentaSidebar'; 

export default async function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Si no hay sesión, redirigir al login
    redirect('/login');
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Usamos el nuevo componente que ya incluye la lógica y el botón */}
          <CuentaSidebar />

          {/* El contenido de la página se mantiene igual */}
          <main className="md:col-span-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}