import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import type { Pedido } from '@/app/dashboard/pedidos/types';

type ItemPedido = {
  cantidad: number;
  precio_unitario: number;
  productos_inventario: {
    nombre: string;
    imagenes: { url: string }[] | null;
  } | null;
};

type PedidoCompleto = Pedido & { items_pedido: ItemPedido[] };

interface DetallePedidoClienteProps {
  params: { pedidoId: string };
}

export default async function DetallePedidoClientePage({ params }: DetallePedidoClienteProps) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select(`*, items_pedido (*, productos_inventario (nombre, imagenes))`)
    .eq('id', params.pedidoId)
    .eq('propietario_id', user.id) // ¡Importante! Filtro de seguridad
    .single<PedidoCompleto>();

  if (error || !pedido) {
    notFound();
  }

  const direccion = pedido.direccion_envio;

  return (
    <div>
      <Button asChild variant="ghost" className="mb-4 -ml-4">
        <Link href="/cuenta/pedidos"><ChevronLeft className="mr-2 h-4 w-4"/> Volver a mis pedidos</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Pedido #{pedido.id.substring(0, 8)}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Realizado el {format(new Date(pedido.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </CardHeader>
        <CardContent>
           <div className="divide-y divide-gray-200">
            {pedido.items_pedido.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                     {item.productos_inventario?.imagenes?.[0] && <Image src={item.productos_inventario.imagenes[0].url} alt={item.productos_inventario.nombre} width={64} height={64} className="object-cover rounded-md"/>}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{item.productos_inventario?.nombre}</p>
                    <p className="text-sm text-gray-500">{item.cantidad} x {formatCurrency(item.precio_unitario)}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-800">{formatCurrency(item.cantidad * item.precio_unitario)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between font-bold text-base pt-2">
              <span>Total:</span>
              <span>{formatCurrency(pedido.total)}</span>
            </div>
          </div>
          <div className="mt-8 border-t pt-6">
            <h3 className="font-semibold text-gray-800 mb-2">Enviado a</h3>
            <address className="not-italic text-sm text-gray-600">
                {direccion.nombre_completo}<br/>
                {direccion.direccion}<br/>
                {direccion.codigo_postal} {direccion.localidad}, {direccion.provincia}
            </address>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}