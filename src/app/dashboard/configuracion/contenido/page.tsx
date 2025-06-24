// src/app/dashboard/configuracion/contenido/page.tsx
import React from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LayoutTemplate, PlusCircle } from 'lucide-react';
import EditorDeBloques from './EditorDeBloques'; // El componente principal de nuestro editor
import type { BloquePagina } from './types'; // Un nuevo archivo de tipos para organizar

export const dynamic = 'force-dynamic';

export default async function GestionContenidoPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Obtenemos todos los bloques de la página de inicio, ordenados
  const { data: bloques, error } = await supabase
    .from('bloques_pagina')
    .select('*')
    .eq('pagina', 'inicio')
    .order('orden', { ascending: true });

  if (error) {
    console.error("Error al obtener los bloques de la página:", error);
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="mr-2 flex-shrink-0">
              <Link href="/dashboard/configuracion">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-md">
                    <LayoutTemplate className="h-8 w-8 text-indigo-600"/>
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Editor de Páginas</h1>
                    <p className="text-muted-foreground">Gestiona los bloques de la página de <span className="font-semibold text-indigo-600">Inicio</span>.</p>
                </div>
            </div>
        </div>
        {/* El botón para añadir nuevos bloques estará dentro del editor */}
      </div>
      
      {/* El componente cliente que manejará toda la lógica de edición, reordenación, etc. */}
      <EditorDeBloques initialBloques={(bloques as BloquePagina[]) || []} />

    </div>
  );
}
