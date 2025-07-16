import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ListaRecordatoriosCuenta, { RecordatorioParaLista } from "./ListaRecordatoriosCuenta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BellRing } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const supabase = createServerComponentClient({ cookies: () => cookies() });

  // --- INICIO DE LA CORRECCIÓN ---

  // 1. Usamos getUser() para obtener el usuario de forma segura.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  let recordatoriosTipados: RecordatorioParaLista[] = [];

  // 2. Hacemos la consulta desde la tabla `pacientes` para que sea más robusta.
  const { data: pacientesConRecordatorios, error } = await supabase
    .from('pacientes')
    .select(`
      id,
      nombre,
      recordatorios_salud!inner (id, tipo, fecha_proxima, completado)
    `)
    .eq('propietario_id', user.id) // Filtramos los pacientes por el usuario logueado
    .eq('recordatorios_salud.completado', false); // Traemos solo los recordatorios pendientes

  if (error) {
    console.error("Error al obtener pacientes y recordatorios:", error.message);
  }

  if (pacientesConRecordatorios) {
    // 3. Procesamos el resultado para crear una lista plana de recordatorios.
    recordatoriosTipados = pacientesConRecordatorios.flatMap(paciente =>
      paciente.recordatorios_salud.map(recordatorio => ({
        id: recordatorio.id,
        tipo: recordatorio.tipo,
        fecha_proxima: recordatorio.fecha_proxima,
        completado: recordatorio.completado,
        pacientes: {
          id: paciente.id,
          nombre: paciente.nombre,
        },
      }))
    ).sort((a, b) => new Date(a.fecha_proxima).getTime() - new Date(b.fecha_proxima).getTime());
  }
  // --- FIN DE LA CORRECCIÓN ---

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Mi Cuenta</h1>
        <p className="text-lg text-muted-foreground">
          Hola, {user.email}. Aquí tienes un resumen de tu actividad.
        </p>
      </div>
      <Alert className="mb-8">
        <BellRing className="h-4 w-4" />
        <AlertTitle>Próximos Recordatorios</AlertTitle>
        <AlertDescription>
          Esta es la lista de todos los recordatorios de salud pendientes para tus mascotas.
        </AlertDescription>
      </Alert>
      <ListaRecordatoriosCuenta recordatorios={recordatoriosTipados} />
    </div>
  );
}