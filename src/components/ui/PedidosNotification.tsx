import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Badge } from '@/components/ui/badge';

export async function PedidosNotification() {
  const supabase = createServerComponentClient({ cookies });

  const { data: count, error } = await supabase.rpc('contar_pedidos_procesando');

  if (error || !count || count === 0) {
    return null;
  }

  return (
    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
      {count}
    </Badge>
  );
}