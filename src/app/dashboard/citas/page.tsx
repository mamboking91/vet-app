// app/dashboard/citas/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'; // <--- IMPORTACIÓN AÑADIDA
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths,
  isSameMonth,
  parse,
  isValid,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';

import CalendarioMensualCitas from './CalendarioMensualCitas';
// Asumimos que los tipos se importan desde tu archivo types.ts centralizado
import type { CitaConDetalles, WeekInMonth, DayInMonth, CitaConArraysAnidados } from './types'; 

export const dynamic = 'force-dynamic';

interface CitasPageProps {
  searchParams?: {
    vistaMes?: string; // Formato YYYY-MM
  };
}

export default async function CitasPage({ searchParams }: CitasPageProps) {
  const cookieStore = cookies(); // Ahora 'cookies' está definido
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  let currentDate: Date;
  if (searchParams?.vistaMes && isValid(parse(searchParams.vistaMes, 'yyyy-MM', new Date()))) {
    currentDate = parse(searchParams.vistaMes, 'yyyy-MM', new Date());
  } else {
    currentDate = new Date(); 
  }
  currentDate = startOfMonth(currentDate);

  const primerDiaDelMes = startOfMonth(currentDate);
  const ultimoDiaDelMes = endOfMonth(currentDate);

  const { data: citasData, error: citasError } = await supabase
    .from('citas')
    .select(`
      id,
      fecha_hora_inicio,
      fecha_hora_fin,
      duracion_estimada_minutos,
      motivo,
      tipo,
      estado,
      pacientes ( 
        id,
        nombre,
        propietarios ( 
          id,
          nombre_completo
        )
      )
    `)
    .gte('fecha_hora_inicio', primerDiaDelMes.toISOString())
    .lte('fecha_hora_inicio', ultimoDiaDelMes.toISOString())
    .order('fecha_hora_inicio', { ascending: true });

  if (citasError) {
    console.error('[CitasPage - Mensual] Error fetching citas:', citasError);
    return <p className="text-red-500">Error al cargar las citas del mes.</p>;
  }
  
  const citasDelMesRaw = (citasData || []) as CitaConArraysAnidados[];

  const citasDelMesParaCalendario = citasDelMesRaw.map(citaRaw => {
    const pacientePrincipal = (citaRaw.pacientes && citaRaw.pacientes.length > 0) ? citaRaw.pacientes[0] : null;
    const propietarioPrincipal = (pacientePrincipal && pacientePrincipal.propietarios && pacientePrincipal.propietarios.length > 0) ? pacientePrincipal.propietarios[0] : null;

    return {
      ...citaRaw,
      pacientes: pacientePrincipal ? {
        id: pacientePrincipal.id,
        nombre: pacientePrincipal.nombre,
        propietarios: propietarioPrincipal ? {
          id: propietarioPrincipal.id,
          nombre_completo: propietarioPrincipal.nombre_completo,
        } : null,
      } : null,
    };
  }) as CitaConDetalles[];


  const semanas: WeekInMonth[] = [];
  let semanaActual: DayInMonth[] = [];
  const primerDiaVisible = startOfWeek(primerDiaDelMes, { locale: es, weekStartsOn: 1 });
  const ultimoDiaVisible = endOfWeek(ultimoDiaDelMes, { locale: es, weekStartsOn: 1 });
  const diasParaCuadricula = eachDayOfInterval({ start: primerDiaVisible, end: ultimoDiaVisible });

  diasParaCuadricula.forEach((dia, index) => {
    const citasDelDiaEspecifico = citasDelMesParaCalendario.filter(cita => 
      isSameDay(parseISO(cita.fecha_hora_inicio), dia)
    );
    semanaActual.push({
      date: dia,
      isCurrentMonth: isSameMonth(dia, currentDate),
      isToday: isSameDay(dia, new Date()),
      dayNumber: parseInt(format(dia, 'd')),
      citasDelDia: citasDelDiaEspecifico
    });
    if ((index + 1) % 7 === 0 || index === diasParaCuadricula.length - 1) {
      semanas.push(semanaActual);
      semanaActual = [];
    }
  });
  
  const mesAnterior = format(subMonths(currentDate, 1), 'yyyy-MM');
  const mesSiguiente = format(addMonths(currentDate, 1), 'yyyy-MM');

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
       <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/citas?vistaMes=${mesAnterior}`}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-center min-w-[200px]">
            {format(currentDate, 'MMMM yyyy', { locale: es })} 
          </h1>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/citas?vistaMes=${mesSiguiente}`}>
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="ml-2">
             <Link href={`/dashboard/citas?vistaMes=${format(new Date(), 'yyyy-MM')}`}>Hoy</Link>
          </Button>
        </div>
        <Button asChild>
          <Link href="/dashboard/citas/nueva">
            <PlusCircle className="mr-2 h-5 w-5" />
            Programar Cita
          </Link>
        </Button>
      </div>
      <CalendarioMensualCitas 
        semanas={semanas} 
        currentDisplayMonth={currentDate}
      />
    </div>
  );
}