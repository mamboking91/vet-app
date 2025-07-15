import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Scale, Thermometer, HeartPulse, Wind, Microscope, FileText } from "lucide-react";

// Definimos los tipos para las props y la respuesta de Supabase
interface DetalleMedicionPageProps {
  params: {
    pacienteId: string;
    medicionId: string;
  };
}

type MedicionConPaciente = {
  id: string;
  fecha_medicion: string;
  peso: number | null;
  temperatura: number | null;
  frecuencia_cardiaca: number | null;
  frecuencia_respiratoria: number | null;
  mucosas: string | null;
  notas: string | null;
  pacientes: {
    nombre: string;
  } | null;
};

export const dynamic = 'force-dynamic';

export default async function DetalleMedicionPage({ params }: DetalleMedicionPageProps) {
  const supabase = createServerComponentClient({ cookies: () => cookies() });

  // Obtenemos los datos de la medición específica y el nombre del paciente asociado
  const { data: medicion, error } = await supabase
    .from("mediciones_paciente")
    .select("*, pacientes(nombre)")
    .eq("id", params.medicionId)
    .single();

  if (error || !medicion) {
    notFound();
  }

  const medicionTipada = medicion as MedicionConPaciente;

  // Creamos un array de los detalles para mostrarlos de forma limpia
  const detalles = [
    { label: "Peso", value: medicionTipada.peso ? `${medicionTipada.peso} kg` : "N/A", icon: Scale },
    { label: "Temperatura", value: medicionTipada.temperatura ? `${medicionTipada.temperatura} °C` : "N/A", icon: Thermometer },
    { label: "Frecuencia Cardíaca", value: medicionTipada.frecuencia_cardiaca ? `${medicionTipada.frecuencia_cardiaca} ppm` : "N/A", icon: HeartPulse },
    { label: "Frecuencia Respiratoria", value: medicionTipada.frecuencia_respiratoria ? `${medicionTipada.frecuencia_respiratoria} rpm` : "N/A", icon: Wind },
    { label: "Mucosas", value: medicionTipada.mucosas || "N/A", icon: Microscope },
    { label: "Notas Adicionales", value: medicionTipada.notas || "Sin notas", icon: FileText, fullWidth: true },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href={`/dashboard/pacientes/${params.pacienteId}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Detalle de Medición</h1>
          <p className="text-muted-foreground">
            Para {medicionTipada.pacientes?.nombre || 'paciente'} el {format(parseISO(medicionTipada.fecha_medicion), "dd 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Valores Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {detalles.map(({ label, value, icon: Icon, fullWidth }) => (
              <div key={label} className={fullWidth ? "md:col-span-2" : ""}>
                <dt className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </dt>
                {/* Usamos 'pre-wrap' para respetar los saltos de línea en las notas */}
                <dd className="mt-1 text-lg font-semibold whitespace-pre-wrap">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}