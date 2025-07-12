// src/app/cuenta/mascotas/components/DetailedPetCard.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cake, VenetianMask, Weight, PawPrint } from 'lucide-react';
import type { Paciente } from '@/app/dashboard/pacientes/types';
import AvatarUploader from './AvatarUploader';

type PetCardProps = {
  pet: Paciente & { url_avatar: string | null };
};

export default function DetailedPetCard({ pet }: PetCardProps) {
  const fechaNacimientoValida = pet.fecha_nacimiento && isValid(new Date(pet.fecha_nacimiento));

  const edad = fechaNacimientoValida
    ? new Date().getFullYear() - new Date(pet.fecha_nacimiento!).getFullYear()
    : 'N/A';

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <AvatarUploader 
          pacienteId={pet.id} 
          currentAvatarUrl={pet.url_avatar} 
          petName={pet.nombre} 
        />
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{pet.nombre}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="flex items-center gap-2"><PawPrint className="h-4 w-4" /> {pet.especie}</Badge>
            {pet.raza && <Badge variant="outline">{pet.raza}</Badge>}
          </div>
        </div>
        {/* --- INICIO DE LA CORRECCIÓN --- */}
        {/* El enlace ahora apunta a la página de detalle del historial del cliente */}
        <Button asChild>
          <Link href={`/cuenta/mascotas/${pet.id}`}>Ver Historial Clínico</Link>
        </Button>
        {/* --- FIN DE LA CORRECCIÓN --- */}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
          <div className="flex items-center gap-3 p-2 rounded-md bg-slate-50">
            <Cake className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-gray-600">Nacimiento</p>
              <p>{fechaNacimientoValida ? format(new Date(pet.fecha_nacimiento!), 'dd MMMM yyyy', { locale: es }) : 'No especificada'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-md bg-slate-50">
            <VenetianMask className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-gray-600">Sexo</p>
              <p className="capitalize">{pet.sexo || 'No especificado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-md bg-slate-50">
            <Weight className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-gray-600">Edad</p>
              <p>{typeof edad === 'number' ? `${edad} ${edad === 1 ? 'año' : 'años'}` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}