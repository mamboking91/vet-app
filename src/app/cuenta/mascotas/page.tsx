// src/app/cuenta/mascotas/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
// --- INICIO DE LA CORRECCIÓN ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// --- FIN DE LA CORRECCIÓN ---
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import DetailedPetCard from './components/DetailedPetCard'; 
import type { Paciente } from '@/app/dashboard/pacientes/types';

export const dynamic = 'force-dynamic';

export default async function MisMascotasPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: mascotas, error } = await supabase
    .from('pacientes')
    .select('id, nombre, especie, raza, sexo, fecha_nacimiento, url_avatar') 
    .eq('propietario_id', user.id)
    .order('nombre', { ascending: true });

  if (error) {
    console.error("Error al obtener las mascotas del usuario:", error);
  }

  const mascotasDetalladas = (mascotas as (Paciente & { url_avatar: string | null })[]) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Mis Mascotas</CardTitle>
            <CardDescription>Consulta la información y el historial clínico de tus mascotas.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/pacientes/nuevo">
                <PlusCircle className="mr-2 h-4 w-4"/>
                Añadir Mascota
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mascotasDetalladas.length > 0 ? (
            <div className="space-y-6">
                {mascotasDetalladas.map((pet) => (
                    <DetailedPetCard key={pet.id} pet={pet} />
                ))}
            </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Aún no tienes mascotas registradas.</p>
            <p className="text-sm text-muted-foreground mt-2">Puedes añadir una desde el panel de control de la clínica.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}