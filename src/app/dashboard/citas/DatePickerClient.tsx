"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerClientProps {
  initialDate: Date
}

export default function DatePickerClient({ initialDate }: DatePickerClientProps) {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(initialDate)

  useEffect(() => {
    setDate(initialDate)
  }, [initialDate])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      router.push(`/dashboard/citas?fecha=${formattedDate}`)
    } else {
      router.push(`/dashboard/citas`)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[320px] justify-between text-left font-medium bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 transition-all duration-200 shadow-sm hover:shadow-md",
            !date && "text-muted-foreground",
          )}
        >
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 mr-3">
              <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-normal">Fecha seleccionada</span>
              <span className="text-sm font-semibold">
                {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-xl border-0" align="start">
        <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            locale={es}
            className="rounded-lg"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
