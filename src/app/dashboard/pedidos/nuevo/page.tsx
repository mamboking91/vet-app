// app/dashboard/pedidos/nuevo/page.tsx

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import PedidoManualForm from './PedidoManualForm';
import type { Propietario } from '@/app/dashboard/propietarios/types';

// Tipos de datos que se pasarán al formulario
type ProductoParaSelector = {
  id: string; // ID de la variante
  nombre: string; // Nombre combinado (Producto + Variante)
  precio_venta: number | null;
  porcentaje_impuesto: number;
};

// Función para formatear los atributos de una variante en un string legible
const formatAtributos = (atributos: any): string => {
    if (!atributos || typeof atributos !== 'object' || Object.keys(atributos).length === 0) {
        return 'Variante';
    }
    return Object.entries(atributos)
        .map(([key, value]) => `${value}`)
        .join(', ');
};


export default async function NuevoPedidoManualPage() {
  const supabase = createServerComponentClient({ cookies: () => cookies() });

  const [clientesResult, productosResult] = await Promise.all([
    supabase
      .from('propietarios')
      .select('*')
      .order('nombre_completo', { ascending: true }),
    
    // =====> INICIO DE LA CORRECCIÓN 1: Usar la relación correcta 'productos_catalogo' <=====
    supabase
      .from('producto_variantes')
      .select(`
        id,
        precio_venta,
        atributos,
        productos_catalogo (
          nombre,
          porcentaje_impuesto
        )
      `)
      .order('created_at', { ascending: false })
    // =====> FIN DE LA CORRECCIÓN 1 <=====
  ]);

  if (clientesResult.error || productosResult.error) {
    return (
      <div className="container mx-auto py-10 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Error al Cargar Datos</h2>
        <p className="text-muted-foreground">
          No se pudieron cargar los clientes o productos. Error: {clientesResult.error?.message || productosResult.error?.message}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/pedidos">Volver a Pedidos</Link>
        </Button>
      </div>
    );
  }

  const clientes: Propietario[] = clientesResult.data || [];
  
  const productos: ProductoParaSelector[] = (productosResult.data || []).map((variante: any) => {
    const nombreProducto = variante.productos_catalogo?.nombre || 'Producto sin nombre';
    const nombreVariante = formatAtributos(variante.atributos);
    return {
      id: variante.id,
      nombre: `${nombreProducto} (${nombreVariante})`,
      precio_venta: variante.precio_venta,
      porcentaje_impuesto: variante.productos_catalogo?.porcentaje_impuesto || 0,
    }
  });

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/pedidos"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-3xl font-bold">Crear Pedido Manual</h1>
      </div>
      
      <PedidoManualForm clientes={clientes} productos={productos} />
    </div>
  );
}
