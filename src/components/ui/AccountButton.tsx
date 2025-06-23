"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { UserCircle } from 'lucide-react';

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
    <Link href={href} className="relative p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors" title={session ? "Mi Cuenta" : "Iniciar Sesión"}>
      <UserCircle className="h-6 w-6" />
    </Link>
  );
}