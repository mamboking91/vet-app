import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import EditarDatosForm from './EditarDatosForm';
import type { Propietario } from '@/app/dashboard/propietarios/types';

export const dynamic = 'force-dynamic';

export default async function MisDatosPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: propietario, error } = await supabase
    .from('propietarios')
    .select('*')
    .eq('id', user.id)
    .single<Propietario>();
  
  if (error || !propietario) {
    // Esto podría pasar si el trigger falló en el pasado
    return <p>Error: No se pudo cargar tu perfil. Por favor, contacta con soporte.</p>
  }
  
  return (
    <EditarDatosForm propietario={propietario} />
  );
}