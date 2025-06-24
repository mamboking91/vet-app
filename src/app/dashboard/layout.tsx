import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Dog, 
  CalendarDays, Archive, FileText, Wrench, Settings, LogOut,
  ShoppingCart, Inbox
} from 'lucide-react';
import LogoutButton from '@/components/ui/LogoutButton';
import NavLink from './NavLink';

// El tipo NavItem ahora es solo para organizar los datos
interface NavItemData {
  href: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  badgeCount?: number; 
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { count: pendingRequestsCount } = await supabase
    .from('solicitudes_cita_publica')
    .select('id', { count: 'exact' })
    .eq('estado', 'pendiente');

  const navItems: NavItemData[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { 
      href: "/dashboard/solicitudes-citas", 
      label: "Solicitudes", 
      icon: Inbox, 
      badgeCount: pendingRequestsCount || 0 
    },
    { href: "/dashboard/propietarios", label: "Propietarios", icon: Users },
    { href: "/dashboard/pacientes", label: "Pacientes", icon: Dog },
    { href: "/dashboard/procedimientos", label: "Procedimientos", icon: Wrench },
    { href: "/dashboard/citas", label: "Citas", icon: CalendarDays },
    { href: "/dashboard/facturacion", label: "Facturación", icon: FileText },
    { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
    { href: "/dashboard/inventario", label: "Inventario", icon: Archive },
    { href: "/dashboard/informes", label: "Informes", icon: FileText, disabled: true },
  ];
  
  const settingsNavItems: NavItemData[] = [
    { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <aside 
        className="w-64 bg-gray-900 text-gray-200 p-4 flex flex-col shadow-lg print:hidden"
      >
        <div className="mb-8 px-2">
          <Link href="/dashboard" className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
            Clínica Vet 🐾
          </Link>
        </div>
        <nav className="flex-grow space-y-1">
          {/* --- CORRECCIÓN: Usamos NavLink pasando el icono y el texto como children --- */}
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              href={item.href}
              isDisabled={item.disabled}
              badgeCount={item.badgeCount}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-700 space-y-1">
          {settingsNavItems.map((item) => (
            <NavLink
              key={item.label}
              href={item.href}
              isDisabled={item.disabled}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <LogoutButton className="w-full justify-start text-left px-3 py-2.5 text-sm font-medium rounded-md group text-red-400 hover:text-red-300 hover:bg-red-700/20 transition-all duration-150 ease-in-out" />
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto bg-slate-100 dark:bg-slate-900 print:bg-white">
        {children}
      </main>
    </div>
  );
}