// src/app/nosotros/page.tsx

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, PawPrint, ShieldCheck, Stethoscope } from "lucide-react";
import Image from "next/image";

// Datos del equipo (puedes reemplazarlos con los datos reales)
const teamMembers = [
  {
    name: "Dr. Alejandro Ramírez",
    role: "Veterinario Principal y Fundador",
    bio: "Con más de 15 años de experiencia, el Dr. Ramírez fundó Gomera Mascotas con la pasión de ofrecer un cuidado excepcional y compasivo a todas las mascotas de la isla.",
    imageUrl: "https://placehold.co/400x400/E2E8F0/4A5568?text=AR",
  },
  {
    name: "Laura Torres",
    role: "Auxiliar Técnico Veterinario",
    bio: "Laura es el corazón de nuestra clínica. Se asegura de que cada mascota se sienta cómoda y segura durante su visita, y asiste en todos los procedimientos con una sonrisa.",
    imageUrl: "https://placehold.co/400x400/E2E8F0/4A5568?text=LT",
  },
  {
    name: "Carlos Mendoza",
    role: "Recepcionista y Atención al Cliente",
    bio: "Carlos es la primera cara amigable que verás. Gestiona las citas y resuelve cualquier duda para garantizar que tu experiencia en nuestra clínica sea perfecta desde el principio.",
    imageUrl: "https://placehold.co/400x400/E2E8F0/4A5568?text=CM",
  },
];

export default function NosotrosPage() {
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <div className="relative h-80">
        <Image
          src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2069&auto=format&fit=crop"
          alt="Equipo veterinario con un perro"
          layout="fill"
          objectFit="cover"
          className="brightness-50"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Sobre Nosotros
            </h1>
            <p className="mt-4 text-xl max-w-2xl">
              Cuidando de tus mejores amigos con amor y profesionalidad.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 space-y-20">
        {/* Misión y Visión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center md:text-left">
          <div>
            <h2 className="text-3xl font-bold text-blue-700 mb-4">Nuestra Misión</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Ofrecer un servicio veterinario integral y de la más alta calidad, centrado en el bienestar animal y la tranquilidad de sus familias. Nos comprometemos a tratar a cada paciente con el mismo cuidado y afecto que daríamos a nuestras propias mascotas.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-blue-700 mb-4">Nuestra Visión</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Ser la clínica veterinaria de referencia en La Gomera, reconocida por nuestra excelencia médica, nuestro trato cercano y nuestro compromiso inquebrantable con la salud y la felicidad de los animales de nuestra comunidad.
            </p>
          </div>
        </div>

        {/* Valores */}
        <div>
          <h2 className="text-4xl font-bold text-center mb-12">Nuestros Valores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center border-2 border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <Heart className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Compasión</h3>
                <p className="text-gray-600">Tratamos a cada mascota con empatía, amor y respeto, entendiendo su importancia en tu familia.</p>
              </CardContent>
            </Card>
            <Card className="text-center border-2 border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <Stethoscope className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Excelencia</h3>
                <p className="text-gray-600">Nos mantenemos en constante formación para aplicar los últimos avances y ofrecer la mejor medicina veterinaria.</p>
              </CardContent>
            </Card>
            <Card className="text-center border-2 border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8">
                <ShieldCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Confianza</h3>
                <p className="text-gray-600">Construimos relaciones honestas y transparentes con nuestros clientes, basadas en la comunicación y la confianza mutua.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Equipo */}
        <div>
          <h2 className="text-4xl font-bold text-center mb-12">Conoce a Nuestro Equipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <Card key={member.name} className="overflow-hidden text-center shadow-sm hover:shadow-xl transition-shadow duration-300">
                <div className="bg-gray-100 p-4">
                   <Avatar className="mx-auto h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage src={member.imageUrl} alt={member.name} />
                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p className="text-blue-600 font-semibold mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
