"use server";

import { z } from "zod";
import { Resend } from 'resend';

// Esquema de validación con Zod
const contactSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
  subject: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres." }),
  message: z.string().min(10, { message: "El mensaje debe tener al menos 10 caracteres." }),
});

// Server Action para procesar el formulario
export async function sendContactMessage(prevState: any, formData: FormData) {
  const validatedFields = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  // Si la validación falla, devolver los errores.
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(issue => issue.message).join(", ");
    return {
      message: `Error en los datos: ${errorMessages}`,
      error: true,
    };
  }
  
  const { name, email, subject, message } = validatedFields.data;
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.error("ADMIN_EMAIL no está configurado en las variables de entorno.");
    return {
      message: "No se pudo enviar el mensaje. Error de configuración del servidor.",
      error: true,
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Envío del email al administrador
    await resend.emails.send({
      from: 'Contacto Web <info@gomeramascotas.com>',
      to: adminEmail,
      subject: `Nuevo Mensaje de Contacto: ${subject}`,
      html: `
        <h1>Nuevo mensaje desde la web</h1>
        <p><strong>De:</strong> ${name} (${email})</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <hr>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    console.log("Mensaje de contacto enviado con éxito a:", adminEmail);
    return {
      message: "¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.",
      error: false,
    };

  } catch (error) {
    console.error("Error al enviar el email de contacto:", error);
    return {
      message: "Hubo un error al enviar tu mensaje. Por favor, inténtalo de nuevo más tarde.",
      error: true,
    };
  }
}
