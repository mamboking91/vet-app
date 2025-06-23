import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PawPrint } from 'lucide-react';
import type { Paciente } from '@/app/dashboard/pacientes/types';

export const dynamic = 'force-dynamic';

function PetCard({ pet }: { pet: Paciente }) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">{pet.nombre}</CardTitle>
                <PawPrint className="h-6 w-6 text-blue-500" />
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{pet.especie} - {pet.raza}</p>
                <p className="text-sm text-muted-foreground">Nacimiento: {new Date(pet.fecha_nacimiento).toLocaleDateString('es-ES')}</p>
                <Button asChild className="mt-4 w-full" variant="outline">
                    <Link href={`/cuenta/mascotas/${pet.id}`}>Ver Historial Clínico</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

export default async function MisMascotasPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: mascotas, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('propietario_id', user.id)
    .order('nombre', { ascending: true });

  if (error) {
    console.error("Error al obtener las mascotas del usuario:", error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Mascotas</CardTitle>
        <CardDescription>Consulta la información y el historial clínico de tus mascotas.</CardDescription>
      </CardHeader>
      <CardContent>
        {mascotas && mascotas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mascotas.map((pet) => (
                    <PetCard key={pet.id} pet={pet as Paciente} />
                ))}
            </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Aún no tienes mascotas registradas.</p>
            <p className="text-sm text-muted-foreground mt-2">Contacta con la clínica para registrar a tu mascota.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}