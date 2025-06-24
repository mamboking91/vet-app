import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, CheckCircle, Clock, PlusCircle, PawPrint } from 'lucide-react';
import type { CitaConDetallesAnidados } from '@/app/dashboard/citas/types';
import type { SolicitudCitaPublica } from '@/app/dashboard/solicitudes-citas/types';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

// Creamos un tipo de unión para manejar ambos casos
type CitaOSolicitud = CitaConDetallesAnidados | SolicitudCitaPublica;

// Componente para mostrar tanto citas como solicitudes
function CitaOSolicitudCard({ item }: { item: CitaOSolicitud }) {
    // La función 'esSolicitud' ahora es un "type guard" que ayuda a TypeScript
    const esSolicitud = (item: CitaOSolicitud): item is SolicitudCitaPublica => 'motivo_cita' in item;

    // --- CORRECCIÓN: Usamos el type guard para acceder a las propiedades de forma segura ---
    const esSol = esSolicitud(item);
    const fecha = esSol ? (item.fecha_preferida ? new Date(item.fecha_preferida + 'T12:00:00Z') : new Date()) : new Date(item.fecha_hora_inicio);
    const motivo = esSol ? item.motivo_cita : item.motivo || item.tipo;
    const nombreMascota = esSol ? item.nombre_mascota : item.pacientes?.nombre;
    const estado = esSol ? item.estado : item.estado;
    const esPasada = fecha < new Date() && !esSol;
    const franjaHoraria = esSol ? item.franja_horaria : null;

    return (
        <div className="flex items-start gap-4 p-4 border-b last:border-b-0">
            <div className="flex flex-col items-center justify-center bg-gray-100 p-3 rounded-lg w-20 text-center">
                <span className="text-sm font-bold text-blue-600 uppercase">{format(fecha, 'MMM', { locale: es })}</span>
                <span className="text-2xl font-extrabold text-gray-800">{format(fecha, 'dd')}</span>
                {!esSol && <span className="text-xs text-gray-500">{format(fecha, 'HH:mm')}h</span>}
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-900">{motivo}</h4>
                    <Badge variant={esSol ? 'outline' : (esPasada ? 'secondary' : 'default')} className="capitalize">
                        {esSol ? "Pendiente" : estado}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Mascota: <span className="font-medium text-gray-700">{nombreMascota || 'No especificada'}</span>
                </p>
                {esSol && franjaHoraria && <p className="text-xs text-amber-600 mt-1">Preferencia: {franjaHoraria}</p>}
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

  const [citasResult, solicitudesResult] = await Promise.all([
    supabase.from('citas').select(`*, pacientes (id, nombre)`).eq('propietario_id', user.id),
    supabase.from('solicitudes_cita_publica').select(`*`).eq('propietario_id', user.id).eq('estado', 'pendiente')
  ]);

  const citas = (citasResult.data as CitaConDetallesAnidados[]) || [];
  const solicitudes = (solicitudesResult.data as SolicitudCitaPublica[]) || [];

  const ahora = new Date();
  const proximasCitas = citas.filter((c) => new Date(c.fecha_hora_inicio) >= ahora);
  const citasPasadas = citas.filter((c) => new Date(c.fecha_hora_inicio) < ahora);
  
  // Función de ayuda para obtener la fecha de ordenación de forma segura
  const getSortDate = (item: CitaOSolicitud) => {
    if ('motivo_cita' in item && item.fecha_preferida) {
      return new Date(item.fecha_preferida);
    }
    return new Date((item as CitaConDetallesAnidados).fecha_hora_inicio);
  };

  const itemsProximos: CitaOSolicitud[] = [...solicitudes, ...proximasCitas].sort((a,b) => 
    getSortDate(a).getTime() - getSortDate(b).getTime()
  );

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Clock className="h-6 w-6 text-blue-600"/>
                        <div>
                            <CardTitle>Próximas Citas y Solicitudes</CardTitle>
                            <CardDescription>Tus siguientes visitas y solicitudes pendientes de confirmar.</CardDescription>
                        </div>
                    </div>
                    <Button asChild><Link href="/cuenta/citas/nueva"><PlusCircle className="mr-2 h-4 w-4"/>Solicitar Cita</Link></Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {itemsProximos.length > 0 ? (
                    <div>{itemsProximos.map(item => <CitaOSolicitudCard key={item.id} item={item} />)}</div>
                ) : (
                    <p className="text-center py-10 text-muted-foreground">No tienes próximas citas ni solicitudes.</p>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                 <div className="flex items-center gap-3"><CheckCircle className="h-6 w-6 text-green-600"/><div><CardTitle>Citas Anteriores</CardTitle><CardDescription>Tu historial de visitas a la clínica.</CardDescription></div></div>
            </CardHeader>
            <CardContent className="p-0">
                {citasPasadas.length > 0 ? (
                    <div>{citasPasadas.map(cita => <CitaOSolicitudCard key={cita.id} item={cita} />)}</div>
                ) : (
                    <p className="text-center py-10 text-muted-foreground">No tienes un historial de citas anteriores.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}