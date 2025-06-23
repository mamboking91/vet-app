// app/dashboard/pedidos/[pedidoId]/editar/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import EditarPedidoForm from './EditarPedidoForm';
import type { Pedido } from '@/app/dashboard/pedidos/types';
import type { ProductoInventarioParaFactura } from '@/app/dashboard/facturacion/types';

interface EditarPedidoPageProps {
  params: { pedidoId: string };
}

export const dynamic = 'force-dynamic';

// --- CORRECCIÓN CLAVE AQUÍ ---
// Se añaden `precio_venta` y `porcentaje_impuesto` al tipo para que
// Next.js los pase correctamente del servidor al cliente.
type PedidoConItems = Pedido & {
  items_pedido: {
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
    productos_inventario: {
        nombre: string;
        precio_venta: number | null;
        porcentaje_impuesto: number | null;
    } | null;
  }[];
};

export default async function EditarPedidoPage({ params }: EditarPedidoPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtenemos el pedido, sus items y la lista de todos los productos en paralelo
  const [pedidoResult, productosResult] = await Promise.all([
    supabase
      .from('pedidos')
      .select(`
        *,
        items_pedido(
            producto_id,
            cantidad,
            precio_unitario,
            productos_inventario(nombre, precio_venta, porcentaje_impuesto)
        )
      `)
      .eq('id', params.pedidoId)
      .single<PedidoConItems>(),
    supabase
      .from('productos_inventario')
      .select('id, nombre, precio_venta, porcentaje_impuesto')
      .eq('en_tienda', true)
      .order('nombre', { ascending: true })
  ]);

  const { data: pedido, error } = pedidoResult;

  if (error || !pedido) {
    notFound();
  }

  // Solo se pueden editar pedidos en ciertos estados
  if (pedido.estado !== 'procesando' && pedido.estado !== 'pendiente_pago') {
    return (
        <div className="container mx-auto py-10 px-4 md:px-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pedido no editable</h2>
            <p className="text-muted-foreground mb-6">
              El pedido Nº {pedido.id.substring(0,8)} tiene estado "{pedido.estado}" y ya no puede ser modificado.
            </p>
            <Button asChild variant="outline">
                <Link href={`/dashboard/pedidos/${pedido.id}`}>Volver a Detalles del Pedido</Link>
            </Button>
        </div>
    );
  }

  const { data: productosDisponibles } = productosResult;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/pedidos/${params.pedidoId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Editar Pedido #{pedido.id.substring(0,8)}</h1>
      </div>
      <EditarPedidoForm 
        pedido={pedido} 
        productosDisponibles={(productosDisponibles || []) as ProductoInventarioParaFactura[]} 
      />
    </div>
  );
}