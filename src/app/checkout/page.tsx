import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
// CORRECCIÓN: Importamos el nuevo tipo 'Propietario'
import type { Propietario } from '@/app/dashboard/propietarios/types';
import CheckoutForm from './CheckoutForm';

export default async function CheckoutPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();

  // CORRECCIÓN: Usamos el tipo correcto 'Propietario'
  let userData: Propietario | null = null;
  if (user) {
    const { data } = await supabase
      .from('propietarios')
      .select('*')
      .eq('id', user.id)
      .single<Propietario>(); // CORRECCIÓN: Usamos el tipo correcto aquí también
    userData = data;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Finalizar Compra</h1>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
          Ya casi está. Revisa tu pedido y completa tus datos de envío.
        </p>
      </div>
      <CheckoutForm userData={userData} />
    </div>
  );
}
