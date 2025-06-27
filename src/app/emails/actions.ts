// src/app/emails/actions.ts

"use server";

import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/app/emails/OrderConfirmationEmail'; // Importa la plantilla

// Tipos para los datos que necesita la acción
interface ItemEmail {
  nombre: string;
  cantidad: number;
  precio_final_unitario: number;
}
interface DireccionEmail {
    nombre_completo: string;
    direccion: string;
    localidad: string;
    provincia: string;
    codigo_postal: string;
}

// --- INICIO DE LA CORRECCIÓN 1 ---
interface OrderDataForEmail {
  pedidoId: string;
  fechaPedido: Date;
  direccionEnvio: DireccionEmail;
  items: ItemEmail[];
  total: number;
  emailTo: string; // El correo del cliente
  logoUrl?: string | null;
  customerName: string; // Añadimos la propiedad que falta
}
// --- FIN DE LA CORRECCIÓN 1 ---

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(orderData: OrderDataForEmail) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Gomera Mascotas <info@gomeramascotas.com>',
      to: [orderData.emailTo],
      subject: `Confirmación de tu pedido #${orderData.pedidoId.substring(0, 8)}`,
      // --- INICIO DE LA CORRECCIÓN 2 ---
      // Pasamos la propiedad customerName al componente del email
      react: OrderConfirmationEmail({
        pedidoId: orderData.pedidoId,
        fechaPedido: orderData.fechaPedido,
        direccionEnvio: orderData.direccionEnvio,
        items: orderData.items,
        total: orderData.total,
        logoUrl: orderData.logoUrl,
        customerName: orderData.customerName, // La pasamos aquí
      }),
      // --- FIN DE LA CORRECCIÓN 2 ---
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("Email sent successfully:", data);
    return { success: true };

  } catch (error: any) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
}