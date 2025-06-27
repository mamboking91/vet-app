"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sendContactMessage } from "./actions";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

// Botón de envío con estado de carga
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enviando...
        </>
      ) : (
        "Enviar Mensaje"
      )}
    </Button>
  );
}

// Componente principal del formulario
export default function ContactForm() {
  const initialState = { message: "", error: false };
  const [state, dispatch] = useFormState(sendContactMessage, initialState);

  return (
    <form action={dispatch} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required placeholder="Tu nombre completo" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="tu@email.com" />
      </div>
      <div>
        <Label htmlFor="subject">Asunto</Label>
        <Input id="subject" name="subject" required placeholder="Motivo de tu consulta" />
      </div>
      <div>
        <Label htmlFor="message">Mensaje</Label>
        <Textarea id="message" name="message" required rows={5} placeholder="Escribe tu mensaje aquí..." />
      </div>
      <SubmitButton />
      
      {state.message && (
        <div 
          className={`mt-4 flex items-center gap-3 rounded-lg p-3 text-sm ${
            state.error 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}
        >
          {state.error ? <AlertCircle className="h-5 w-5"/> : <CheckCircle className="h-5 w-5"/>}
          <p>{state.message}</p>
        </div>
      )}
    </form>
  );
}
