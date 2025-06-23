import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link'; // <-- CORRECCIÓN: Se añade la importación que faltaba
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import type { CitaConDetallesAnidados } from '@/app/dashboard/citas/types';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

type CitaConPaciente = CitaConDetallesAnidados; // Usamos el tipo directamente

function CitaCard({ cita }: { cita: CitaConPaciente }) {
    const fechaCita = new Date(cita.fecha_hora_inicio);
    const esPasada = fechaCita < new Date();

    return (
        <div className="flex items-start gap-4 p-4 border-b last:border-b-0">
            <div className="flex flex-col items-center justify-center bg-gray-100 p-3 rounded-lg w-20 text-center">
                <span className="text-sm font-bold text-blue-600 uppercase">{format(fechaCita, 'MMM', { locale: es })}</span>
                <span className="text-2xl font-extrabold text-gray-800">{format(fechaCita, 'dd')}</span>
                <span className="text-xs text-gray-500">{format(fechaCita, 'HH:mm')}h</span>
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-900">{cita.motivo || cita.tipo || 'Cita programada'}</h4>
                    <Badge variant={esPasada ? 'secondary' : 'default'} className="capitalize">
                        {cita.estado}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Mascota: <span className="font-medium text-gray-700">{cita.pacientes?.nombre || 'No especificada'}</span>
                </p>
            </div>
        </div>
    )
}

export default async function MisCitasPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: mascotasUsuario } = await supabase
    .from('pacientes')
    .select('id')
    .eq('propietario_id', user.id);

  const mascotaIds = mascotasUsuario?.map(m => m.id) || [];

  let citas: CitaConPaciente[] = [];
  if (mascotaIds.length > 0) {
      const { data, error } = await supabase
        .from('citas')
        .select(`*, pacientes (nombre)`)
        .in('paciente_id', mascotaIds)
        .order('fecha_hora_inicio', { ascending: false });
      if(data) citas = data as CitaConPaciente[];
  }

  const ahora = new Date();
  const proximasCitas = citas
    .filter(c => new Date(c.fecha_hora_inicio) >= ahora)
    .sort((a,b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime());
  
  const citasPasadas = citas.filter(c => new Date(c.fecha_hora_inicio) < ahora);

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Clock className="h-6 w-6 text-blue-600"/>
                        <div>
                            <CardTitle>Próximas Citas</CardTitle>
                            <CardDescription>Tus siguientes visitas programadas a la clínica.</CardDescription>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href="/cuenta/citas/nueva">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Solicitar Cita
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {proximasCitas.length > 0 ? (
                    <div>
                       {proximasCitas.map(cita => <CitaCard key={cita.id} cita={cita} />)}
                    </div>
                ) : (
                    <p className="text-center py-10 text-muted-foreground">No tienes próximas citas programadas.</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                 <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600"/>
                    <div>
                        <CardTitle>Citas Anteriores</CardTitle>
                        <CardDescription>Tu historial de visitas a la clínica.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {citasPasadas.length > 0 ? (
                    <div>
                        {citasPasadas.map(cita => <CitaCard key={cita.id} cita={cita} />)}
                    </div>
                ) : (
                    <p className="text-center py-10 text-muted-foreground">No tienes un historial de citas anteriores.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}