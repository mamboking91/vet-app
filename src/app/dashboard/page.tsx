import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Users, Dog, Stethoscope, CalendarCheck, BarChart3, AlertCircle, LucidePackageSearch, 
    TrendingUp, Star, UserPlus, ArrowRight 
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import EspeciesChart from './EspeciesChart'; 
import { formatCurrency } from '@/lib/utils';

// --- TIPOS DE DATOS PARA EL DASHBOARD ---
export type EspecieData = { name: string; value: number };
type ProximaCita = { id: string; fecha_hora_inicio: string; motivo: string; paciente_nombre: string };
type ProductoStockBajo = { id: string; nombre: string; stock_total_actual: number; stock_minimo: number | null; unidad: string | null };
type LoteProximoACaducar = { id: string; numero_lote: string; fecha_caducidad: string; stock_lote: number; producto_id: string; producto_nombre: string; unidad: string | null };
type SalesStats = { total_revenue: number; total_orders: number };
type BestSeller = { producto_id: string; nombre_producto: string; unidades_vendidas: number };
type NewCustomer = { id: string; nombre_completo: string; created_at: string };


async function getDashboardData(supabase: any) {
    const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
    const endOfCurrentMonth = endOfMonth(new Date()).toISOString();
    
    const [
        propietariosResult, pacientesResult, especiesResult, citasResult,
        stockBajoResult, lotesResult, salesResult, bestSellersResult, newCustomersResult
    ] = await Promise.all([
        supabase.from('propietarios').select('id', { count: 'exact', head: true }),
        supabase.from('pacientes').select('id', { count: 'exact', head: true }),
        supabase.from('pacientes').select('especie'),
        supabase.from('citas').select('id, fecha_hora_inicio, motivo, tipo, pacientes(nombre)').gte('fecha_hora_inicio', new Date().toISOString()).order('fecha_hora_inicio', { ascending: true }).limit(5),
        supabase.from('productos_inventario_con_stock').select('id, nombre, stock_total_actual, stock_minimo, unidad').gt('stock_minimo', 0),
        supabase.from('lotes_producto').select(`id, numero_lote, fecha_caducidad, stock_lote, producto_id, productos_inventario(nombre, unidad)`).eq('esta_activo', true).gt('stock_lote', 0).lte('fecha_caducidad', format(addDays(new Date(), 60), 'yyyy-MM-dd')).order('fecha_caducidad', { ascending: true }).limit(5),
        supabase.from('pedidos').select('total').gte('created_at', startOfCurrentMonth).lte('created_at', endOfCurrentMonth).in('estado', ['completado', 'enviado']),
        supabase.rpc('get_best_selling_products', { limit_count: 5 }),
        supabase.from('propietarios').select('id, nombre_completo, created_at').order('created_at', { ascending: false }).limit(5)
    ]);

    const totalPropietarios = propietariosResult.count || 0;
    const totalPacientes = pacientesResult.count || 0;

    const especiesCounts = (especiesResult.data || []).reduce((acc: any, p: any) => {
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

    const productosStockBajo: ProductoStockBajo[] = (stockBajoResult.data || []).filter((p: any) => p.stock_total_actual <= (p.stock_minimo || 0));

    const lotesProximosACaducar: LoteProximoACaducar[] = (lotesResult.data || []).map((l: any) => ({
        id: l.id,
        numero_lote: l.numero_lote,
        fecha_caducidad: l.fecha_caducidad,
        stock_lote: l.stock_lote,
        producto_id: l.producto_id,
        producto_nombre: l.productos_inventario?.nombre || 'Desconocido',
        unidad: l.productos_inventario?.unidad || 'uds'
    }));
    
    const salesStats: SalesStats = (salesResult.data || []).reduce((acc: SalesStats, order: any) => {
        acc.total_revenue += order.total;
        acc.total_orders += 1;
        return acc;
    }, { total_revenue: 0, total_orders: 0 });

    const bestSellers: BestSeller[] = bestSellersResult.data || [];
    const newCustomers: NewCustomer[] = newCustomersResult.data || [];

    return {
        totalPropietarios, totalPacientes, especiesDistribution, proximasCitas, productosStockBajo,
        lotesProximosACaducar, salesStats, bestSellers, newCustomers
    };
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    const {
        totalPropietarios, totalPacientes, especiesDistribution, proximasCitas, productosStockBajo,
        lotesProximosACaducar, salesStats, bestSellers, newCustomers
    } = await getDashboardData(supabase);

    const hoy = new Date();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard de la Clínica</h1>
      
      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Ingresos (Este Mes)</CardTitle><TrendingUp className="h-5 w-5 text-green-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(salesStats.total_revenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pedidos (Este Mes)</CardTitle><Stethoscope className="h-5 w-5 text-blue-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">+{salesStats.total_orders}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Propietarios</CardTitle><Users className="h-5 w-5 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPropietarios}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Pacientes</CardTitle><Dog className="h-5 w-5 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPacientes}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Próximas Citas</CardTitle></CardHeader>
          <CardContent>
            {proximasCitas.length > 0 ? (
              <ul className="space-y-3">
                {proximasCitas.map((cita: ProximaCita) => (
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
                    <li key={p.producto_id}><Link href={`/dashboard/inventario/${p.producto_id}`} className="block group p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><div className="flex justify-between items-center"><span className="font-semibold text-primary group-hover:underline">{p.nombre_producto}</span><Badge variant="secondary">{p.unidades_vendidas} uds.</Badge></div></Link></li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No hay datos de ventas.</p>}
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
             {/* --- CORRECCIÓN AQUÍ: Añadimos el tipo explícito para 'p' --- */}
             {productosStockBajo.length > 0 ? (<ul className="space-y-1 text-sm">{productosStockBajo.map((p: ProductoStockBajo) => (<li key={p.id} className="flex justify-between items-center text-xs"><Link href={`/dashboard/inventario/${p.id}`} className="hover:underline">{p.nombre}</Link><Badge variant="destructive">Stock: {p.stock_total_actual} / Min: {p.stock_minimo}</Badge></li>))}</ul>) : <p className="text-xs text-muted-foreground">No hay productos con stock bajo.</p>}
             <hr className="my-4"/>
             <h4 className="text-sm font-semibold mb-2 flex items-center"><AlertCircle className="h-4 w-4 mr-2 text-amber-600"/>Lotes por Caducar</h4>
             {/* --- CORRECCIÓN AQUÍ: Añadimos el tipo explícito para 'lote' --- */}
             {lotesProximosACaducar.length > 0 ? (<ul className="space-y-1 text-sm">{lotesProximosACaducar.map((lote: LoteProximoACaducar) => (<li key={lote.id} className="flex justify-between items-center text-xs"><Link href={`/dashboard/inventario/${lote.producto_id}`} className="hover:underline">{lote.producto_nombre}</Link><Badge variant={isBefore(parseISO(lote.fecha_caducidad), addDays(hoy, 15)) ? "destructive" : "secondary"}>Cad: {format(parseISO(lote.fecha_caducidad), 'dd/MM/yy')}</Badge></li>))}</ul>) : <p className="text-xs text-muted-foreground">No hay lotes con caducidad próxima.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}