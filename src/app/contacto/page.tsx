// src/app/contacto/page.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "./ContactForm";

export default function ContactoPage() {
  return (
    <div className="bg-gray-50/50">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">
            Ponte en Contacto
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            ¿Tienes alguna pregunta o quieres solicitar una cita? Estamos aquí para ayudarte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Columna del Formulario */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Envíanos un Mensaje</h2>
            <ContactForm />
          </div>

          {/* Columna de Información y Mapa */}
          <div className="space-y-8">
            <Card className="overflow-hidden shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Información de la Clínica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Dirección</h3>
                    <p>Finca Rivera, 38800 San Sebastián de la Gomera, Santa Cruz de Tenerife</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Teléfono</h3>
                    <p>+34 123 456 789</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p>contacto@gomeramascotas.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-lg">
               <CardHeader>
                <CardTitle className="text-2xl">Nuestra Ubicación</CardTitle>
              </CardHeader>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3523.578615014654!2d-17.11352288493224!3d28.09758838268233!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xc6b9319255a30a7%3A0x1d3f3e9a7b1c4b7d!2sFinca%20Rivera!5e0!3m2!1ses!2ses!4v1687881331234!5m2!1ses!2ses"
                  width="100%"
                  height="350"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
