// src/app/dashboard/pacientes/[pacienteId]/historial/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { tiposDeCitaOpciones } from "../../../citas/types";

const tiposDeCitaValues = tiposDeCitaOpciones.map(t => t.value) as [string, ...string[]];

// Esquema para un ítem consumido
const ConsumedItemSchema = z.object({
  producto_id: z.string().uuid("Producto inválido"),
  cantidad: z.coerce.number().positive("La cantidad del producto debe ser positiva."),
});

// Esquema para un procedimiento realizado
const PerformedProcedureSchema = z.object({
  procedimiento_id: z.string().uuid("Procedimiento inválido"),
  cantidad: z.coerce.number().positive("La cantidad del procedimiento debe ser positiva."),
});

// Esquema principal, ahora con las dos listas
const HistorialMedicoSchema = z.object({
  paciente_id: z.string().uuid("ID de paciente inválido."),
  fecha_evento: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Fecha inválida." }),
  tipo: z.enum(tiposDeCitaValues),
  descripcion: z.string().min(1, "La descripción es requerida."),
  diagnostico: z.string().transform(val => val === '' ? undefined : val).optional(),
  tratamiento_indicado: z.string().transform(val => val === '' ? undefined : val).optional(),
  notas_seguimiento: z.string().transform(val => val === '' ? undefined : val).optional(),
  consumed_items: z.string().transform((val, ctx) => {
    if (!val || val === '[]') return [];
    try {
      return z.array(ConsumedItemSchema).parse(JSON.parse(val));
    } catch (e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Los ítems consumidos tienen un formato inválido." });
      return z.NEVER;
    }
  }).optional(),
  procedimientos_realizados: z.string().transform((val, ctx) => {
    if (!val || val === '[]') return [];
    try {
      return z.array(PerformedProcedureSchema).parse(JSON.parse(val));
    } catch (e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Los procedimientos realizados tienen un formato inválido." });
      return z.NEVER;
    }
  }).optional(),
});


// --- ACCIÓN PARA AGREGAR UNA NUEVA ENTRADA ---
export async function agregarEntradaHistorial(formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = HistorialMedicoSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: { message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors } };
  }
  
  const { consumed_items, procedimientos_realizados, ...historialData } = validatedFields.data;

  const { data: nuevaEntrada, error: dbError } = await supabase
    .from("historiales_medicos")
    .insert([{ 
        ...historialData,
        procedimientos_realizados: procedimientos_realizados,
        veterinario_responsable_id: user.id 
    }])
    .select("id")
    .single();

  if (dbError || !nuevaEntrada) {
    return { success: false, error: { message: `Error al crear la entrada: ${dbError?.message}` } };
  }

  if (consumed_items && consumed_items.length > 0) {
    for (const item of consumed_items) {
      const { error: rpcError } = await supabase.rpc('consumir_producto_para_historial', {
        p_producto_id: item.producto_id,
        p_cantidad_a_consumir: item.cantidad,
        p_historial_id: nuevaEntrada.id
      });
      if (rpcError) {
        await supabase.from('historiales_medicos').delete().eq('id', nuevaEntrada.id);
        return { success: false, error: { message: `No se pudo guardar. Falló el descuento de stock: ${rpcError.message}.` }};
      }
    }
  }

  revalidatePath(`/dashboard/pacientes/${historialData.paciente_id}`);
  revalidatePath('/dashboard/inventario');
  return { success: true, data: nuevaEntrada };
}

// --- ACCIÓN PARA ACTUALIZAR UNA ENTRADA EXISTENTE ---
export async function actualizarEntradaHistorial(historialId: string, formData: FormData) {
  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: { message: "Usuario no autenticado." } };

  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = HistorialMedicoSchema.partial().safeParse(rawFormData);

  if (!validatedFields.success) {
    return { success: false, error: { message: "Error de validación al actualizar.", errors: validatedFields.error.flatten().fieldErrors } };
  }
  
  const { consumed_items, procedimientos_realizados, ...historialData } = validatedFields.data;

  // 1. Revertir consumos de stock anteriores para esta entrada
  const { error: revertError } = await supabase.rpc('revertir_consumo_por_historial', { p_historial_id: historialId });
  if (revertError) {
    return { success: false, error: { message: `Error al actualizar el inventario: ${revertError.message}` } };
  }

  // 2. Actualizar la entrada del historial con los nuevos datos
  const dataToUpdate = { ...historialData, updated_at: new Date().toISOString() };
  if (procedimientos_realizados !== undefined) {
    (dataToUpdate as any).procedimientos_realizados = procedimientos_realizados;
  }

  const { data: updatedEntry, error: updateError } = await supabase
    .from("historiales_medicos")
    .update(dataToUpdate)
    .eq("id", historialId)
    .select("id, paciente_id")
    .single();

  if (updateError) {
    // Aquí podrías intentar reaplicar el stock original, pero es complejo. Es mejor notificar el error.
    return { success: false, error: { message: `Error de BD al actualizar la entrada. El stock ha sido revertido, por favor, inténtelo de nuevo: ${updateError.message}` } };
  }

  // 3. Aplicar el nuevo consumo de inventario
  if (consumed_items && consumed_items.length > 0) {
    for (const item of consumed_items) {
      const { error: rpcError } = await supabase.rpc('consumir_producto_para_historial', {
        p_producto_id: item.producto_id,
        p_cantidad_a_consumir: item.cantidad,
        p_historial_id: historialId
      });
      if (rpcError) {
        return { success: false, error: { message: `Entrada actualizada, pero falló el nuevo descuento de stock: ${rpcError.message}. Revise el inventario.` } };
      }
    }
  }

  revalidatePath(`/dashboard/pacientes/${updatedEntry.paciente_id}`);
  revalidatePath('/dashboard/inventario');
  revalidatePath(`/dashboard/pacientes/${updatedEntry.paciente_id}/historial/${historialId}/editar`);
  return { success: true, data: updatedEntry };
}

// --- ACCIÓN PARA ELIMINAR UNA ENTRADA ---
export async function eliminarEntradaHistorial(historialId: string, pacienteId: string) {
    const cookieStore = cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    // Revertir stock asociado antes de eliminar
    const { error: revertError } = await supabase.rpc('revertir_consumo_por_historial', { p_historial_id: historialId });
    if (revertError) {
        return { success: false, error: { message: `No se pudo eliminar: Error al revertir el stock asociado. ${revertError.message}` } };
    }
    // Eliminar la entrada del historial
    const { error: dbError } = await supabase.from("historiales_medicos").delete().eq("id", historialId);
    if (dbError) {
        return { success: false, error: { message: `Stock revertido, pero error al eliminar la entrada del historial: ${dbError.message}`}};
    }
    revalidatePath(`/dashboard/pacientes/${pacienteId}`);
    revalidatePath('/dashboard/inventario');
    return { success: true, message: "Entrada de historial eliminada y stock revertido." };
}