// app/dashboard/pedidos/nuevo/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import PedidoManualForm from './PedidoManualForm';
import type { Propietario } from '@/app/dashboard/propietarios/types'; // Importamos el tipo Propietario completo

// Forzamos el renderizado dinámico para asegurar que los datos siempre estén actualizados.
export const dynamic = 'force-dynamic';

export default async function NuevoPedidoPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtenemos los datos necesarios para los selectores del formulario en paralelo.
  const [clientesResult, productosResult] = await Promise.all([
    // AHORA SELECCIONAMOS TODOS LOS CAMPOS NECESARIOS DEL PROPIETARIO para el autocompletado.
    supabase
      .from('propietarios')
      .select('id, nombre_completo, email, telefono, direccion, localidad, provincia, codigo_postal')
      .order('nombre_completo', { ascending: true }),
    // Seleccionamos solo los productos que están marcados para venderse en la tienda.
    supabase
      .from('productos_inventario')
      .select('id, nombre, precio_venta, porcentaje_impuesto')
      .eq('en_tienda', true)
      .order('nombre', { ascending: true })
  ]);

  // Aseguramos que los datos de clientes coincidan con el tipo Propietario completo.
  // Si la consulta falla, pasamos un array vacío para evitar errores.
  const clientes = (clientesResult.data || []) as Propietario[];
  const productos = productosResult.data || [];
  
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/pedidos">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Crear Pedido Manual</h1>
      </div>
      
      {/* Pasamos los datos completos de los clientes y productos al formulario. */}
      {/* El formulario (PedidoManualForm) será un Componente de Cliente para manejar la interactividad. */}
      <PedidoManualForm clientes={clientes} productos={productos} />
    </div>
  );
}
