// app/dashboard/pedidos/[pedidoId]/editar/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import EditarPedidoForm from './EditarPedidoForm';
import type { Pedido } from '@/app/dashboard/pedidos/types';

interface EditarPedidoPageProps {
  params: { pedidoId: string };
}

export const dynamic = 'force-dynamic';

export default async function EditarPedidoPage({ params }: EditarPedidoPageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: order, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', params.pedidoId)
    .single<Pedido>();

  if (error || !order) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/pedidos/${params.pedidoId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Editar Pedido #{order.id.substring(0,8)}</h1>
      </div>
      <EditarPedidoForm pedido={order} />
    </div>
  );
}
