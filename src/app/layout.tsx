// src/app/layout.tsx
import type { Metadata } from "next";
import localFont from 'next/font/local'; // Importa 'localFont'
import "./globals.css";

// Configuración para Geist Sans como fuente local
const geistSans = localFont({
  src: [
    // Define cada archivo de fuente con su peso y estilo
    // Ajusta las rutas y los nombres de archivo según lo que hayas descargado
    // y dónde los hayas guardado (relativo a este archivo layout.tsx).
    // Si layout.tsx está en src/app/ y las fuentes en src/assets/fonts/,
    // la ruta sería '../assets/fonts/NombreDelArchivo.woff2'
    {
      path: '../assets/fonts/Geist-Regular.woff2', // Ejemplo de ruta
      weight: '400', // Peso para Regular
      style: 'normal',
    },
    {
      path: '../assets/fonts/Geist-Medium.woff2', // Ejemplo de ruta
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Geist-Bold.woff2', // Ejemplo de ruta
      weight: '700',
      style: 'normal',
    },
    // Añade más si tienes otros pesos (Thin, SemiBold, Black, etc.)
  ],
  variable: "--font-geist-sans", // Esto crea una variable CSS
  display: 'swap', // Buena práctica para el rendimiento
});

// Configuración para Geist Mono como fuente local
const geistMono = localFont({
  src: [
    {
      path: '../assets/fonts/GeistMono-Regular.woff2', // Ejemplo de ruta
      weight: '400',
      style: 'normal',
    },
    // Añade más si tienes otros pesos/estilos para Geist Mono
  ],
  variable: "--font-geist-mono",
  display: 'swap',
});

export const metadata: Metadata = {
  // Has cambiado "Create Next App", ¿verdad? Si no, cámbialo.
  title: "Clínica Veterinaria Las Almenas", // Ejemplo
  description: "Sistema de gestión para la Clínica Veterinaria Las Almenas", // Ejemplo
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Aplica las variables CSS de las fuentes al elemento <html>
    // También he cambiado lang a "es" (español)
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased"> {/* 'antialiased' ya estaba, es bueno */}
        {children}
      </body>
    </html>
  );
}