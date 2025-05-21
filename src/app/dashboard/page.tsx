// app/dashboard/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dog, Stethoscope, AlertTriangle } from 'lucide-react'; // Iconos

// Función para obtener el conteo de una tabla
async function getTableCount(supabase: any, tableName: string): Promise<number> {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true }); // head:true para no traer datos, solo el conteo

  if (error) {
    console.error(`Error counting ${tableName}:`, error);
    return 0;
  }
  return count || 0;
}

export const dynamic = 'force-dynamic'; // Asegura que los datos se obtengan en cada solicitud

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtener los conteos
  const [
    totalPropietarios,
    totalPacientes,
    totalHistoriales,
  ] = await Promise.all([
    getTableCount(supabase, 'propietarios'),
    getTableCount(supabase, 'pacientes'),
    getTableCount(supabase, 'historiales_medicos'),
    // Podrías añadir más conteos aquí en el futuro
  ]);

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard de la Clínica</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Propietarios
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPropietarios}</div>
            <p className="text-xs text-muted-foreground">
              Clientes registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pacientes
            </CardTitle>
            <Dog className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPacientes}</div>
            <p className="text-xs text-muted-foreground">
              Mascotas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Entradas de Historial
            </CardTitle>
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHistoriales}</div>
            <p className="text-xs text-muted-foreground">
              Registros médicos totales
            </p>
          </CardContent>
        </Card>
        
        {/* Placeholder para futuras tarjetas */}
        <Card className="border-dashed border-gray-300 dark:border-gray-700">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximas Citas (Hoy)
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              (Funcionalidad futura)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aquí podrías añadir secciones para gráficos o listas de actividad reciente en el futuro */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Actividad Reciente (Placeholder)</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Los gráficos y la actividad reciente se añadirán aquí.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}