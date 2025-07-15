"use client";

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { agregarMedicion, MedicionFormData } from '../../actions';

const formSchema = z.object({
  fecha_medicion: z.date({ required_error: "La fecha es obligatoria." }),
  peso: z.string().optional(),
  temperatura: z.string().optional(),
  frecuencia_cardiaca: z.string().optional(),
  frecuencia_respiratoria: z.string().optional(),
  mucosas: z.string().optional(),
  notas: z.string().optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

export default function MedicionForm({ pacienteId }: { pacienteId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: { fecha_medicion: new Date(), notas: "", mucosas: "", peso: "", temperatura: "", frecuencia_cardiaca: "", frecuencia_respiratoria: "" }
  });

  const onSubmit = (data: FormSchemaType) => {
    startTransition(async () => {
      const result = await agregarMedicion(pacienteId, data);
      if (result.success) {
        toast.success("Medición añadida con éxito.");
        router.push(`/dashboard/pacientes/${pacienteId}`);
      } else {
        toast.error("Error al añadir medición", { description: result.error?.message });
      }
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader><CardTitle>Detalles de la Medición</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <Label>Fecha</Label>
                <Controller
                  name="fecha_medicion"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                    />
                  )}
                />
                {errors.fecha_medicion && <p className="text-sm text-red-500 mt-1">{errors.fecha_medicion.message}</p>}
             </div>
             <div>
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input id="peso" type="text" inputMode="decimal" placeholder="Ej: 5.4" {...register("peso")} />
             </div>
             <div>
                <Label htmlFor="temperatura">Temperatura (°C)</Label>
                <Input id="temperatura" type="text" inputMode="decimal" placeholder="Ej: 38.5" {...register("temperatura")} />
             </div>
             <div>
                <Label htmlFor="frecuencia_cardiaca">Frec. Cardíaca (ppm)</Label>
                <Input id="frecuencia_cardiaca" type="text" inputMode="numeric" placeholder="Ej: 80" {...register("frecuencia_cardiaca")} />
             </div>
             <div>
                <Label htmlFor="frecuencia_respiratoria">Frec. Respiratoria (rpm)</Label>
                <Input id="frecuencia_respiratoria" type="text" inputMode="numeric" placeholder="Ej: 20" {...register("frecuencia_respiratoria")} />
             </div>
             <div>
                <Label htmlFor="mucosas">Mucosas</Label>
                <Input id="mucosas" {...register("mucosas")} />
             </div>
          </div>
          <div>
            <Label htmlFor="notas">Notas Adicionales</Label>
            <Textarea id="notas" {...register("notas")} />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Guardando...' : 'Guardar Medición'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}