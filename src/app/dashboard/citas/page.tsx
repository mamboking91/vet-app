import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, ChevronLeft, ChevronRight, Calendar, Stethoscope } from "lucide-react"
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
  parseISO,
} from "date-fns"
import { es } from "date-fns/locale"

import CalendarioMensualCitas from "./CalendarioMensualCitas"
import type { CitaConDetalles, WeekInMonth, DayInMonth } from "./types"

export const dynamic = "force-dynamic"

// Definimos el tipo local para los datos crudos de Supabase
type CitaConArraysAnidados = {
  id: string
  fecha_hora_inicio: string
  fecha_hora_fin: string | null
  duracion_estimada_minutos: number | null
  motivo: string | null
  tipo: string | null
  estado: string | null
  pacientes: Array<{
    id: string
    nombre: string
    propietarios: Array<{
      id: string
      nombre_completo: string
    }>
  }> | null
}

interface CitasPageProps {
  searchParams?: {
    vistaMes?: string
  }
}

export default async function CitasPage({ searchParams }: CitasPageProps) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  let currentDate: Date
  if (searchParams?.vistaMes && isValid(parse(searchParams.vistaMes, "yyyy-MM", new Date()))) {
    currentDate = parse(searchParams.vistaMes, "yyyy-MM", new Date())
  } else {
    currentDate = new Date()
  }
  currentDate = startOfMonth(currentDate)

  const primerDiaDelMes = startOfMonth(currentDate)
  const ultimoDiaDelMes = endOfMonth(currentDate)

  const { data: citasData, error: citasError } = await supabase
    .from("citas")
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
    .gte("fecha_hora_inicio", primerDiaDelMes.toISOString())
    .lte("fecha_hora_inicio", ultimoDiaDelMes.toISOString())
    .order("fecha_hora_inicio", { ascending: true })

  if (citasError) {
    console.error("[CitasPage - Mensual] Error fetching citas:", citasError)
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/30 dark:to-rose-800/30 rounded-full flex items-center justify-center mb-4">
          <Stethoscope className="w-12 h-12 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-red-500 text-lg font-semibold">Error al cargar las citas del mes.</p>
        <p className="text-gray-500 mt-2">Por favor, intenta recargar la página.</p>
      </div>
    )
  }

  const citasDelMesRaw = (citasData || []) as CitaConArraysAnidados[]

  const citasDelMesParaCalendario = citasDelMesRaw.map((citaRaw) => {
    const pacientePrincipal = citaRaw.pacientes && citaRaw.pacientes.length > 0 ? citaRaw.pacientes[0] : null
    const propietarioPrincipal =
      pacientePrincipal && pacientePrincipal.propietarios && pacientePrincipal.propietarios.length > 0
        ? pacientePrincipal.propietarios[0]
        : null

    return {
      ...citaRaw,
      pacientes: pacientePrincipal
        ? {
            id: pacientePrincipal.id,
            nombre: pacientePrincipal.nombre,
            propietarios: propietarioPrincipal
              ? {
                  id: propietarioPrincipal.id,
                  nombre_completo: propietarioPrincipal.nombre_completo,
                }
              : null,
          }
        : null,
    }
  }) as CitaConDetalles[]

  const semanas: WeekInMonth[] = []
  let semanaActual: DayInMonth[] = []
  const primerDiaVisible = startOfWeek(primerDiaDelMes, { locale: es, weekStartsOn: 1 })
  const ultimoDiaVisible = endOfWeek(ultimoDiaDelMes, { locale: es, weekStartsOn: 1 })
  const diasParaCuadricula = eachDayOfInterval({ start: primerDiaVisible, end: ultimoDiaVisible })

  diasParaCuadricula.forEach((dia, index) => {
    const citasDelDiaEspecifico = citasDelMesParaCalendario.filter((cita) =>
      isSameDay(parseISO(cita.fecha_hora_inicio), dia),
    )
    semanaActual.push({
      date: dia,
      isCurrentMonth: isSameMonth(dia, currentDate),
      isToday: isSameDay(dia, new Date()),
      dayNumber: Number.parseInt(format(dia, "d")),
      citasDelDia: citasDelDiaEspecifico,
    })
    if ((index + 1) % 7 === 0 || index === diasParaCuadricula.length - 1) {
      semanas.push(semanaActual)
      semanaActual = []
    }
  })

  const mesAnterior = format(subMonths(currentDate, 1), "yyyy-MM")
  const mesSiguiente = format(addMonths(currentDate, 1), "yyyy-MM")

  const totalCitas = citasDelMesParaCalendario.length
  const citasCompletadas = citasDelMesParaCalendario.filter((c) => c.estado?.toLowerCase() === "completada").length
  const citasPendientes = citasDelMesParaCalendario.filter((c) =>
    ["programada", "confirmada"].includes(c.estado?.toLowerCase() || ""),
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950">
      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Header con estadísticas */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            {/* Navegación del mes */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                asChild
                className="hover:bg-blue-50 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-800"
              >
                <Link href={`/dashboard/citas?vistaMes=${mesAnterior}`}>
                  <ChevronLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </Link>
              </Button>

              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {format(currentDate, "MMMM yyyy", { locale: es })}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Gestión de citas veterinarias</p>
              </div>

              <Button
                variant="outline"
                size="icon"
                asChild
                className="hover:bg-blue-50 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-800"
              >
                <Link href={`/dashboard/citas?vistaMes=${mesSiguiente}`}>
                  <ChevronRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="ml-4 hover:bg-blue-50 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-800"
              >
                <Link href={`/dashboard/citas?vistaMes=${format(new Date(), "yyyy-MM")}`}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Hoy
                </Link>
              </Button>
            </div>

            {/* Botón de nueva cita */}
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Link href="/dashboard/citas/nueva">
                <PlusCircle className="mr-2 h-5 w-5" />
                Programar Cita
              </Link>
            </Button>
          </div>

          {/* Estadísticas del mes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total de citas</p>
                  <p className="text-2xl font-bold">{totalCitas}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Completadas</p>
                  <p className="text-2xl font-bold">{citasCompletadas}</p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Pendientes</p>
                  <p className="text-2xl font-bold">{citasPendientes}</p>
                </div>
                <div className="text-2xl">⏳</div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <CalendarioMensualCitas semanas={semanas} currentDisplayMonth={currentDate} />
      </div>
    </div>
  )
}