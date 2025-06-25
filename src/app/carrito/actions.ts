// src/app/carrito/actions.ts
"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { CodigoDescuento } from "../dashboard/descuentos/types";

interface AplicarCodigoResult {
    success: boolean;
    descuento?: CodigoDescuento;
    error?: { message: string };
}

// Esta acción valida un código de descuento y lo devuelve si es válido.
export async function aplicarCodigoDescuento(codigo: string, subtotal: number): Promise<AplicarCodigoResult> {
  if (!codigo) {
    return { success: false, error: { message: "Por favor, introduce un código." } };
  }

  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });
  
  const codigoUpper = codigo.toUpperCase();

  const { data: descuento, error: dbError } = await supabase
    .from('codigos_descuento')
    .select('*')
    .eq('codigo', codigoUpper)
    .single();

  if (dbError || !descuento) {
    return { success: false, error: { message: "El código de descuento no es válido." } };
  }

  // --- Realizar todas las validaciones ---
  if (!descuento.activo) {
    return { success: false, error: { message: "Este código ya no está activo." } };
  }
  if (descuento.fecha_expiracion && new Date(descuento.fecha_expiracion) < new Date()) {
    return { success: false, error: { message: "Este código ha expirado." } };
  }
  if (descuento.usos_maximos !== null && descuento.usos_actuales >= descuento.usos_maximos) {
    return { success: false, error: { message: "Este código ha alcanzado su límite de usos." } };
  }
  if (subtotal < descuento.compra_minima) {
    return { success: false, error: { message: `Necesitas una compra mínima de ${descuento.compra_minima}€ para usar este código.` } };
  }

  // Si todas las validaciones pasan, devolvemos el objeto del descuento.
  return { success: true, descuento: descuento as CodigoDescuento };
}
