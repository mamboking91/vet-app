// src/app/dashboard/pedidos/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, PlusCircle } from 'lucide-react';
import type { Pedido, PedidoParaTabla } from './types';
import PedidosTable from './PedidosTable';
import SearchInput from '@/components/ui/SearchInput';

type PedidoConPropietario = Pedido & {
  propietarios: {
    nombre_completo: string;
  } | null;
};

export const dynamic = 'force-dynamic';

interface PedidosPageProps {
  searchParams?: {
    q?: string;
  };
}

export default async function PedidosPage({ searchParams }: PedidosPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const searchQuery = searchParams?.q?.trim();

  let pedidosCrudos: PedidoConPropietario[] | null = null;
  let error: any = null;

  // --- INICIO DE LA CORRECCIÓN ---
  if (searchQuery) {
    // Si hay un término de búsqueda, llamamos a la función de la base de datos (RPC)
    const { data, error: rpcError } = await supabase
      .rpc('buscar_pedidos', { search_term: searchQuery })
      .select(`
          *,
          propietarios (
            nombre_completo
          )
        `);
    
    pedidosCrudos = data;
    error = rpcError;
  } else {
    // Si no hay búsqueda, obtenemos todos los pedidos como antes
    const { data, error: fetchError } = await supabase
      .from('pedidos')
      .select(`
        *,
        propietarios (
          nombre_completo
        )
      `)
      .order('created_at', { ascending: false });

    pedidosCrudos = data;
    error = fetchError;
  }
  // --- FIN DE LA CORRECCIÓN ---

  if (error) {
    console.error("Error fetching pedidos:", error);
  }
  
  const pedidosParaTabla: PedidoParaTabla[] = (pedidosCrudos || []).map(p => ({
    ...p,
    nombre_cliente: p.propietarios?.nombre_completo || p.direccion_envio?.nombre_completo || 'Cliente Invitado',
  }));

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
        <Button asChild>
          <Link href="/dashboard/pedidos/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Pedido Manual
          </Link>
        </Button>
      </div>
      
      <div className="mb-6">
        <SearchInput
            placeholder="Buscar por ID o cliente..."
            initialQuery={searchQuery || ''}
            queryParamName="q"
        />
      </div>

      {pedidosParaTabla.length > 0 ? (
         <PedidosTable pedidos={pedidosParaTabla} />
      ) : (
        <div className="text-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-xl font-medium text-gray-900">
            {searchQuery ? 'Sin resultados' : 'Aún no hay pedidos'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery 
              ? `No se encontraron pedidos que coincidan con "${searchQuery}".`
              : 'Los pedidos de tu tienda online aparecerán aquí cuando se realicen.'}
          </p>
        </div>
      )}
    </div>
  );
}