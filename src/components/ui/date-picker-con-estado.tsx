// src/components/ui/date-picker-con-estado.tsx
"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon } from "lucide-react"
import type { SelectSingleEventHandler } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// La interfaz define las props que este componente controlado necesita.
export interface DatePickerConEstadoProps {
  date?: Date;
  onSelect: SelectSingleEventHandler;
}

// Este es nuestro nuevo componente, que es una versión "controlada" del original.
export function DatePickerConEstado({ date, onSelect }: DatePickerConEstadoProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : <span>Elige una fecha</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date} // Usa la prop `date` que le pasa el formulario
          onSelect={onSelect} // Llama a la función `onSelect` del formulario
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}
