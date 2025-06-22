"use client";

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, User, Ghost } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PedidoParaTabla, EstadoPedido } from './types';

interface PedidosTableProps {
  pedidos: PedidoParaTabla[];
}

// Función para obtener el color de la insignia según el estado del pedido
const getStatusColor = (status: EstadoPedido) => {
  switch (status) {
    case 'procesando':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'enviado':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'completado':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'cancelado':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'pendiente_pago':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

export default function PedidosTable({ pedidos }: PedidosTableProps) {
  const router = useRouter();

  const handleViewDetails = (pedidoId: string) => {
    // Redirigiremos a una futura página de detalle del pedido
    // router.push(`/dashboard/pedidos/${pedidoId}`);
    alert(`Funcionalidad "Ver Detalles" para el pedido ${pedidoId} pendiente de implementar.`);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[120px]">Pedido ID</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => (
            <TableRow key={pedido.id} className="hover:bg-gray-50">
              <TableCell className="font-mono text-xs text-gray-600">
                #{pedido.id.substring(0, 8)}...
              </TableCell>
              <TableCell className="text-sm">
                {format(new Date(pedido.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    {pedido.propietario_id ? (
                        <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                        <Ghost className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="font-medium">{pedido.nombre_cliente}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(pedido.total)}
              </TableCell>
              <TableCell className="text-center">
                <Badge className={`capitalize ${getStatusColor(pedido.estado)}`}>
                  {pedido.estado.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => handleViewDetails(pedido.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}