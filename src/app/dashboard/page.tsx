// src/app/dashboard/page.tsx

import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Users, Dog, Stethoscope, AlertCircle, LucidePackageSearch, 
    TrendingUp, ShoppingCart
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import EspeciesChart from './EspeciesChart'; 
import { formatCurrency } from '@/lib/utils';
import { CalendarClockIcon } from 'lucide-react';

// --- TIPOS DE DATOS PARA EL DASHBOARD ---
export type EspecieData = { name: string; value: number };
type ProximaCita = { id: string; fecha_hora_inicio: string; motivo: string; paciente_nombre: string };
type ProductoStockBajo = { id: string; nombre: string; stock_total: number; stock_minimo: number | null; };
type LoteProximoACaducar = { id: string; numero_lote: string; fecha_caducidad: string; producto_id: string; producto_nombre: string; };

// CORRECCIÓN: Aseguramos que el tipo coincida 100% con la función SQL
type BestSeller = { 
  producto_id: string; 
  nombre: string;
  cantidad_vendida: number;
  imagen_url: string | null;
};

type NewCustomer = { id: string; nombre_completo: string; created_at: string };


async function getDashboardData(supabase: any) {
    const startOfCurrentMonth = startOfMonth(new Date());
    const endOfCurrentMonth = endOfMonth(new Date());
    
    const [
        propietariosResult, 
        pacientesResult, 
        especiesResult, 
        citasResult,
        lotesResult, 
        salesResult, 
        pedidosResult,
        bestSellersResult, 
        newCustomersResult,
        lowStockResult,
    ] = await Promise.all([
        supabase.from('propietarios').select('id', { count: 'exact', head: true }),
        supabase.from('pacientes').select('id', { count: 'exact', head: true }),
        supabase.from('pacientes').select('especie'),
        supabase.from('citas').select('id, fecha_hora_inicio, motivo, tipo, pacientes(nombre)').gte('fecha_hora_inicio', new Date().toISOString()).order('fecha_hora_inicio', { ascending: true }).limit(5),
        supabase.rpc('get_expiring_lots'),
        supabase.from('facturas').select('total').gte('fecha_emision', startOfCurrentMonth.toISOString()).lte('fecha_emision', endOfCurrentMonth.toISOString()).eq('estado', 'Pagada'),
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).gte('fecha_pedido', startOfCurrentMonth.toISOString()).lte('fecha_pedido', endOfCurrentMonth.toISOString()),
        supabase.rpc('get_best_selling_products', { 
            start_date: startOfCurrentMonth.toISOString().split('T')[0], 
            end_date: endOfCurrentMonth.toISOString().split('T')[0] 
        }),
        supabase.from('propietarios').select('id, nombre_completo, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.rpc('get_low_stock_products')
    ]);

    const totalPropietarios = propietariosResult.count || 0;
    const totalPacientes = pacientesResult.count || 0;

    const especiesCounts = (especiesResult.data || []).reduce((acc: any, p: { especie: string | null }) => {
        const especie = p.especie || 'Desconocida';
        acc[especie] = (acc[especie] || 0) + 1;
        return acc;
    }, {});
    const especiesDistribution: EspecieData[] = Object.entries(especiesCounts).map(([name, value]) => ({ name, value: value as number }));
    
    const proximasCitas: ProximaCita[] = (citasResult.data || []).map((c: any) => ({
        id: c.id,
        fecha_hora_inicio: c.fecha_hora_inicio,
        motivo: c.tipo || c.motivo || 'Cita Programada',
        paciente_nombre: c.pacientes?.nombre || 'N/A'
    }));

    const productosStockBajo: ProductoStockBajo[] = lowStockResult.data || [];
    const lotesProximosACaducar: LoteProximoACaducar[] = lotesResult.data || [];
    
    const totalIngresos = (salesResult.data || []).reduce((sum: number, f: { total: number }) => sum + f.total, 0);
    const totalPedidos = pedidosResult.count || 0;

    const bestSellers: BestSeller[] = bestSellersResult.data || [];
    const newCustomers: NewCustomer[] = newCustomersResult.data || [];

    return {
        totalPropietarios, totalPacientes, especiesDistribution, proximasCitas, productosStockBajo,
        lotesProximosACaducar, totalIngresos, totalPedidos, bestSellers, newCustomers
    };
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const supabase = createServerComponentClient({ cookies: () => cookies() });

    const {
        totalPropietarios, totalPacientes, especiesDistribution, proximasCitas, productosStockBajo,
        lotesProximosACaducar, totalIngresos, totalPedidos, bestSellers, newCustomers
    } = await getDashboardData(supabase);

    const hoy = new Date();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard de la Clínica</h1>
      
      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Ingresos (Este Mes)</CardTitle><TrendingUp className="h-5 w-5 text-green-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalIngresos)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pedidos Online (Este Mes)</CardTitle><ShoppingCart className="h-5 w-5 text-blue-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">+{totalPedidos}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Clientes</CardTitle><Users className="h-5 w-5 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPropietarios}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Pacientes</CardTitle><Dog className="h-5 w-5 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPacientes}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClockIcon className="h-5 w-5"/>Próximas Citas</CardTitle></CardHeader>
          <CardContent>
            {proximasCitas.length > 0 ? (
              <ul className="space-y-3">
                {proximasCitas.map((cita) => (
                    <li key={cita.id}><Link href={`/dashboard/citas/${cita.id}/editar`} className="block group p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><div className="flex justify-between items-center"><span className="font-semibold text-primary group-hover:underline">{cita.paciente_nombre}</span><span className="text-xs text-muted-foreground">{format(parseISO(cita.fecha_hora_inicio), 'Pp', { locale: es })}</span></div><p className="text-xs text-muted-foreground truncate">{cita.motivo}</p></Link></li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No hay citas próximas.</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Productos Más Vendidos</CardTitle></CardHeader>
          <CardContent>
             {bestSellers.length > 0 ? (
              <ul className="space-y-3">
                {bestSellers.map((p: BestSeller) => (
                    <li key={p.producto_id}>
                        <Link href={`/dashboard/inventario/${p.producto_id}`} className="block group p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Image 
                                        src={p.imagen_url || 'https://placehold.co/40x40/e2e8f0/e2e8f0?text=P'}
                                        alt={p.nombre}
                                        width={40}
                                        height={40}
                                        className="rounded-md object-cover bg-gray-100"
                                    />
                                    <span className="font-semibold text-primary group-hover:underline truncate" title={p.nombre}>{p.nombre}</span>
                                </div>
                                {/* CORRECCIÓN: Se usa p.cantidad_vendida */}
                                <Badge variant="secondary">{p.cantidad_vendida} uds.</Badge>
                            </div>
                        </Link>
                    </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No hay datos de ventas para este mes.</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Clientes Recientes</CardTitle></CardHeader>
          <CardContent>
            {newCustomers.length > 0 ? (
              <ul className="space-y-3">
                {newCustomers.map((c: NewCustomer) => (
                    <li key={c.id}><Link href={`/dashboard/propietarios/${c.id}`} className="block group p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><div className="flex justify-between items-center"><span className="font-semibold text-primary group-hover:underline">{c.nombre_completo}</span><span className="text-xs text-muted-foreground">Registrado: {format(parseISO(c.created_at), 'dd/MM/yy')}</span></div></Link></li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No hay clientes nuevos.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
         <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Distribución de Especies</CardTitle></CardHeader>
            <CardContent className="h-[250px]">{especiesDistribution.length > 0 ? <EspeciesChart data={especiesDistribution} /> : <p className="text-muted-foreground">No hay datos.</p>}</CardContent>
         </Card>
         <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="text-destructive">Alertas Importantes</CardTitle></CardHeader>
          <CardContent>
             <h4 className="text-sm font-semibold mb-2 flex items-center"><LucidePackageSearch className="h-4 w-4 mr-2"/>Stock Bajo</h4>
             {productosStockBajo.length > 0 ? (<ul className="space-y-1 text-sm">{productosStockBajo.map((p: ProductoStockBajo) => (<li key={p.id} className="flex justify-between items-center text-xs"><Link href={`/dashboard/inventario/${p.id}`} className="hover:underline">{p.nombre}</Link><Badge variant="destructive">Stock: {p.stock_total} / Min: {p.stock_minimo}</Badge></li>))}</ul>) : <p className="text-xs text-muted-foreground">No hay productos con stock bajo.</p>}
             <hr className="my-4"/>
             <h4 className="text-sm font-semibold mb-2 flex items-center"><AlertCircle className="h-4 w-4 mr-2 text-amber-600"/>Lotes por Caducar</h4>
             {lotesProximosACaducar.length > 0 ? (<ul className="space-y-1 text-sm">{lotesProximosACaducar.map((lote: LoteProximoACaducar) => (<li key={lote.id} className="flex justify-between items-center text-xs"><Link href={`/dashboard/inventario/${lote.producto_id}`} className="hover:underline">{lote.producto_nombre}</Link><Badge variant={isBefore(parseISO(lote.fecha_caducidad), addDays(hoy, 15)) ? "destructive" : "secondary"}>Cad: {format(parseISO(lote.fecha_caducidad), 'dd/MM/yy')}</Badge></li>))}</ul>) : <p className="text-xs text-muted-foreground">No hay lotes con caducidad próxima.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
