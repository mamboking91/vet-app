// app/dashboard/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Dog, Stethoscope, CalendarCheck, BarChart3, Archive, AlertCircle } from 'lucide-react';
import { format, startOfToday, endOfTomorrow, parseISO, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import EspeciesChart from './EspeciesChart'; 

export type EspecieData = {
  name: string; 
  value: number; 
};

// Tipos para el dashboard
type PacienteInfoCruda = {
  nombre: string | null;
};
type ProximaCitaCruda = {
  id: string;
  fecha_hora_inicio: string;
  motivo: string | null;
  tipo: string | null;
  pacientes: PacienteInfoCruda[] | null; // Pacientes como array según error anterior
};
type ProximaCitaProcesada = {
  id: string;
  fecha_hora_inicio: string;
  motivo: string | null;
  tipo: string | null;
  paciente_nombre: string | null;
};
type ProductoStockBajo = {
  id: string;
  nombre: string;
  stock_total_actual: number;
  stock_minimo: number | null;
  unidad: string | null;
};

// Tipo para la estructura cruda que devuelve Supabase para lotes próximos a caducar
type LoteProximoACaducarCrudo = {
  id: string; 
  numero_lote: string;
  fecha_caducidad: string; 
  stock_lote: number;
  producto_id: string; 
  productos_inventario: { // Supabase devuelve esto como un array
    nombre: string;
    unidad: string | null;
  }[] | null; // Array de productos o null
};

// Tipo final para la UI, con productos_inventario como objeto
type LoteProximoACaducarProcesado = {
  id: string; 
  numero_lote: string;
  fecha_caducidad: string; 
  stock_lote: number;
  producto_id: string; 
  productos_inventario: { // Objeto o null
    nombre: string;
    unidad: string | null;
  } | null;
};


async function getTableCount(supabaseClient: any, tableName: string): Promise<number> {
  const { count, error } = await supabaseClient.from(tableName).select('*', { count: 'exact', head: true });
  if (error) { console.error(`Error counting ${tableName}:`, error); return 0; }
  return count || 0;
}

async function getEspeciesDistribution(supabaseClient: any): Promise<EspecieData[]> {
  const { data: pacientes, error } = await supabaseClient.from('pacientes').select('especie');
  if (error || !pacientes) { console.error('Error fetching especies:', error); return []; }
  const counts: { [key: string]: number } = {};
  for (const paciente of pacientes) {
    const especie = paciente.especie || 'Desconocida';
    counts[especie] = (counts[especie] || 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const [
    totalPropietarios,
    totalPacientes,
    totalHistoriales,
    especiesDistribution,
  ] = await Promise.all([
    getTableCount(supabase, 'propietarios'),
    getTableCount(supabase, 'pacientes'),
    getTableCount(supabase, 'historiales_medicos'),
    getEspeciesDistribution(supabase),
  ]);

  const hoyInicio = startOfToday().toISOString();
  const mananaFin = endOfTomorrow().toISOString();
  const { data: proximasCitasData, error: citasError } = await supabase
    .from('citas')
    .select('id, fecha_hora_inicio, motivo, tipo, pacientes (nombre)')
    .gte('fecha_hora_inicio', hoyInicio)
    .lte('fecha_hora_inicio', mananaFin)
    .in('estado', ['Programada', 'Confirmada'])
    .order('fecha_hora_inicio', { ascending: true })
    .limit(5); 

  const citasCrudas = (proximasCitasData || []) as ProximaCitaCruda[];
  const proximasCitas: ProximaCitaProcesada[] = citasCrudas.map(citaCruda => {
    const pacienteInfo = (citaCruda.pacientes && citaCruda.pacientes.length > 0) 
      ? citaCruda.pacientes[0] 
      : null;
    return {
      id: citaCruda.id,
      fecha_hora_inicio: citaCruda.fecha_hora_inicio,
      motivo: citaCruda.motivo,
      tipo: citaCruda.tipo,
      paciente_nombre: pacienteInfo?.nombre || null, 
    };
  });

  const { data: stockBajoData, error: stockBajoError } = await supabase
    .from('productos_inventario_con_stock')
    .select('id, nombre, stock_total_actual, stock_minimo, unidad')
    .gt('stock_minimo', 0); 

  let productosStockBajo: ProductoStockBajo[] = [];
  if (stockBajoError) {
    console.error("Error fetching productos para stock bajo:", stockBajoError);
  } else if (stockBajoData) {
    productosStockBajo = (stockBajoData as ProductoStockBajo[])
      .filter(p => p.stock_total_actual <= (p.stock_minimo || 0));
  }
  
  const hoy = new Date();
  const fechaLimiteCaducidad = format(addDays(hoy, 60), 'yyyy-MM-dd'); 

  const { data: lotesCaducidadData, error: lotesCaducidadError } = await supabase
    .from('lotes_producto')
    .select(`id, numero_lote, fecha_caducidad, stock_lote, producto_id, productos_inventario (nombre, unidad)`)
    .eq('esta_activo', true)
    .gt('stock_lote', 0)
    .lte('fecha_caducidad', fechaLimiteCaducidad)
    .gte('fecha_caducidad', format(hoy, 'yyyy-MM-dd')) 
    .order('fecha_caducidad', { ascending: true })
    .limit(5);

  let lotesProximosACaducar: LoteProximoACaducarProcesado[] = []; // Usamos el tipo procesado
  if (lotesCaducidadError) {
    console.error("Error fetching lotes próximos a caducar:", lotesCaducidadError);
  } else if (lotesCaducidadData) {
    // Hacemos cast al tipo crudo que refleja la estructura de Supabase
    const lotesCrudos = (lotesCaducidadData || []) as LoteProximoACaducarCrudo[];
    // Transformamos los datos crudos a la estructura deseada para la UI
    lotesProximosACaducar = lotesCrudos.map(loteCrudo => {
      const productoInfo = (loteCrudo.productos_inventario && loteCrudo.productos_inventario.length > 0)
        ? loteCrudo.productos_inventario[0]
        : null;
      return {
        id: loteCrudo.id,
        numero_lote: loteCrudo.numero_lote,
        fecha_caducidad: loteCrudo.fecha_caducidad,
        stock_lote: loteCrudo.stock_lote,
        producto_id: loteCrudo.producto_id,
        productos_inventario: productoInfo, // Ahora es un objeto o null
      };
    });
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard de la Clínica</h1>

      {/* Sección de Estadísticas */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Propietarios</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPropietarios}</div><p className="text-xs text-muted-foreground">Clientes registrados</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Dog className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalPacientes}</div><p className="text-xs text-muted-foreground">Mascotas registradas</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas de Historial</CardTitle>
            <Stethoscope className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalHistoriales}</div><p className="text-xs text-muted-foreground">Registros médicos</p></CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 mb-8 md:grid-cols-1 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center"><CalendarCheck className="h-5 w-5 mr-2 text-primary" />Próximas Citas (Hoy y Mañana)</CardTitle>
            <CardDescription>{proximasCitas.length > 0 ? `Mostrando las siguientes ${proximasCitas.length} citas.` : "No hay citas programadas para hoy o mañana."}</CardDescription>
          </CardHeader>
          <CardContent>
            {citasError && <p className="text-sm text-red-500">Error al cargar próximas citas.</p>}
            {proximasCitas.length > 0 ? (
              <ul className="space-y-3">
                {proximasCitas.map(cita => (
                  <li key={cita.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Link href={`/dashboard/citas/${cita.id}/editar`} className="block group">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-primary group-hover:underline">{cita.paciente_nombre || 'Paciente no especificado'}</span>
                        <span className="text-xs text-muted-foreground">{format(parseISO(cita.fecha_hora_inicio), 'Pp', { locale: es })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{cita.tipo || cita.motivo || 'Cita programada'}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (!citasError && <p className="text-sm text-muted-foreground">No hay citas próximas.</p>)}
             {proximasCitas.length > 0 && (<Button variant="link" asChild className="mt-4 px-0"><Link href="/dashboard/citas">Ver todas las citas</Link></Button>)}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary"/>
                Distribución de Especies
            </CardTitle>
            <CardDescription>Conteo de pacientes por especie.</CardDescription>
          </CardHeader>
          <CardContent>
            {especiesDistribution.length > 0 ? (
              <EspeciesChart data={especiesDistribution} />
            ) : (
              <p className="text-muted-foreground">No hay datos de especies para mostrar.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NUEVA SECCIÓN: Alertas de Inventario */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Archive className="h-5 w-5 mr-2 text-destructive" />Productos con Stock Bajo</CardTitle>
            <CardDescription>{productosStockBajo.length > 0 ? `Hay ${productosStockBajo.length} producto(s) por debajo del stock mínimo.` : "No hay productos con stock bajo."}</CardDescription>
          </CardHeader>
          <CardContent>
            {stockBajoError && <p className="text-sm text-red-500">Error al cargar datos de stock bajo.</p>}
            {productosStockBajo.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {productosStockBajo.map(p => (
                  <li key={p.id} className="flex justify-between items-center">
                    <Link href={`/dashboard/inventario/${p.id}`} className="hover:underline">{p.nombre}</Link>
                    <Badge variant="destructive">Stock: {p.stock_total_actual} / Min: {p.stock_minimo} ({p.unidad || 'uds'})</Badge>
                  </li>
                ))}
              </ul>
            ) : (!stockBajoError && <p className="text-sm text-muted-foreground">Todo el stock está por encima del mínimo.</p>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><AlertCircle className="h-5 w-5 mr-2 text-amber-600" />Lotes Próximos a Caducar (60 días)</CardTitle>
            <CardDescription>{lotesProximosACaducar.length > 0 ? `Hay ${lotesProximosACaducar.length} lote(s) próximos a caducar.` : "No hay lotes con caducidad próxima."}</CardDescription>
          </CardHeader>
          <CardContent>
            {lotesCaducidadError && <p className="text-sm text-red-500">Error al cargar lotes por caducar.</p>}
            {lotesProximosACaducar.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {/* Usamos el tipo procesado LoteProximoACaducarProcesado para el map */}
                {lotesProximosACaducar.map(lote => (
                  <li key={lote.id} className="flex justify-between items-center">
                    <div>
                      <Link href={`/dashboard/inventario/${lote.producto_id}`} className="font-medium hover:underline">
                        {lote.productos_inventario?.nombre || 'Producto Desconocido'} 
                      </Link>
                      <span className="text-xs text-muted-foreground ml-1">(Lote: {lote.numero_lote})</span>
                    </div>
                    <Badge 
                        variant={ isBefore(parseISO(lote.fecha_caducidad), addDays(hoy, 15)) ? "destructive" : "secondary"} 
                        title={`Stock del lote: ${lote.stock_lote} ${lote.productos_inventario?.unidad || 'uds'}`}>
                      Cad: {format(parseISO(lote.fecha_caducidad), 'dd/MM/yy', { locale: es })}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (!lotesCaducidadError && <p className="text-sm text-muted-foreground">No hay lotes con caducidad próxima.</p>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}