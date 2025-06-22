import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import PedidoManualForm from './PedidoManualForm';

export const dynamic = 'force-dynamic';

export default async function NuevoPedidoPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtenemos los datos necesarios para los selectores del formulario
  const [clientesResult, productosResult] = await Promise.all([
    supabase.from('propietarios').select('id, nombre_completo').order('nombre_completo', { ascending: true }),
    supabase.from('productos_inventario').select('id, nombre, precio_venta, porcentaje_impuesto').eq('en_tienda', true).order('nombre', { ascending: true })
  ]);

  const clientes = clientesResult.data || [];
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
      
      <PedidoManualForm clientes={clientes} productos={productos} />
    </div>
  );
}
