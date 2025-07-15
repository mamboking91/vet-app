"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Tipos de datos que los formularios enviarán.
export type MedicionFormData = {
    fecha_medicion: Date;
    peso?: string;
    temperatura?: string;
    frecuencia_cardiaca?: string;
    frecuencia_respiratoria?: string;
    mucosas?: string;
    notas?: string;
};
export type CondicionesFormData = { condiciones_medicas_preexistentes?: string };
export type RecordatorioFormData = { tipo: string, fecha_proxima: Date, notas?: string };

// --- ACCIONES ---

// --- INICIO DE LA CORRECCIÓN ---
// La acción ahora siempre devuelve un objeto de error con una propiedad `message`.
export async function actualizarCondicionesMedicas(pacienteId: string, data: CondicionesFormData) {
  const supabase = createServerActionClient({ cookies: () => cookies() });
  const { error } = await supabase
    .from('pacientes')
    .update({ condiciones_medicas_preexistentes: data.condiciones_medicas_preexistentes || null })
    .eq('id', pacienteId);

  if (error) {
      // Devolvemos un objeto de error estandarizado.
      return { success: false, error: { message: `Error de base de datos: ${error.message}` } };
  }
  revalidatePath(`/dashboard/pacientes/${pacienteId}`);
  return { success: true };
}
// --- FIN DE LA CORRECCIÓN ---


export async function agregarMedicion(pacienteId: string, data: MedicionFormData) {
    const supabase = createServerActionClient({ cookies: () => cookies() });
    try {
        const dataToInsert: { [key: string]: any } = {
            paciente_id: pacienteId,
            fecha_medicion: data.fecha_medicion.toISOString(),
        };
        const addNumericField = (key: string, value: string | undefined) => {
            if (value && value.trim() !== "") {
                const num = parseFloat(value.replace(',', '.'));
                if (!isNaN(num)) { dataToInsert[key] = num; }
            }
        };
        addNumericField('peso', data.peso);
        addNumericField('temperatura', data.temperatura);
        addNumericField('frecuencia_cardiaca', data.frecuencia_cardiaca);
        addNumericField('frecuencia_respiratoria', data.frecuencia_respiratoria);

        if (data.mucosas && data.mucosas.trim() !== "") { dataToInsert.mucosas = data.mucosas; }
        if (data.notas && data.notas.trim() !== "") { dataToInsert.notas = data.notas; }

        const { error } = await supabase.from('mediciones_paciente').insert(dataToInsert);
        if (error) { return { success: false, error: { message: `Error de base de datos: ${error.message}` } }; }
        revalidatePath(`/dashboard/pacientes/${pacienteId}`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: { message: `Ha ocurrido un error inesperado: ${e.message}` } };
    }
}


export async function agregarRecordatorio(pacienteId: string, data: RecordatorioFormData) {
    const supabase = createServerActionClient({ cookies: () => cookies() });
    const { error } = await supabase.from('recordatorios_salud').insert({ paciente_id: pacienteId, ...data });
    if (error) { return { success: false, error: { message: `Error al crear recordatorio: ${error.message}` } }; }
    revalidatePath(`/dashboard/pacientes/${pacienteId}`);
    revalidatePath('/cuenta');
    return { success: true };
}

export async function marcarRecordatorioCompletado(recordatorioId: string, completado: boolean, pacienteId: string) {
    const supabase = createServerActionClient({ cookies: () => cookies() });
    const { error } = await supabase.from('recordatorios_salud').update({ completado }).eq('id', recordatorioId);
    if (error) { return { success: false, error: { message: `Error al actualizar recordatorio: ${error.message}` } }; }
    revalidatePath(`/dashboard/pacientes/${pacienteId}`);
    revalidatePath('/cuenta');
    return { success: true };
}

export async function eliminarRecordatorio(recordatorioId: string, pacienteId: string) {
    const supabase = createServerActionClient({ cookies: () => cookies() });
    const { error } = await supabase.from('recordatorios_salud').delete().eq('id', recordatorioId);
    if (error) { return { success: false, error: { message: `Error al eliminar recordatorio: ${error.message}` } }; }
    revalidatePath(`/dashboard/pacientes/${pacienteId}`);
    revalidatePath('/cuenta');
    return { success: true };
}

export async function eliminarMedicion(medicionId: string, pacienteId: string) {
    const supabase = createServerActionClient({ cookies: () => cookies() });
    const { error } = await supabase.from('mediciones_paciente').delete().eq('id', medicionId);
    if (error) { return { success: false, error: { message: `Error al eliminar medición: ${error.message}` } }; }
    revalidatePath(`/dashboard/pacientes/${pacienteId}`);
    return { success: true };
}