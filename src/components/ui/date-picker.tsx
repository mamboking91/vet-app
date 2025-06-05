"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

interface DatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Selecciona una fecha",
  disabled = false,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const calendarContentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const toggleCalendar = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev)
    }
  }

  const handleSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate)
    // Los botones Aceptar/Cancelar o el overlay se encargarán de cerrar.
  }

  React.useEffect(() => {
    if (!isOpen || !isMounted) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, isMounted])

  const renderCalendar = () => {
    if (!isOpen || !isMounted) return null

    return createPortal(
      <div
        className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
        onClick={() => setIsOpen(false)}
      >
        <div
          ref={calendarContentRef}
          className="bg-background rounded-lg shadow-xl max-w-xs w-full p-4 sm:p-6 animate-in zoom-in-90 duration-150 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {date ? format(date, "PPP", { locale: es }) : placeholder}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>

          {/* Contenedor del Calendario Centrado */}
          <div className="flex justify-center items-center flex-grow">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              locale={es}
              disabled={disabled}
              initialFocus
              className="rounded-md border-0 p-0 [&_table]:mx-auto [&_button]:rounded-md [&_td]:p-0 [&_.rdp-head_cell]:p-1 [&_.rdp-cell]:p-0.5"
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false)
              }}
              className="w-full sm:flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setIsOpen(false)
              }}
              className="w-full sm:flex-1"
            >
              Aceptar
            </Button>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  return (
    <>
      <Button
        variant="outline"
        disabled={disabled}
        className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground", className)}
        onClick={toggleCalendar}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        type="button"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
      </Button>
      {renderCalendar()}
    </>
  )
}
