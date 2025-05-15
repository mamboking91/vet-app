// app/dashboard/layout.tsx
"use client";

import React, { useEffect } from 'react'; // Asegúrate de que React esté importado
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // Ajusta la ruta si es necesario
import { Button } from '@/components/ui/button'; // Ajusta la ruta si es necesario

// Descomenta si vas a usar iconos de lucide-react o similar
// import { LayoutDashboard, Users, Dog, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const checkSessionAndListen = async () => {
      // Comprobar la sesión inicial
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!initialSession) {
        router.push('/login');
        return; // Salir si no hay sesión inicial para evitar ejecutar el listener innecesariamente
      }

      // Escuchar cambios en el estado de autenticación
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          // Usar un pequeño retardo puede ayudar a evitar bucles si hay redirecciones rápidas.
          setTimeout(() => {
            router.push('/login');
          }, 100);
        } else if (event === 'SIGNED_IN') {
          // Opcional: Acciones al iniciar sesión, como redirigir si ya está en /login
          // if (window.location.pathname === '/login') {
          //   router.push('/dashboard');
          // }
        }
        // Podrías querer refrescar la página o ciertas partes para reflejar el estado de login/logout
        // router.refresh(); // Usar con precaución para evitar refrescos excesivos
      });

      // Limpiar el listener cuando el componente se desmonte
      return () => {
        authListener?.subscription.unsubscribe();
      };
    };

    checkSessionAndListen();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // La redirección ahora debería ser manejada principalmente por onAuthStateChange,
    // pero una redirección explícita aquí puede ser más inmediata.
    router.push('/login');
    // router.refresh(); // Opcional, para forzar un re-render del lado del servidor
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
        <div className="mb-8">
          <Link href="/dashboard" className="text-2xl font-semibold hover:text-gray-300">
            Clínica Vet
          </Link>
        </div>
        <nav className="flex-grow">
          <ul>
            <li className="mb-3">
              <Link href="/dashboard" className="flex items-center p-2 rounded hover:bg-gray-700 transition-colors">
                {/* <LayoutDashboard className="mr-2 h-5 w-5" /> */}
                <span>Dashboard</span>
              </Link>
            </li>
            <li className="mb-3">
              <Link href="/dashboard/propietarios" className="flex items-center p-2 rounded hover:bg-gray-700 transition-colors">
                {/* <Users className="mr-2 h-5 w-5" /> */}
                <span>Propietarios</span>
              </Link>
            </li>
            <li className="mb-3">
              <Link href="/dashboard/pacientes" className="flex items-center p-2 rounded hover:bg-gray-700 transition-colors">
                {/* <Dog className="mr-2 h-5 w-5" /> */}
                <span>Pacientes</span>
              </Link>
            </li>
            {/* ... más enlaces para otras secciones ... */}
          </ul>
        </nav>
        <div className="mt-auto"> {/* Empuja el contenido inferior hacia abajo */}
          {/* Ejemplo: Configuración o Perfil del Usuario */}
          {/*
          <Link href="/dashboard/configuracion" className="flex items-center p-2 rounded hover:bg-gray-700 transition-colors mb-2">
            <Settings className="mr-2 h-5 w-5" />
            <span>Configuración</span>
          </Link>
          */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-left p-2 hover:bg-red-700 hover:text-white"
          >
            {/* <LogOut className="mr-2 h-5 w-5" /> */}
            Cerrar Sesión
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}