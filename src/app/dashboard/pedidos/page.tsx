import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, PlusCircle } from 'lucide-react';
import type { Pedido, PedidoParaTabla } from './types';
import PedidosTable from './PedidosTable';

// Tipo para la consulta a Supabase, que puede incluir un objeto 'propietarios'
type PedidoConPropietario = Pedido & {
  propietarios: {
    nombre_completo: string;
  } | null;
};

export const dynamic = 'force-dynamic';

export default async function PedidosPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtenemos los pedidos y hacemos un JOIN con la tabla propietarios
  const { data: pedidosCrudos, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      propietarios (
        nombre_completo
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching pedidos:", error);
    // Podríamos mostrar un mensaje de error más amigable aquí
  }
  
  // Procesamos los datos para la tabla
  const pedidosParaTabla: PedidoParaTabla[] = (pedidosCrudos as PedidoConPropietario[] || []).map(p => ({
    ...p,
    // Si hay un propietario asociado, usamos su nombre. Si no (invitado), usamos el nombre de la dirección de envío.
    nombre_cliente: p.propietarios?.nombre_completo || p.direccion_envio.nombre_completo || 'Cliente Invitado',
  }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
        {/* CORRECCIÓN: Botón habilitado y enlazado a la nueva página */}
        <Button asChild>
          <Link href="/dashboard/pedidos/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Pedido Manual
          </Link>
        </Button>
      </div>
      
      {pedidosParaTabla.length > 0 ? (
         <PedidosTable pedidos={pedidosParaTabla} />
      ) : (
        <div className="text-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-xl font-medium text-gray-900">Aún no hay pedidos</h3>
          <p className="mt-2 text-sm text-gray-500">
            Los pedidos de tu tienda online aparecerán aquí cuando se realicen.
          </p>
        </div>
      )}
    </div>
  );
}
