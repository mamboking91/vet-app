// src/app/layout.tsx
"use client"; // Se mueve "use client" al principio para todo el archivo

import type { Metadata } from "next";
import localFont from 'next/font/local';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import "./globals.css";
import { CartProvider, useCart } from '@/context/CartContext';
import AccountButton from '@/components/ui/AccountButton';
import { Toaster } from "sonner";
import { usePathname } from 'next/navigation';
import { ReactNode } from "react";

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

// Componente para el Header Público
function PublicHeader() {
  // CORRECCIÓN: Se usa 'totalItems' en lugar de 'itemCount'
  const { totalItems } = useCart();
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
              Gomera<span className="text-blue-500">Mascotas</span>
            </Link>
          </div>
          <nav className="hidden md:flex md:gap-x-6">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Inicio</Link>
            <Link href="/tienda" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Tienda</Link>
            <Link href="/servicios/solicitar-cita" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Pedir Cita</Link>
            <Link href="/nosotros" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Nosotros</Link>
            <Link href="/contacto" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Contacto</Link>
          </nav>
          <div className="flex items-center gap-x-4">
            <Link href="/carrito" className="relative p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (<span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">{totalItems}</span>)}
            </Link>
            <AccountButton />
          </div>
        </div>
      </div>
    </header>
  );
}

// Componente para el Footer Público
function PublicFooter() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-lg font-semibold">Gomera Mascotas</p>
          <p className="mt-2 text-sm text-gray-400">Cuidando de tus mejores amigos en La Gomera.</p>
          <div className="mt-4 flex justify-center gap-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
          </div>
          <p className="mt-8 text-xs text-gray-500">&copy; {new Date().getFullYear()} Gomera Mascotas. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}


// Componente Cliente que envuelve el contenido principal
function AppBody({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <body className="antialiased bg-gray-50 font-sans">
      <CartProvider>
        {isDashboard ? (
          // Si estamos en el dashboard, solo renderizamos el contenido
          children
        ) : (
          // Si estamos en la parte pública, renderizamos todo el layout
          <div className="flex flex-col min-h-screen">
            <PublicHeader />
            <main className="flex-grow">
              {children}
            </main>
            <PublicFooter />
          </div>
        )}
        <Toaster richColors position="bottom-right" />
      </CartProvider>
    </body>
  );
}


// El layout principal, que ahora delega la lógica de cliente.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <AppBody>{children}</AppBody>
    </html>
  );
}
