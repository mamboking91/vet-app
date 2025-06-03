// src/lib/utils.ts (o app/lib/utils.ts)
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Función cn (esta probablemente ya la tienes si usas shadcn/ui)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- AÑADE ESTA FUNCIÓN ---
export function formatCurrency(amount: number | null | undefined, currency: string = 'EUR', locale: string = 'es-ES'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    // Puedes decidir qué devolver para valores no válidos:
    // return '-'; 
    // return 'N/A';
    // O un valor formateado de 0 para consistencia con el formato:
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(0);
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(amount);
}
// --------------------------

// Puedes añadir más funciones de utilidad aquí en el futuro