// app/dashboard/layout.tsx
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, Users, Dog, ClipboardList, 
  CalendarDays, Archive, FileText, Wrench, Settings, LogOut 
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/propietarios", label: "Propietarios", icon: Users },
    { href: "/dashboard/pacientes", label: "Pacientes", icon: Dog },
    { href: "/dashboard/procedimientos", label: "Procedimientos", icon: Wrench },
    { href: "/dashboard/citas", label: "Citas", icon: CalendarDays },
    { href: "/dashboard/facturacion", label: "Facturación", icon: FileText },
    { href: "/dashboard/inventario", label: "Inventario", icon: Archive },
    { href: "/dashboard/informes", label: "Informes", icon: FileText, disabled: true },
  ];
  
  const settingsNavItems: NavItem[] = [
    { href: "/dashboard/configuracion", label: "Configuración", icon: Settings }, // Enlazará a la página hub de config
  ];

  useEffect(() => {
    const checkSessionAndListen = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!initialSession) {
        router.push('/login');
        return;
      }
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setTimeout(() => { router.push('/login'); }, 100);
        }
      });
      return () => { authListener?.subscription.unsubscribe(); };
    };
    checkSessionAndListen();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <aside 
        className="w-64 bg-gray-900 text-gray-200 p-4 flex flex-col shadow-lg print:hidden" // <--- AÑADIDO print:hidden
      >
        <div className="mb-8 px-2">
          <Link href="/dashboard" className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
            Clínica Vet 🐾
          </Link>
        </div>
        <nav className="flex-grow space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && !item.disabled);
            return (
              <Link
                key={item.label}
                href={item.disabled ? "#" : item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-md text-sm font-medium
                  transition-all duration-150 ease-in-out group
                  ${isActive 
                    ? "bg-sky-600 text-white shadow-sm" 
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"}
                  ${item.disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
                `}
                aria-disabled={item.disabled}
                onClick={(e) => { if (item.disabled) e.preventDefault(); }}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-700 space-y-1">
          {settingsNavItems.map((item) => {
             const isActive = pathname.startsWith(item.href); // Para que Configuración se active si estás en subrutas
            return (
              <Link
                key={item.label}
                href={item.disabled ? "#" : item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-md text-sm font-medium
                  transition-all duration-150 ease-in-out group
                  ${isActive 
                    ? "bg-sky-600 text-white shadow-sm" 
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"}
                  ${item.disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
                `}
                aria-disabled={item.disabled}
                onClick={(e) => { if (item.disabled) e.preventDefault(); }}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center justify-start text-left px-3 py-2.5 text-sm font-medium rounded-md group text-red-400 hover:text-red-300 hover:bg-red-700/20 transition-all duration-150 ease-in-out"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-400" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto bg-slate-100 dark:bg-slate-900 print:bg-white"> {/* Fondo blanco para impresión del main */}
        {children}
      </main>
    </div>
  );
}