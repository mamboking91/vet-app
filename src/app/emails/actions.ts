// src/app/emails/actions.ts

"use server";

import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/app/emails/OrderConfirmationEmail';

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
  emailTo: string;
  logoUrl?: string | null;
  customerName: string;
  isNewUser?: boolean;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(orderData: OrderDataForEmail) {
  try {
    const { data, error } = await resend.emails.send({
      // --- CONFIGURACIÓN PARA DESARROLLO Y PRUEBAS ---
      // Resend solo te permite enviar desde este email y a tu propio correo
      // si no has verificado un dominio.
      from: 'Gomera Mascotas <onboarding@resend.dev>',
      to: ['gomeramascotas@gmail.com'], // Asegúrate que este sea el email con el que te registraste en Resend.

      // --- CONFIGURACIÓN PARA PRODUCCIÓN ---
      // Cuando tengas tu dominio verificado, comenta las dos líneas de arriba
      // y descomenta las dos siguientes.
      // from: 'Gomera Mascotas <info@gomeramascotas.com>',
      // to: [orderData.emailTo],

      subject: `Confirmación de tu pedido #${orderData.pedidoId.substring(0, 8)}`,
      react: OrderConfirmationEmail({
        pedidoId: orderData.pedidoId,
        fechaPedido: orderData.fechaPedido,
        direccionEnvio: orderData.direccionEnvio,
        items: orderData.items,
        total: orderData.total,
        logoUrl: orderData.logoUrl,
        customerName: orderData.customerName,
        isNewUser: orderData.isNewUser,
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("Email de confirmación enviado con éxito:", data);
    return { success: true, data };

  } catch (error: any) {
    console.error("Fallo al enviar el email:", error);
    return { success: false, error: error.message };
  }
}