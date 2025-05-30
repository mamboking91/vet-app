// src/app/components/ui/date-picker.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale"; // Para localización en español
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils"; // Tu utilidad para classnames
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  // Puedes añadir más props si necesitas, como disabledDates, etc.
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Selecciona una fecha",
  disabled = false,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    setIsOpen(false); // Cierra el popover al seleccionar una fecha
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal", // Ajustado a w-full para que tome el ancho del contenedor del form
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          locale={es} // Para que el calendario en sí esté en español
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}