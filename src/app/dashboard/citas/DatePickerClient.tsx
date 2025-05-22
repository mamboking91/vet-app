// app/dashboard/citas/DatePickerClient.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns'; // Ya tienes format
import { es } from 'date-fns/locale'; // <--- AÑADE ESTA LÍNEA DE IMPORTACIÓN
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerClientProps {
  initialDate: Date; 
}

export default function DatePickerClient({ initialDate }: DatePickerClientProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(initialDate);

  useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    // Cuando una fecha es seleccionada en el calendario, actualiza el estado local
    // y navega a la nueva URL con el parámetro 'fecha'.
    // El Popover se cerrará automáticamente al seleccionar una fecha.
    setDate(selectedDate);
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      router.push(`/dashboard/citas?fecha=${formattedDate}`);
    } else {
      // Si la fecha se deselecciona (si el calendario lo permite),
      // podríamos querer ir a la vista de citas sin filtro de fecha.
      router.push(`/dashboard/citas`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal", // Aumenté un poco el ancho
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          locale={es} // También es bueno pasar el locale al Calendar para la UI del calendario
        />
      </PopoverContent>
    </Popover>
  );
}