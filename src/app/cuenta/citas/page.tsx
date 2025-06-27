// src/app/cuenta/citas/page.tsx

import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, PawPrint, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- TIPOS DE DATOS CORREGIDOS ---
// Se añade 'paciente_nombre' que se rellenará después de las consultas.
type Cita = {
  id: string;
  fecha_hora_inicio: string;
  motivo: string | null;
  estado: string;
  paciente_id: string;
  paciente_nombre?: string; // Nombre de la mascota que se añadirá
};

// --- FUNCIÓN PARA OBTENER LAS CITAS (LÓGICA CORREGIDA) ---
async function getCitasForUser(userId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Obtener todas las mascotas del usuario y sus nombres
  const { data: pacientes, error: pacientesError } = await supabaseAdmin
    .from('pacientes')
    .select('id, nombre')
    .eq('propietario_id', userId);

  if (pacientesError) {
    console.error('Error al obtener las mascotas del usuario:', pacientesError);
    return [];
  }
  if (!pacientes || pacientes.length === 0) {
    return []; // El usuario no tiene mascotas
  }

  // Crear un mapa para buscar nombres de mascota por ID fácilmente
  const pacientesMap = new Map(pacientes.map(p => [p.id, p.nombre]));
  const pacienteIds = pacientes.map(p => p.id);

  // 2. Obtener todas las citas de esas mascotas
  const { data: citas, error: citasError } = await supabaseAdmin
    .from('citas')
    .select('id, fecha_hora_inicio, motivo, estado, paciente_id')
    .in('paciente_id', pacienteIds)
    .order('fecha_hora_inicio', { ascending: false });

  if (citasError) {
    console.error('Error al cargar las citas:', citasError);
    return [];
  }

  // 3. Unir la información: añadir el nombre de la mascota a cada cita
  const citasConNombre = citas.map(cita => ({
    ...cita,
    paciente_nombre: pacientesMap.get(cita.paciente_id) || 'Mascota no especificada',
  }));

  return citasConNombre as Cita[];
}


export default async function MisCitasPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const citas = await getCitasForUser(session.user.id);

  const ahora = new Date();

  const citasProximas = citas?.filter(c => new Date(c.fecha_hora_inicio) >= ahora) ?? [];
  const citasPasadas = citas?.filter(c => new Date(c.fecha_hora_inicio) < ahora) ?? [];

  const renderCita = (cita: Cita) => (
    <Card key={cita.id} className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <PawPrint className="h-5 w-5 text-blue-600" />
            {/* --- CORRECCIÓN: Se usa el campo 'paciente_nombre' --- */}
            <p className="font-bold text-lg text-gray-800">{cita.paciente_nombre}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(cita.fecha_hora_inicio), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(cita.fecha_hora_inicio), "HH:mm 'h'", { locale: es })}</span>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
           <p className="text-sm text-gray-500 capitalize">{cita.motivo || 'Cita general'}</p>
           <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              cita.estado === 'Confirmada' ? 'bg-green-100 text-green-800' : 
              cita.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>{cita.estado}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mis Citas</h1>
        <Button asChild>
          <Link href="/cuenta/citas/nueva">
            <PlusCircle className="mr-2 h-4 w-4" />
            Solicitar Nueva Cita
          </Link>
        </Button>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2 mb-4">Próximas Citas</h2>
          {citasProximas.length > 0 ? (
            <div className="space-y-4">
              {citasProximas.map(renderCita)}
            </div>
          ) : (
            <p className="text-gray-500">No tienes ninguna cita programada.</p>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2 mb-4">Citas Pasadas</h2>
          {citasPasadas.length > 0 ? (
            <div className="space-y-4">
              {citasPasadas.map(renderCita)}
            </div>
          ) : (
            <p className="text-gray-500">No tienes un historial de citas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
