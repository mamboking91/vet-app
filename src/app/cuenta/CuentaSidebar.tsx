"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { FileText, User, Heart, Calendar, LogOut } from 'lucide-react';

export default function CuentaSidebar() {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Redirigimos al inicio de sesión y refrescamos para asegurar que el estado se actualice
        router.push('/login');
        router.refresh(); 
    };
    
    return (
        <aside className="md:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4">Mi Cuenta</h3>
            <nav className="space-y-2 flex-grow">
              <Link href="/cuenta/pedidos" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <FileText className="h-5 w-5" />
                Mis Pedidos
              </Link>
              <Link href="/cuenta/datos" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <User className="h-5 w-5" />
                Mis Datos
              </Link>
              <Link href="/cuenta/mascotas" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <Heart className="h-5 w-5" />
                Mis Mascotas
              </Link>
              <Link href="/cuenta/citas" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <Calendar className="h-5 w-5" />
                Mis Citas
              </Link>
            </nav>
            <div className="mt-6 pt-4 border-t border-gray-200">
                 <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </Button>
            </div>
          </div>
        </aside>
    );
}