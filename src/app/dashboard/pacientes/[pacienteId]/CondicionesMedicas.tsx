"use client";

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { actualizarCondicionesMedicas, CondicionesFormData } from './actions';

interface CondicionesMedicasProps {
  pacienteId: string;
  condiciones: string | null;
}

export default function CondicionesMedicas({ pacienteId, condiciones }: CondicionesMedicasProps) {
    const [isPending, startTransition] = useTransition();
    const [texto, setTexto] = useState(condiciones || "");

    const handleSave = () => {
        const data: CondicionesFormData = {
            condiciones_medicas_preexistentes: texto
        };
        
        startTransition(async () => {
            const result = await actualizarCondicionesMedicas(pacienteId, data);
            if (result.success) {
                toast.success("Condiciones médicas actualizadas.");
            } else {
                // --- INICIO DE LA CORRECCIÓN ---
                // Ahora podemos acceder a `result.error.message` de forma segura.
                toast.error("Error al actualizar", { description: result.error?.message });
                // --- FIN DE LA CORRECCIÓN ---
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" />Condiciones Médicas Preexistentes</CardTitle>
                <CardDescription>Alergias, enfermedades crónicas, etc. Esta información es crítica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Ej: Alergia a la penicilina, sufre de artrosis..."
                    rows={4}
                />
                <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? "Guardando..." : "Guardar Condiciones"}
                </Button>
            </CardContent>
        </Card>
    );
}