"use client";

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarPlus, Mail, Phone, PawPrint, Inbox, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { type SolicitudCitaPublica, type EstadoSolicitud, estadosSolicitud } from './types';
import { actualizarEstadoSolicitud, convertirSolicitudACliente } from './actions';

interface SolicitudesTableProps {
  solicitudes: SolicitudCitaPublica[];
}

export default function SolicitudesTable({ solicitudes }: SolicitudesTableProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleStatusChange = (solicitudId: string, nuevoEstado: EstadoSolicitud) => {
    setProcessingId(solicitudId);
    const formData = new FormData();
    formData.append('estado', nuevoEstado);

    startTransition(async () => {
      const result = await actualizarEstadoSolicitud(solicitudId, formData);
      if (result.success) {
        toast.success("Estado de la solicitud actualizado.");
      } else {
        toast.error("Error al actualizar el estado.", { description: result.error?.message });
      }
      setProcessingId(null);
    });
  };

  const handleConvertir = (solicitudId: string) => {
    setProcessingId(solicitudId);
    startTransition(async () => {
        const result = await convertirSolicitudACliente(solicitudId);
        if (result.success) {
            toast.success("Cliente y mascota creados con éxito.");
            router.push(`/dashboard/citas/nueva?propietarioId=${result.propietarioId}&pacienteId=${result.pacienteId}&solicitudId=${solicitudId}`);
        } else {
            toast.error("Error en la conversión", { description: result.error?.message });
        }
        setProcessingId(null);
    });
  };
  
  if (solicitudes.length === 0) {
    return (
        <div className="text-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg">
          <Inbox className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-xl font-medium text-gray-900">Bandeja de entrada vacía</h3>
          <p className="mt-2 text-sm text-gray-500">No hay nuevas solicitudes de cita.</p>
        </div>
      );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Mascota</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {solicitudes.map(solicitud => (
          <TableRow key={solicitud.id} className={processingId === solicitud.id ? 'opacity-50' : ''}>
            <TableCell>
              {solicitud.propietario_id ? (
                <Link href={`/dashboard/propietarios/${solicitud.propietario_id}`} className="font-medium text-blue-600 hover:underline">{solicitud.nombre_cliente}</Link>
              ) : (<div className="font-medium">{solicitud.nombre_cliente}</div>)}
              <div className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3"/>{solicitud.email}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3"/>{solicitud.telefono}</div>
            </TableCell>
            <TableCell>
                {solicitud.paciente_id ? (
                   <Link href={`/dashboard/pacientes/${solicitud.paciente_id}`} className="font-medium text-blue-600 hover:underline flex items-center gap-2"><PawPrint className="h-4 w-4"/>{solicitud.nombre_mascota}</Link>
                ) : (<div className="font-medium flex items-center gap-2"><PawPrint className="h-4 w-4 text-blue-500"/>{solicitud.nombre_mascota}</div>)}
                <div className="text-xs text-muted-foreground pl-6">{solicitud.descripcion_mascota}</div>
            </TableCell>
            <TableCell className="max-w-xs truncate">{solicitud.motivo_cita}</TableCell>
            <TableCell>
              <Select defaultValue={solicitud.estado} onValueChange={(value) => handleStatusChange(solicitud.id, value as EstadoSolicitud)} disabled={isPending}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>{estadosSolicitud.map(estado => (<SelectItem key={estado} value={estado} className="capitalize">{estado}</SelectItem>))}</SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-right">
              {solicitud.propietario_id && solicitud.paciente_id ? (
                <Button asChild variant="outline" size="sm">
                  {/* CORRECCIÓN 2: Pasamos el ID de la solicitud para poder marcarla como gestionada */}
                  <Link href={`/dashboard/citas/nueva?propietarioId=${solicitud.propietario_id}&pacienteId=${solicitud.paciente_id}&solicitudId=${solicitud.id}`}>
                    <CalendarPlus className="mr-2 h-4 w-4"/>
                    Crear Cita
                  </Link>
                </Button>
              ) : (
                <Button variant="default" size="sm" onClick={() => handleConvertir(solicitud.id)} disabled={isPending}>
                  {isPending && processingId === solicitud.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>}
                  {isPending && processingId === solicitud.id ? 'Convirtiendo...' : 'Convertir y Citar'}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}