"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

// Definimos las props que aceptará nuestro componente
interface AppointmentLinkProps {
  className?: string;
  children: React.ReactNode;
}

export default function AppointmentLink({ className, children }: AppointmentLinkProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
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

  // Mientras carga la sesión, podemos mostrar un estado deshabilitado o no renderizar nada
  if (loading) {
    return (
      <span className={`${className} cursor-wait opacity-50`}>
        {children}
      </span>
    );
  }

  // Si hay una sesión activa, el enlace apunta al área de cuenta.
  // Si no, apunta a la página pública de solicitud de cita.
  const href = session ? "/cuenta/citas/nueva" : "/servicios/solicitar-cita";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}