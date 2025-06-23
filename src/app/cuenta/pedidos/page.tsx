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
import type { Pedido } from '@/app/dashboard/pedidos/types';

export const dynamic = 'force-dynamic';

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
                  <TableCell><Badge variant="secondary" className="capitalize">{pedido.estado.replace('_', ' ')}</Badge></TableCell>
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