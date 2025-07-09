// src/components/ClientLayout.tsx

"use client";

import { usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect } from "react";
import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';

// Providers y componentes de UI
import { CartProvider, useCart } from '@/context/CartContext';
import AccountButton from '@/components/ui/AccountButton';
import AppointmentLink from '@/components/ui/AppointmentLink';
import { Toaster } from "sonner";
import { Button } from '@/components/ui/button';

// Imports para el Loader
import { LoadingProvider } from '@/context/LoadingContext';
import PageLoader from '@/components/ui/PageLoader';
import TransitionLink from '@/components/ui/TransitionLink';
import { cn } from '@/lib/utils';

// --- Componente Header Público (Modificado para ser responsive) ---
function PublicHeader() {
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el menú cada vez que la ruta cambia
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const navLinks = (
    <>
      <TransitionLink href="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Inicio</TransitionLink>
      <TransitionLink href="/tienda" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Tienda</TransitionLink>
      <AppointmentLink className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
        Pedir Cita
      </AppointmentLink>
      <TransitionLink href="/nosotros" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Nosotros</TransitionLink>
      <TransitionLink href="/contacto" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Contacto</TransitionLink>
    </>
  );

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-x-2">
            {/* Botón del menú para pantallas pequeñas a la izquierda */}
            <div className="md:hidden">
              <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="icon">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                <span className="sr-only">Abrir menú</span>
              </Button>
            </div>
             {/* Logo */}
            <div className="flex-shrink-0">
                <TransitionLink href="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                Gomera<span className="text-blue-500">Mascotas</span>
                </TransitionLink>
            </div>
          </div>

          {/* Navegación para pantallas grandes */}
          <nav className="hidden md:flex md:gap-x-6">
            {navLinks}
          </nav>

          {/* Iconos de la derecha */}
          <div className="flex items-center gap-x-4">
              <TransitionLink href="/carrito" className="relative p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (<span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">{totalItems}</span>)}
              </TransitionLink>
              <AccountButton />
          </div>
        </div>

         {/* Menú desplegable para pantallas pequeñas */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <nav className="flex flex-col items-center gap-y-4 py-4 border-t border-gray-200">
            {navLinks}
          </nav>
        </div>
      </div>
    </header>
  );
}

// --- Componente Footer Público (Sin cambios) ---
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

// --- Componente principal que envuelve toda la lógica de cliente (Sin cambios estructurales) ---
export default function ClientLayout({ children, logoUrl }: { children: ReactNode, logoUrl: string }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <LoadingProvider>
      <CartProvider>
        <PageLoader logoUrl={logoUrl} />

        {isDashboard ? (
          children
        ) : (
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
    </LoadingProvider>
  );
}