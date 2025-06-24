import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import SolicitudesTable from './SolicitudesTable';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import type { SolicitudCitaPublica } from './types';

export const dynamic = 'force-dynamic';

export default async function SolicitudesCitasPage() {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    const { data, error } = await supabase
        .from('solicitudes_cita_publica')
        .select('*')
        .neq('estado', 'completada')
        .order('created_at', { ascending: false });
    
    // Mantenemos el manejo de errores por si la consulta falla
    if (error && error.code !== 'PGRST116') { // PGRST116 es un error "normal" si la tabla está vacía, lo ignoramos
        return <p className="text-red-500">Error al cargar las solicitudes: {error.message}</p>;
    }

    const solicitudes = (data as SolicitudCitaPublica[]) || [];
  
    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center gap-4 mb-8">
                <Mail className="h-8 w-8 text-blue-600"/>
                <div>
                    <h1 className="text-3xl font-bold">Buzón de Solicitudes de Cita</h1>
                    <p className="text-muted-foreground">Gestiona las nuevas solicitudes de citas de clientes.</p>
                </div>
            </div>
            
            <SolicitudesTable solicitudes={solicitudes} />
        </div>
    );
}