import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SolicitudPublicaForm from './SolicitudPublicaForm';

export default function SolicitarCitaPublicaPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Solicita una Cita</CardTitle>
          <CardDescription className="pt-2">¿No eres cliente todavía? Rellena este formulario y nos pondremos en contacto contigo lo antes posible para darte una cita.</CardDescription>
        </CardHeader>
        <CardContent>
          <SolicitudPublicaForm />
        </CardContent>
      </Card>
    </div>
  );
}