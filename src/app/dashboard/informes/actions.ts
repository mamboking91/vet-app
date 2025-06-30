"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { startOfDay, endOfDay } from 'date-fns';

// --- Interfaz para el Informe de Ventas (sin cambios) ---
export interface VentasReportData {
  totalFacturado: number;
  numeroFacturas: number;
  ventasPorDia: { fecha: string; total: number }[];
  error?: string;
}

// --- NUEVA Interfaz para el Informe de Top Items ---
export interface TopItem {
  descripcion: string;
  cantidadVendida: number;
  ingresosTotales: number;
}

export interface TopItemsReportData {
  topItems: TopItem[];
  error?: string;
}


// --- Función getVentasReport (sin cambios) ---
export async function getVentasReport(
  startDate: Date,
  endDate: Date
): Promise<VentasReportData> {
  // ... (código existente, no es necesario cambiarlo)
  try {
    const supabase = createServerActionClient({ cookies });

    const { data, error } = await supabase
      .from('facturas')
      .select('fecha_emision, total')
      .neq('estado', 'Anulada')
      .neq('estado', 'Borrador')
      .gte('fecha_emision', startDate.toISOString())
      .lte('fecha_emision', endOfDay(endDate).toISOString());

    if (error) throw new Error("No se pudieron obtener los datos de facturación.");
    if (!data) return { totalFacturado: 0, numeroFacturas: 0, ventasPorDia: [] };
    
    const totalFacturado = data.reduce((sum, f) => sum + f.total, 0);
    const numeroFacturas = data.length;
    const ventasDiarias: { [key: string]: number } = {};
    data.forEach(f => {
      const fecha = f.fecha_emision.split('T')[0];
      ventasDiarias[fecha] = (ventasDiarias[fecha] || 0) + f.total;
    });
    
    const ventasPorDia = Object.entries(ventasDiarias)
        .map(([fecha, total]) => ({ fecha, total }))
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return { totalFacturado, numeroFacturas, ventasPorDia };
  } catch (e: any) {
    return { 
        totalFacturado: 0, 
        numeroFacturas: 0, 
        ventasPorDia: [], 
        error: "Ocurrió un error al generar el informe de ventas." 
    };
  }
}


// --- NUEVA Función para obtener los ítems más vendidos ---
export async function getTopItemsReport(
    startDate: Date,
    endDate: Date
): Promise<TopItemsReportData> {
    try {
        const supabase = createServerActionClient({ cookies });

        // Hacemos una consulta a los items, uniéndolos con las facturas para filtrar por fecha y estado
        const { data, error } = await supabase
            .from('items_factura')
            .select(`
                descripcion,
                cantidad,
                total_item,
                facturas (
                    fecha_emision,
                    estado
                )
            `)
            .gte('facturas.fecha_emision', startDate.toISOString())
            .lte('facturas.fecha_emision', endOfDay(endDate).toISOString())
            .neq('facturas.estado', 'Anulada')
            .neq('facturas.estado', 'Borrador');

        if (error) {
            console.error("Error al obtener items de facturas:", error);
            throw new Error("No se pudieron obtener los datos de los ítems.");
        }

        if (!data) {
            return { topItems: [] };
        }

        // Agrupamos los datos por descripción
        const itemsAgrupados: { [key: string]: { cantidadVendida: number; ingresosTotales: number } } = {};
        
        data.forEach(item => {
            const desc = item.descripcion;
            if (!itemsAgrupados[desc]) {
                itemsAgrupados[desc] = { cantidadVendida: 0, ingresosTotales: 0 };
            }
            itemsAgrupados[desc].cantidadVendida += item.cantidad;
            itemsAgrupados[desc].ingresosTotales += item.total_item;
        });

        // Convertimos a array, ordenamos por ingresos y nos quedamos con el Top 10
        const topItems = Object.entries(itemsAgrupados)
            .map(([descripcion, { cantidadVendida, ingresosTotales }]) => ({
                descripcion,
                cantidadVendida,
                ingresosTotales
            }))
            .sort((a, b) => b.ingresosTotales - a.ingresosTotales)
            .slice(0, 10); // <-- Puedes ajustar el número de ítems a mostrar

        return { topItems };

    } catch (e: any) {
        console.error("Error inesperado en getTopItemsReport:", e);
        return { 
            topItems: [],
            error: "Ocurrió un error al generar el informe de ítems." 
        };
    }
}