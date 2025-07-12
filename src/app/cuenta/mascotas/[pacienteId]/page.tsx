// src/app/cuenta/mascotas/[pacienteId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Paciente, HistorialMedico } from '@/app/dashboard/pacientes/types';

interface DetalleMascotaProps {
  params: { pacienteId: string };
}

export default async function DetalleMascotaPage({ params }: DetalleMascotaProps) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtenemos los datos del paciente y su historial médico
  const { data: paciente, error } = await supabase
    .from('pacientes')
    .select(`*, historiales_medicos (*)`)
    .eq('id', params.pacienteId)
    .eq('propietario_id', user.id)
    .single<Paciente>();
  
  if (error || !paciente) {
    notFound();
  }

  // Ordenamos el historial por fecha, de más reciente a más antiguo
  const historiales = (paciente.historiales_medicos || []).sort((a: HistorialMedico, b: HistorialMedico) => {
      if (!a.fecha_evento || !b.fecha_evento) return 0;
      return new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime()
  });

  return (
    <div>
      <Button asChild variant="ghost" className="mb-4 -ml-4">
        <Link href="/cuenta/mascotas"><ChevronLeft className="mr-2 h-4 w-4"/> Volver a mis mascotas</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Historial Clínico de {paciente.nombre}</CardTitle>
          <CardDescription>Aquí puedes ver el registro de todas las visitas y tratamientos de tu mascota.</CardDescription>
        </CardHeader>
        <CardContent>
          {historiales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Diagnóstico / Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historiales.map((historial) => (
                  <TableRow key={historial.id}>
                    <TableCell className="font-medium">
                      {historial.fecha_evento 
                        ? format(new Date(historial.fecha_evento), "dd/MM/yyyy", { locale: es }) 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{historial.tipo || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{historial.diagnostico || historial.descripcion || 'Sin detalles.'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 flex flex-col items-center">
                <Stethoscope className="h-10 w-10 text-gray-300 mb-4"/>
                <p className="text-muted-foreground">No hay entradas en el historial clínico de {paciente.nombre}.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}