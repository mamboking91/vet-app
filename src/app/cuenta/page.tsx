import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ListaRecordatoriosCuenta, { RecordatorioParaLista } from "./ListaRecordatoriosCuenta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BellRing } from "lucide-react";

export const dynamic = "force-dynamic";

// --- INICIO DE LA CORRECCIÓN ---
// 1. Definimos un tipo que refleja EXACTAMENTE lo que devuelve Supabase.
// La propiedad clave es que `pacientes` es un array `[]`.
type RecordatorioConRespuestaDeSupabase = {
    id: string;
    tipo: string;
    fecha_proxima: string;
    completado: boolean;
    pacientes: {
        id: string;
        nombre: string;
    }[]; // <-- La clave del error está aquí: es un array.
};
// --- FIN DE LA CORRECCIÓN ---

export default async function CuentaPage() {
  const supabase = createServerComponentClient({ cookies: () => cookies() });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  // La consulta sigue siendo la misma, el cambio está en cómo procesamos el resultado
  const { data: recordatoriosRaw, error } = await supabase
    .from("recordatorios_salud")
    .select(`
        id, tipo, fecha_proxima, completado,
        pacientes!inner (id, nombre, propietario_id)
    `)
    .eq("pacientes.propietario_id", session.user.id)
    .eq("completado", false)
    .order("fecha_proxima", { ascending: true });

  if (error) {
    console.error("Error al obtener los recordatorios de la cuenta:", error);
  }
  
  // 2. Mapeamos los datos, tratando `pacientes` como un array y extrayendo el primer elemento.
  const recordatoriosTipados: RecordatorioParaLista[] = (recordatoriosRaw || []).map((r: RecordatorioConRespuestaDeSupabase) => {
    // Extraemos el primer (y único) paciente del array
    const pacienteInfo = (r.pacientes && r.pacientes.length > 0) ? r.pacientes[0] : null;
    
    return {
      id: r.id,
      tipo: r.tipo,
      fecha_proxima: r.fecha_proxima,
      completado: r.completado,
      pacientes: pacienteInfo,
    };
  });

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Mi Cuenta</h1>
        <p className="text-lg text-muted-foreground">
          Hola, {session.user.email}. Aquí tienes un resumen de tu actividad.
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