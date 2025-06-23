import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, User } from 'lucide-react';

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
          {/* Navegación Lateral */}
          <aside className="md:col-span-1">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Mi Cuenta</h3>
              <nav className="space-y-2">
                <Link href="/cuenta/pedidos" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                  <FileText className="h-5 w-5" />
                  Mis Pedidos
                </Link>
                <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed" title="Próximamente">
                  <User className="h-5 w-5" />
                  Mis Datos
                </Link>
              </nav>
            </div>
          </aside>

          {/* Contenido de la página */}
          <main className="md:col-span-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}