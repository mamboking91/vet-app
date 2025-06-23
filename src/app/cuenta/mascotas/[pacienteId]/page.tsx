import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft } from 'lucide-react';
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

  const { data: paciente, error } = await supabase
    .from('pacientes')
    .select(`*, historiales_medicos (*)`)
    .eq('id', params.pacienteId)
    .eq('propietario_id', user.id)
    .single<Paciente>();
  
  if (error || !paciente) {
    notFound();
  }

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
                    {/* --- CORRECCIONES EN LOS CAMPOS --- */}
                    <TableCell>
                      {historial.fecha_evento 
                        ? format(new Date(historial.fecha_evento), "dd/MM/yyyy", { locale: es }) 
                        : 'Fecha no registrada'}
                    </TableCell>
                    <TableCell className="font-medium">{historial.tipo || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{historial.diagnostico || historial.descripcion || 'Sin detalles.'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No hay entradas en el historial clínico de {paciente.nombre}.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}