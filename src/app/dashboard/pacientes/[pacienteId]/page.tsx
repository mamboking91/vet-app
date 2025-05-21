// app/dashboard/pacientes/[pacienteId]/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
 import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { ChevronLeft, PlusCircle } from 'lucide-react'; // Iconos
import { format } from 'date-fns'; // Para formatear fechas
import { es } from 'date-fns/locale'; // Para formato de fecha en español

// Tipo para el paciente (puedes refinarlo o importarlo si ya lo tienes más completo)
type PacienteDetalle = {
  id: string;
  nombre: string;
  especie: string | null;
  raza: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  microchip_id: string | null;
  color: string | null;
  notas_adicionales: string | null;
  propietarios: { // Asumiendo que 'propietarios' es un objeto, como corregimos antes
    id: string;
    nombre_completo: string | null;
  } | null;
};

// Tipo para una entrada del historial médico
type HistorialMedicoEntrada = {
  id: string;
  fecha_evento: string; // Viene como string de la BD, la formatearemos
  tipo: string; // El ENUM se leerá como string
  descripcion: string;
  diagnostico: string | null;
  tratamiento_indicado: string | null;
  notas_seguimiento: string | null;
};

interface DetallePacientePageProps {
  params: {
    pacienteId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function DetallePacientePage({ params }: DetallePacientePageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { pacienteId } = params;

  // 1. Obtener datos del paciente (incluyendo el propietario)
  const { data: pacienteData, error: pacienteError } = await supabase
    .from('pacientes')
    .select(`
      *,
      propietarios (id, nombre_completo)
    `)
    .eq('id', pacienteId)
    .single();

  if (pacienteError || !pacienteData) {
    console.error("Error fetching paciente details or paciente not found:", pacienteError);
    notFound();
  }
  const paciente = pacienteData as PacienteDetalle; // Type assertion

  // 2. Obtener el historial médico del paciente
  const { data: historialData, error: historialError } = await supabase
    .from('historiales_medicos')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha_evento', { ascending: false }); // Más recientes primero

  if (historialError) {
    console.error("Error fetching medical history:", historialError);
    // No hacemos notFound() aquí, el paciente existe, pero podríamos mostrar un error de historial
  }
  const historial = (historialData || []) as HistorialMedicoEntrada[];

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/dashboard/pacientes">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Detalles de: {paciente.nombre}</h1>
        <Button asChild className="ml-auto">
          <Link href={`/dashboard/pacientes/${pacienteId}/editar`}>
            Editar Paciente
          </Link>
        </Button>
      </div>

      {/* Tarjeta de Información del Paciente */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Información del Paciente</CardTitle>
          {paciente.propietarios?.nombre_completo && (
            <CardDescription>
              Propietario: 
              <Link href={`/dashboard/propietarios/${paciente.propietarios.id}/editar`} className="text-blue-600 hover:underline ml-1">
                 {paciente.propietarios.nombre_completo}
              </Link>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div><strong>Especie:</strong> {paciente.especie || 'N/A'}</div>
          <div><strong>Raza:</strong> {paciente.raza || 'N/A'}</div>
          <div><strong>Fecha de Nacimiento:</strong> {paciente.fecha_nacimiento ? format(new Date(paciente.fecha_nacimiento), 'PPP', { locale: es }) : 'N/A'}</div>
          <div><strong>Sexo:</strong> {paciente.sexo || 'N/A'}</div>
          <div><strong>Microchip:</strong> {paciente.microchip_id || 'N/A'}</div>
          <div><strong>Color:</strong> {paciente.color || 'N/A'}</div>
          {paciente.notas_adicionales && (
            <div className="md:col-span-2 lg:col-span-3"><strong>Notas Adicionales:</strong> {paciente.notas_adicionales}</div>
          )}
        </CardContent>
      </Card>

      {/* Sección de Historial Médico */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-semibold">Historial Médico</h2>
        <Button asChild>
          {/* Enlazará a la página/modal para añadir nueva entrada */}
          <Link href={`/dashboard/pacientes/${pacienteId}/historial/nuevo`}> 
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Entrada
          </Link>
        </Button>
      </div>

      {historialError && <p className="text-red-500">Error al cargar el historial médico: {historialError.message}</p>}
      
      {historial.length === 0 && !historialError && (
        <p className="text-gray-500">Este paciente aún no tiene entradas en su historial médico.</p>
      )}

      {historial.length > 0 && (
        <Card>
          <CardContent className="p-0"> {/* Quitamos padding para que la tabla ocupe todo */}
            <Table>
              <TableCaption className="mt-4">Registros del historial médico de {paciente.nombre}.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Evento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="hidden md:table-cell">Diagnóstico</TableHead>
                  <TableHead className="hidden lg:table-cell">Tratamiento</TableHead>
                  {/* <TableHead className="text-right">Acciones</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {historial.map((entrada) => (
                  <TableRow key={entrada.id}>
                    <TableCell>{format(new Date(entrada.fecha_evento), 'PPP', { locale: es })}</TableCell>
                    <TableCell>{entrada.tipo}</TableCell>
                    <TableCell className="max-w-xs truncate" title={entrada.descripcion}>{entrada.descripcion}</TableCell>
                    <TableCell className="hidden md:table-cell">{entrada.diagnostico || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{entrada.tratamiento_indicado || '-'}</TableCell>
                    {/* <TableCell className="text-right">
                      <Button variant="outline" size="sm">Ver/Editar</Button>
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}