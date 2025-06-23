"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Importamos la utilidad cn

export default function AccountButton() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const href = session ? "/cuenta/pedidos" : "/login";

  return (
    <Link 
      href={href} 
      className={cn(
        "relative p-2 rounded-full hover:bg-gray-100 transition-colors",
        // --- CORRECCIÓN AQUÍ ---
        // Aplicamos un color si hay sesión, y otro si no la hay.
        session 
          ? "text-blue-600 hover:text-blue-700" 
          : "text-gray-500 hover:text-gray-900"
      )}
      title={session ? "Mi Cuenta" : "Iniciar Sesión"}
    >
      <UserCircle className="h-6 w-6" />
    </Link>
  );
}