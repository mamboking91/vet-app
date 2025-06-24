"use server";

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { estadosSolicitud } from './types';

// La función actualizarEstadoSolicitud se mantiene igual
export async function actualizarEstadoSolicitud(solicitudId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "No autenticado." }};
  const { data: profile } = await supabase.from('propietarios').select('rol').eq('id', user.id).single();
  if (profile?.rol !== 'administrador') return { success: false, error: { message: "No autorizado." }};
  const validatedFields = z.object({ estado: z.enum(estadosSolicitud) }).safeParse({ estado: formData.get('estado') });
  if (!validatedFields.success) return { success: false, error: { message: "Estado inválido." } };
  const { error } = await supabase.from('solicitudes_cita_publica').update({ estado: validatedFields.data.estado }).eq('id', solicitudId);
  if (error) return { success: false, error: { message: `Error al actualizar: ${error.message}` } };
  revalidatePath('/dashboard/solicitudes-citas');
  return { success: true };
}

// --- ACCIÓN PARA CONVERTIR UNA SOLICITUD (CORREGIDA) ---
export async function convertirSolicitudACliente(solicitudId: string) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: solicitud, error: solicitudError } = await supabase.from('solicitudes_cita_publica').select('*').eq('id', solicitudId).single();
  if (solicitudError || !solicitud) return { success: false, error: { message: "Solicitud no encontrada." }};
  if (solicitud.propietario_id) return { success: false, error: { message: "Esta solicitud ya pertenece a un cliente registrado." }};

  let propietarioId: string | null = null;
  const { data: propietarioExistente } = await supabase.from('propietarios').select('id').eq('email', solicitud.email).single();

  if (propietarioExistente) {
    propietarioId = propietarioExistente.id;
  } else {
    const { data: nuevoPropietario, error: propietarioError } = await supabase.from('propietarios').insert({
        nombre_completo: solicitud.nombre_cliente, email: solicitud.email, telefono: solicitud.telefono,
    }).select('id').single();
    if (propietarioError) return { success: false, error: { message: `Error creando propietario: ${propietarioError.message}` }};
    propietarioId = nuevoPropietario.id;
  }
  
  if (!propietarioId) return { success: false, error: { message: "No se pudo obtener un ID de propietario." }};

  const { data: nuevoPaciente, error: pacienteError } = await supabase.from('pacientes').insert({
    nombre: solicitud.nombre_mascota,
    propietario_id: propietarioId,
    // --- CORRECCIÓN AQUÍ: Añadimos un valor por defecto para 'especie' ---
    especie: 'No especificada',
    notas_adicionales: `Especie/raza: ${solicitud.descripcion_mascota || 'No especificado'}. Creado desde solicitud pública.`
  }).select('id').single();
    
  if (pacienteError) return { success: false, error: { message: `Error creando paciente: ${pacienteError.message}` } };

  await supabase.from('solicitudes_cita_publica').update({
    propietario_id: propietarioId,
    paciente_id: nuevoPaciente.id,
    estado: 'contactado',
  }).eq('id', solicitudId);

  revalidatePath('/dashboard/solicitudes-citas');
  revalidatePath('/dashboard/propietarios');
  revalidatePath('/dashboard/pacientes');

  return { 
    success: true, 
    propietarioId: propietarioId, 
    pacienteId: nuevoPaciente.id 
  };
}