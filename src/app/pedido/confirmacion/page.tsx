import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos de datos para el pedido
type ItemPedido = {
  cantidad: number;
  precio_unitario: number;
  productos_inventario: {
    nombre: string;
    imagenes: { url: string; isPrimary: boolean; order: number }[] | null;
  } | null;
};

type PedidoCompleto = {
  id: string;
  created_at: string;
  total: number;
  email_cliente: string;
  direccion_envio: {
    nombre_completo?: string; // Mantenemos compatibilidad con el tipo antiguo
    nombre?: string;
    apellidos?: string;
    direccion: string;
    localidad: string;
    provincia: string;
    codigo_postal: string;
  };
  items_pedido: ItemPedido[];
};

interface ConfirmationPageProps {
  searchParams: {
    orderId?: string;
  };
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { orderId } = searchParams;

  if (!orderId) {
    // Si no hay ID de pedido, redirigir a la página de inicio
    redirect('/');
  }

  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtenemos el pedido completo, incluyendo los artículos y los detalles de los productos
  const { data: order, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      created_at,
      total,
      email_cliente,
      direccion_envio,
      items_pedido (
        cantidad,
        precio_unitario,
        productos_inventario (
          nombre,
          imagenes
        )
      )
    `)
    .eq('id', orderId)
    .single<PedidoCompleto>();
  
  if (error || !order) {
    console.error("Error fetching order details:", error);
    notFound(); // Muestra una página 404 si el pedido no se encuentra
  }

  const direccion = order.direccion_envio;
  // Construye el nombre completo a partir de los datos guardados
  const nombreCompleto = direccion.nombre_completo || `${direccion.nombre || ''} ${direccion.apellidos || ''}`.trim();


  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">¡Gracias por tu pedido!</h1>
          <p className="mt-2 text-lg text-gray-600">
            Hemos recibido tu pedido y lo estamos preparando.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Número de pedido: <span className="font-medium text-gray-700">{order.id.substring(0, 8)}</span>
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Resumen de tu Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200">
              {order.items_pedido.map((item, index) => {
                const producto = item.productos_inventario;
                if (!producto) return null;
                const primaryImage = producto.imagenes?.find(img => img.isPrimary) || producto.imagenes?.[0];

                return (
                  <div key={index} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                        {primaryImage && (
                          <Image
                            src={primaryImage.url}
                            alt={producto.nombre}
                            width={64}
                            height={64}
                            className="object-cover rounded-md"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{producto.nombre}</p>
                        <p className="text-sm text-gray-500">
                          {item.cantidad} x {Number(item.precio_unitario).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {(item.cantidad * Number(item.precio_unitario)).toFixed(2)} €
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm">
               <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{order.total.toFixed(2)} €</span>
              </div>
               <div className="flex justify-between">
                <span className="text-gray-600">Envío:</span>
                <span className="font-medium text-gray-900">Gratis</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t mt-2">
                <span>Total:</span>
                <span>{order.total.toFixed(2)} €</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t pt-6">
                <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Dirección de envío</h3>
                    <address className="not-italic text-sm text-gray-600">
                        {nombreCompleto}<br/>
                        {direccion.direccion}<br/>
                        {direccion.codigo_postal} {direccion.localidad}, {direccion.provincia}
                    </address>
                </div>
                 <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Información de contacto</h3>
                     <p className="text-sm text-gray-600">{order.email_cliente}</p>
                </div>
            </div>

             <div className="mt-8 text-center">
                <Button asChild>
                    <Link href="/tienda">
                        <Home className="mr-2 h-4 w-4"/>
                        Seguir Comprando
                    </Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
