"use client";

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { agregarRecordatorio, RecordatorioFormData } from '../../actions';
import { tiposDeRecordatorioOpciones } from '../../../types';

// Esquema de validación con Zod para el formulario
const formSchema = z.object({
  tipo: z.enum(tiposDeRecordatorioOpciones, {
    required_error: "Debes seleccionar un tipo de recordatorio.",
  }),
  fecha_proxima: z.date({
    required_error: "La fecha es obligatoria.",
  }),
  notas: z.string().optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

export default function RecordatorioForm({ pacienteId }: { pacienteId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { handleSubmit, control, formState: { errors } } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fecha_proxima: new Date(),
      notas: "",
    },
  });

  // La función `onSubmit` ahora recibe los datos validados del formulario
  const onSubmit = (data: FormSchemaType) => {
    startTransition(async () => {
      // Llamamos a la acción con los dos argumentos que espera: pacienteId y el objeto de datos.
      const result = await agregarRecordatorio(pacienteId, data);
      
      if (result.success) {
        toast.success("Recordatorio añadido con éxito.");
        router.push(`/dashboard/pacientes/${pacienteId}`);
      } else {
        // Accedemos a la propiedad `message` del objeto de error.
        toast.error("Error al añadir recordatorio", { description: result.error?.message });
      }
    });
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader><CardTitle>Detalles del Recordatorio</CardTitle></CardHeader>
      <CardContent>
        {/* Usamos el `handleSubmit` de react-hook-form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label>Tipo de Recordatorio</Label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDeRecordatorioOpciones.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipo && <p className="text-sm text-red-500 mt-1">{errors.tipo.message}</p>}
          </div>
          <div>
            <Label>Fecha Próxima</Label>
            <Controller
              name="fecha_proxima"
              control={control}
              render={({ field }) => (
                <DatePicker date={field.value} onDateChange={field.onChange} />
              )}
            />
            {errors.fecha_proxima && <p className="text-sm text-red-500 mt-1">{errors.fecha_proxima.message}</p>}
          </div>
          <div>
            <Label htmlFor="notas">Notas (Opcional)</Label>
            <Controller
                name="notas"
                control={control}
                render={({ field }) => (
                    <Textarea id="notas" placeholder="Ej: Traer cartilla de vacunación..." {...field} />
                )}
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Guardando...' : 'Guardar Recordatorio'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}