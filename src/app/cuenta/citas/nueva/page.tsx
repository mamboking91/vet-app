import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SolicitarCitaForm from './SolicitarCitaForm';
import type { EntidadParaSelector } from '@/app/dashboard/pacientes/types';

export const dynamic = 'force-dynamic';

export default async function SolicitarCitaPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: mascotas, error } = await supabase
    .from('pacientes')
    .select('id, nombre')
    .eq('propietario_id', user.id);

  const mascotasParaSelector = (mascotas as EntidadParaSelector[]) || [];

  return (
    <div>
      <Button asChild variant="ghost" className="mb-4 -ml-4">
        <Link href="/cuenta/citas"><ChevronLeft className="mr-2 h-4 w-4"/> Volver a mis citas</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Solicitar una Cita</CardTitle>
          <CardDescription>Completa el formulario y nos pondremos en contacto contigo para confirmar.</CardDescription>
        </CardHeader>
        <CardContent>
          {mascotasParaSelector.length > 0 ? (
            <SolicitarCitaForm mascotas={mascotasParaSelector} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Necesitas tener al menos una mascota registrada para poder solicitar una cita.</p>
              <Button asChild className="mt-4" variant="outline"><Link href="/dashboard/pacientes/nuevo">Registrar mi primera mascota</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}