import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft, Edit, PlusCircle, User, Calendar, PawPrint } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Componentes importados
import HistorialMedicoTabla from "./historial/HistorialMedicoTabla";
import CondicionesMedicas from "./CondicionesMedicas";
import RecordatoriosLista from "./RecordatoriosLista"; // <-- NUEVO
import MedicionesTabla from "./MedicionesTabla";     // <-- NUEVO
import { PacienteDetalleCompleto } from "../types";

interface DetallePacientePageProps {
  params: { pacienteId: string };
}

export const dynamic = "force-dynamic";

export default async function DetallePacientePage({ params }: DetallePacientePageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { pacienteId } = params;

  const { data: paciente, error } = await supabase
    .from("pacientes")
    .select(`
        *,
        propietarios (id, nombre_completo),
        historiales_medicos(*, id),
        mediciones_paciente(*),
        recordatorios_salud(*)
    `)
    .eq("id", pacienteId)
    .single();

  if (error || !paciente) {
    console.error("Error al obtener los detalles del paciente:", error?.message);
    notFound();
  }
  
  const pacienteCompleto = paciente as PacienteDetalleCompleto;

  const historial = (pacienteCompleto.historiales_medicos || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const mediciones = (pacienteCompleto.mediciones_paciente || []).sort((a,b) => new Date(b.fecha_medicion).getTime() - new Date(a.fecha_medicion).getTime());
  const recordatorios = (pacienteCompleto.recordatorios_salud || []).sort((a,b) => new Date(a.fecha_proxima).getTime() - new Date(b.fecha_proxima).getTime());

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/pacientes"><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button asChild><Link href={`/dashboard/pacientes/${pacienteId}/historial/nuevo`}><PlusCircle className="mr-2 h-4 w-4" />Añadir Historial</Link></Button>
            <Button variant="secondary" asChild><Link href={`/dashboard/pacientes/${pacienteId}/editar`}><Edit className="mr-2 h-4 w-4" />Editar Ficha</Link></Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <main className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-3xl font-bold gap-3"><PawPrint className="h-8 w-8 text-purple-600"/>{pacienteCompleto.nombre}</CardTitle>
                <CardDescription>ID: {pacienteCompleto.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="font-semibold col-span-2 sm:col-span-1">Propietario</div>
                  <div className="col-span-2 sm:col-span-1"><Link href={`/dashboard/propietarios/${pacienteCompleto.propietarios?.id}`} className="text-purple-600 hover:underline flex items-center gap-1"><User className="h-4 w-4"/>{pacienteCompleto.propietarios?.nombre_completo || 'N/A'}</Link></div>
                  <div className="font-semibold col-span-2 sm:col-span-1">Nacimiento</div>
                  <div className="col-span-2 sm:col-span-1 flex items-center gap-1"><Calendar className="h-4 w-4"/>{pacienteCompleto.fecha_nacimiento ? format(parseISO(pacienteCompleto.fecha_nacimiento), "dd 'de' MMMM 'de' yyyy", { locale: es }) : 'N/A'}</div>
                </dl>
              </CardContent>
            </Card>

            <CondicionesMedicas
              pacienteId={pacienteCompleto.id}
              condiciones={pacienteCompleto.condiciones_medicas_preexistentes}
            />

            <Card>
              <CardHeader>
                <CardTitle>Historial Clínico</CardTitle>
              </CardHeader>
              <CardContent>
                <HistorialMedicoTabla historial={historial} pacienteId={pacienteCompleto.id} nombrePaciente={pacienteCompleto.nombre} />
              </CardContent>
            </Card>
          </main>

          <aside className="lg:col-span-1 space-y-8">
            {/* Componentes reales reemplazando los placeholders */}
            <RecordatoriosLista recordatorios={recordatorios} pacienteId={pacienteId} />
            <MedicionesTabla mediciones={mediciones} pacienteId={pacienteId} />
          </aside>
        </div>
      </div>
    </div>
  );
}