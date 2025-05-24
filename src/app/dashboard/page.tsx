// app/dashboard/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Dog, Stethoscope, CalendarCheck, BarChart3 } from 'lucide-react';
import { format, startOfToday, endOfTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import EspeciesChart from './EspeciesChart'; // Crearemos este componente cliente para el gráfico

// Tipos para el dashboard (puedes moverlos a un archivo types.ts si prefieres)
type PacienteInfoCruda = {
  nombre: string | null;
};

type ProximaCitaCruda = {
  id: string;
  fecha_hora_inicio: string;
  motivo: string | null;
  tipo: string | null;
  pacientes: PacienteInfoCruda[] | null;
};

type ProximaCitaProcesada = {
  id: string;
  fecha_hora_inicio: string;
  motivo: string | null;
  tipo: string | null;
  paciente_nombre: string | null;
};

// Tipo para los datos del gráfico de especies
export type EspecieData = {
  name: string; // Nombre de la especie
  value: number; // Conteo
};

async function getTableCount(supabaseClient: any, tableName: string): Promise<number> {
  const { count, error } = await supabaseClient
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  if (error) {
    console.error(`Error counting ${tableName}:`, error);
    return 0;
  }
  return count || 0;
}

// Nueva función para obtener y procesar la distribución de especies
async function getEspeciesDistribution(supabaseClient: any): Promise<EspecieData[]> {
  const { data: pacientes, error } = await supabaseClient
    .from('pacientes')
    .select('especie');

  if (error) {
    console.error('Error fetching especies de pacientes:', error);
    return [];
  }

  if (!pacientes) {
    return [];
  }

  const counts: { [key: string]: number } = {};
  for (const paciente of pacientes) {
    const especie = paciente.especie || 'Desconocida'; // Agrupa nulos/vacíos como 'Desconocida'
    counts[especie] = (counts[especie] || 0) + 1;
  }

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}


export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const [
    totalPropietarios,
    totalPacientes,
    totalHistoriales,
    especiesDistribution, // Nuevo dato para el gráfico
  ] = await Promise.all([
    getTableCount(supabase, 'propietarios'),
    getTableCount(supabase, 'pacientes'),
    getTableCount(supabase, 'historiales_medicos'),
    getEspeciesDistribution(supabase), // Llamamos a la nueva función
  ]);

  // ... (Lógica para Próximas Citas como antes)
  const hoyInicio = startOfToday().toISOString();
  const mananaFin = endOfTomorrow().toISOString();
  const { data: proximasCitasData, error: citasError } = await supabase
    .from('citas')
    .select('id, fecha_hora_inicio, motivo, tipo, pacientes (nombre)')
    .gte('fecha_hora_inicio', hoyInicio)
    .lte('fecha_hora_inicio', mananaFin)
    .in('estado', ['Programada', 'Confirmada'])
    .order('fecha_hora_inicio', { ascending: true })
    .limit(5); 

  const citasCrudas = (proximasCitasData || []) as ProximaCitaCruda[];
  const proximasCitas: ProximaCitaProcesada[] = citasCrudas.map(citaCruda => {
    const pacienteInfo = (citaCruda.pacientes && citaCruda.pacientes.length > 0) 
      ? citaCruda.pacientes[0] 
      : null;
    return {
      id: citaCruda.id,
      fecha_hora_inicio: citaCruda.fecha_hora_inicio,
      motivo: citaCruda.motivo,
      tipo: citaCruda.tipo,
      paciente_nombre: pacienteInfo?.nombre || null, 
    };
  });


  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard de la Clínica</h1>

      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* ... Tarjetas de conteo ... */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Propietarios</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPropietarios}</div><p className="text-xs text-muted-foreground">Clientes registrados</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Dog className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPacientes}</div><p className="text-xs text-muted-foreground">Mascotas registradas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas de Historial</CardTitle>
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalHistoriales}</div><p className="text-xs text-muted-foreground">Registros médicos</p></CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          {/* ... Tarjeta de Próximas Citas ... */}
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarCheck className="h-5 w-5 mr-2 text-primary" />Próximas Citas (Hoy y Mañana)</CardTitle>
            <CardDescription>{proximasCitas.length > 0 ? `Mostrando las siguientes ${proximasCitas.length} citas.` : "No hay citas programadas para hoy o mañana."}</CardDescription>
          </CardHeader>
          <CardContent>
            {citasError && <p className="text-sm text-red-500">Error al cargar próximas citas.</p>}
            {proximasCitas.length > 0 ? (
              <ul className="space-y-3">
                {proximasCitas.map(cita => (
                  <li key={cita.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Link href={`/dashboard/citas/${cita.id}/editar`} className="block group">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-primary group-hover:underline">{cita.paciente_nombre || 'Paciente no especificado'}</span>
                        <span className="text-xs text-muted-foreground">{format(parseISO(cita.fecha_hora_inicio), 'Pp', { locale: es })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{cita.tipo || cita.motivo || 'Cita programada'}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (!citasError && <p className="text-sm text-muted-foreground">No hay citas próximas.</p>)}
             {proximasCitas.length > 0 && (<Button variant="link" asChild className="mt-4 px-0"><Link href="/dashboard/citas">Ver todas las citas</Link></Button>)}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary"/>
                Distribución de Especies
            </CardTitle>
            <CardDescription>Conteo de pacientes por especie.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Aquí renderizaremos el componente del gráfico */}
            {especiesDistribution.length > 0 ? (
              <EspeciesChart data={especiesDistribution} />
            ) : (
              <p className="text-muted-foreground">No hay datos de especies para mostrar.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}