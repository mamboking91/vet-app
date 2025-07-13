// src/app/cuenta/facturacion/[facturaId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
// --- INICIO DE LA CORRECCIÓN ---
// Importamos los tipos base sin modificarlos
import type { FacturaHeaderFromDB, ItemFactura as BaseItemFactura } from '@/app/dashboard/facturacion/types';

// 1. Creamos un tipo local que extiende el tipo base con los campos que sabemos que existen
type ItemFacturaConDetalles = BaseItemFactura & {
  id: string;
  total_item: number;
};

// 2. Usamos este nuevo tipo para definir la estructura completa de la factura
type FacturaCompleta = FacturaHeaderFromDB & {
  items_factura: ItemFacturaConDetalles[];
  pacientes: { nombre: string } | null;
  propietarios: { nombre_completo: string } | null;
};
// --- FIN DE LA CORRECCIÓN ---

interface DetalleFacturaProps {
  params: { facturaId: string };
}

const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pagada': return 'bg-green-100 text-green-800';
      case 'Pagada Parcialmente': return 'bg-yellow-100 text-yellow-800';
      case 'Vencida': return 'bg-red-100 text-red-800';
      case 'Pendiente': return 'bg-blue-100 text-blue-800';
      case 'Anulada': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-700';
    }
};

export default async function DetalleFacturaClientePage({ params }: DetalleFacturaProps) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: factura, error } = await supabase
    .from('facturas')
    .select(`
        *,
        items_factura (*),
        pacientes (nombre),
        propietarios (nombre_completo)
    `)
    .eq('id', params.facturaId)
    .eq('propietario_id', user.id) 
    .single<FacturaCompleta>();

  if (error || !factura) {
    notFound();
  }

  return (
    <div>
      <Button asChild variant="ghost" className="mb-4 -ml-4">
        <Link href="/cuenta/mascotas">
            <ChevronLeft className="mr-2 h-4 w-4"/> Volver a mis mascotas
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start">
          <div>
            <CardTitle className="text-2xl">Factura #{factura.numero_factura}</CardTitle>
            <CardDescription>
              Emitida el {format(new Date(factura.fecha_emision), "dd MMMM yyyy", { locale: es })}
              {factura.pacientes && ` para ${factura.pacientes.nombre}`}
            </CardDescription>
          </div>
          <Badge className={`px-3 py-1 text-sm capitalize ${getStatusColor(factura.estado)}`}>
            {factura.estado}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="mt-6">
            <h3 className="font-semibold mb-4">Detalles de la Factura</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 3. El código de renderizado no necesita cambios, ya que ahora el tipo es correcto */}
                {factura.items_factura.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.descripcion}</TableCell>
                    <TableCell className="text-center">{item.cantidad}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.precio_unitario)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(item.total_item)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                    <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                    <TableCell className="text-right">{formatCurrency(factura.subtotal)}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan={3} className="text-right">Impuestos (IGIC)</TableCell>
                    <TableCell className="text-right">{formatCurrency(factura.monto_impuesto)}</TableCell>
                </TableRow>
                <TableRow className="text-lg font-bold">
                    <TableCell colSpan={3} className="text-right">Total Factura</TableCell>
                    <TableCell className="text-right">{formatCurrency(factura.total)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          {factura.notas_cliente && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold">Notas Adicionales</h4>
              <p className="text-sm text-muted-foreground mt-2">{factura.notas_cliente}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}