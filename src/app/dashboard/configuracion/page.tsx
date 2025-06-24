// src/app/dashboard/configuracion/page.tsx
import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Building, UserCircle, Shield, Bell, Palette, FileEdit } from 'lucide-react';

export const dynamic = 'force-dynamic'; 

interface ConfigItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  enabled: boolean;
}

const configItems: ConfigItem[] = [
  {
    title: "Datos de la Clínica",
    description: "Gestiona la información general de tu clínica: nombre, dirección, contacto, logo, etc.",
    href: "/dashboard/configuracion/clinica",
    icon: Building,
    enabled: true,
  },
  {
    title: "Mi Perfil",
    description: "Actualiza tu información personal y preferencias de cuenta.",
    href: "/dashboard/configuracion/perfil",
    icon: UserCircle,
    enabled: true, 
  },
  {
    title: "Gestión de Contenido",
    description: "Edita los textos e imágenes de las páginas públicas como Inicio, Nosotros, etc.",
    href: "/dashboard/configuracion/contenido",
    icon: FileEdit,
    enabled: true,
  },
  {
    title: "Usuarios y Permisos",
    description: "Gestiona los usuarios del sistema y sus roles (Próximamente).",
    href: "/dashboard/configuracion/usuarios",
    icon: Shield,
    enabled: false,
  },
  {
    title: "Notificaciones",
    description: "Configura tus preferencias de notificación (Próximamente).",
    href: "/dashboard/configuracion/notificaciones",
    icon: Bell,
    enabled: false,
  },
  {
    title: "Apariencia",
    description: "Personaliza el tema y la apariencia de la aplicación (Próximamente).",
    href: "/dashboard/configuracion/apariencia",
    icon: Palette,
    enabled: false,
  },
];

export default function ConfiguracionPage() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">Configuración General</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {configItems.map((item) => {
          const cardContent = (
            <Card 
              className={`h-full flex flex-col transition-shadow ${
                item.enabled ? "hover:shadow-lg" : "bg-muted/50"
              }`}
            >
              <CardHeader className="flex flex-row items-center space-x-4 pb-4">
                <item.icon className={`h-8 w-8 ${item.enabled ? "text-primary" : "text-muted-foreground"}`} />
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          );

          if (item.enabled) {
            return (
              <Link key={item.title} href={item.href} className="block">
                {cardContent}
              </Link>
            );
          } else {
            return (
              <div key={item.title} className="block opacity-50 cursor-not-allowed">
                {cardContent}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
