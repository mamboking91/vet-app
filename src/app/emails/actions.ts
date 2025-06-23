"use server";

import { Resend } from 'resend';
import OrderConfirmationEmail from '@/OrderConfirmationEmail'; // Importa la plantilla

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
interface OrderDataForEmail {
  pedidoId: string;
  fechaPedido: Date;
  direccionEnvio: DireccionEmail;
  items: ItemEmail[];
  total: number;
  emailTo: string; // El correo del cliente
  logoUrl?: string | null;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(orderData: OrderDataForEmail) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Gomera Mascotas <info@gomeramascotas.com>', // CAMBIA ESTO por tu dominio verificado en Resend
      to: [orderData.emailTo],
      subject: `Confirmación de tu pedido #${orderData.pedidoId.substring(0, 8)}`,
      react: OrderConfirmationEmail({
        pedidoId: orderData.pedidoId,
        fechaPedido: orderData.fechaPedido,
        direccionEnvio: orderData.direccionEnvio,
        items: orderData.items,
        total: orderData.total,
        logoUrl: orderData.logoUrl,
      }),
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