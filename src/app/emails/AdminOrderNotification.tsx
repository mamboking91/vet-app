import {
    Body, Container, Head, Heading, Hr, Html, Link, Preview, Text
  } from '@react-email/components';
  import * as React from 'react';
  
  interface AdminOrderNotificationProps {
    orderId: string;
    orderTotal: string;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/pedidos` : '';
  
  export const AdminOrderNotification = ({
    orderId,
    orderTotal
  }: AdminOrderNotificationProps) => (
    <Html>
      <Head />
      <Preview>¡Nuevo pedido recibido!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>¡Nuevo Pedido!</Heading>
          <Text style={paragraph}>
            Has recibido un nuevo pedido en tu tienda.
          </Text>
          <Text><strong>ID del Pedido:</strong> {orderId}</Text>
          <Text><strong>Total:</strong> {orderTotal} €</Text>
          <Hr style={hr} />
          <Link href={`${baseUrl}/${orderId}`} style={link}>
            Ver detalles del pedido en el dashboard
          </Link>
        </Container>
      </Body>
    </Html>
  );
  
  // Estilos (similares al otro correo)
  const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
  const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px', borderRadius: '5px' };
  const heading = { fontSize: '24px', lineHeight: '1.3', fontWeight: '700', color: '#484848' };
  const paragraph = { fontSize: '16px', lineHeight: '1.4', color: '#484848' };
  const hr = { borderColor: '#e6ebf1', margin: '20px 0' };
  const link = { color: '#007bff', fontSize: '14px', textDecoration: 'underline' };