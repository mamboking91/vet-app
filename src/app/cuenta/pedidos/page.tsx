// src/app/cuenta/pedidos/page.tsx

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import type { Pedido, EstadoPedido } from '@/app/dashboard/pedidos/types';
import { cn } from '@/lib/utils'; // Importamos la utilidad cn

export const dynamic = 'force-dynamic';

// --- INICIO DE LA CORRECCIÓN ---
// Función para obtener la clase de color según el estado del pedido
const getStatusColor = (status: EstadoPedido) => {
    switch (status) {
      case 'procesando':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'enviado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pendiente_pago':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};
// --- FIN DE LA CORRECCIÓN ---


export default async function HistorialPedidosPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('propietario_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching user orders:", error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Historial de Pedidos</CardTitle>
        <CardDescription>Aquí puedes ver todos los pedidos que has realizado en nuestra tienda.</CardDescription>
      </CardHeader>
      <CardContent>
        {pedidos && pedidos.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido: Pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell className="font-medium">#{pedido.id.substring(0, 8)}</TableCell>
                  <TableCell>{format(new Date(pedido.created_at), 'dd MMM yyyy', { locale: es })}</TableCell>
                  <TableCell>
                    {/* --- INICIO DE LA CORRECCIÓN --- */}
                    <Badge variant="outline" className={cn("capitalize border", getStatusColor(pedido.estado))}>
                      {pedido.estado.replace('_', ' ')}
                    </Badge>
                    {/* --- FIN DE LA CORRECCIÓN --- */}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(pedido.total)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/cuenta/pedidos/${pedido.id}`}>Ver Detalles</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Aún no has realizado ningún pedido.</p>
            <Button asChild className="mt-4">
              <Link href="/tienda">Ir a la tienda</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}