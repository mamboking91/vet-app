// src/app/layout.tsx

// --- IMPORTS DEL SERVIDOR ---
import type { Metadata } from "next";
import localFont from 'next/font/local';
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { ReactNode } from "react";
import "./globals.css";

// --- NUESTRO NUEVO COMPONENTE DE CLIENTE ---
import ClientLayout from "@/components/ClientLayout";


// --- FUENTES ---
const geistSans = localFont({
  src: [
    { path: '../assets/fonts/Geist-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/Geist-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/Geist-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: "--font-geist-sans",
  display: 'swap',
});

const geistMono = localFont({
  src: [
    { path: '../assets/fonts/GeistMono-Regular.woff2', weight: '400', style: 'normal' },
  ],
  variable: "--font-geist-mono",
  display: 'swap',
});

// --- METADATA ---
export const metadata: Metadata = {
  title: "Gomera Mascotas",
  description: "Cuidando de tus mejores amigos en La Gomera.",
};


// --- LAYOUT PRINCIPAL (SERVER COMPONENT) ---
export default async function RootLayout({ children }: { children: ReactNode }) {
  
  // 1. Obtenemos datos en el servidor
  const supabase = createServerComponentClient({ cookies });
  const { data: clinicData } = await supabase.from('datos_clinica').select('logo_url').single();
  const logoUrl = clinicData?.logo_url || '/placeholder.svg';

  // 2. Renderizamos el HTML base y pasamos los datos al componente de cliente
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-gray-50 font-sans">
        <ClientLayout logoUrl={logoUrl}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}