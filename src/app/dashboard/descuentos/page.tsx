// src/app/dashboard/descuentos/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, TicketPercent } from 'lucide-react';
import DescuentosTable from './DescuentosTable';
import type { CodigoDescuento } from './types';

export const dynamic = 'force-dynamic';

export default async function DescuentosPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: descuentos, error } = await supabase
    .from('codigos_descuento')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching discount codes:", error);
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <TicketPercent className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">Códigos de Descuento</h1>
            <p className="text-muted-foreground">Crea y gestiona los cupones para tu tienda.</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/descuentos/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo Código
          </Link>
        </Button>
      </div>
      
      <DescuentosTable descuentos={(descuentos as CodigoDescuento[]) || []} />
    </div>
  );
}
