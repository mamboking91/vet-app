import {
    Body, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text
  } from '@react-email/components';
  import * as React from 'react';
  
  // Asumimos que los detalles del pedido se pasarán como props
  interface CustomerOrderConfirmationProps {
    customerName: string;
    orderId: string;
    orderTotal: string;
    shippingAddress: any;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}` : '';
  
  export const CustomerOrderConfirmation = ({
    customerName,
    orderId,
    orderTotal,
    shippingAddress
  }: CustomerOrderConfirmationProps) => (
    <Html>
      <Head />
      <Preview>Confirmación de tu pedido en Vet App</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={`${baseUrl}/static/logo.png`} width="120" height="auto" alt="Vet App" style={logo} />
          <Heading style={heading}>¡Gracias por tu pedido, {customerName}!</Heading>
          <Text style={paragraph}>
            Hemos recibido tu pedido y ya lo estamos preparando. Te notificaremos cuando se haya enviado.
          </Text>
          <Section style={orderInfo}>
            <Text><strong>ID del Pedido:</strong> {orderId}</Text>
            <Text><strong>Total:</strong> {orderTotal} €</Text>
            <Text>
              <strong>Dirección de envío:</strong><br/>
              {shippingAddress.nombre_completo}<br/>
              {shippingAddress.direccion}<br/>
              {shippingAddress.localidad}, {shippingAddress.provincia}, {shippingAddress.codigo_postal}
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Si tienes alguna pregunta, no dudes en contactarnos.
          </Text>
          <Link href={baseUrl} style={link}>Vet App</Link>
        </Container>
      </Body>
    </Html>
  );
  
  // Estilos (puedes personalizarlos)
  const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
  const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px', borderRadius: '5px' };
  const logo = { margin: '0 auto' };
  const heading = { fontSize: '24px', lineHeight: '1.3', fontWeight: '700', color: '#484848' };
  const paragraph = { fontSize: '16px', lineHeight: '1.4', color: '#484848' };
  const orderInfo = { padding: '20px', backgroundColor: '#f2f2f2', borderRadius: '5px' };
  const hr = { borderColor: '#e6ebf1', margin: '20px 0' };
  const footer = { color: '#8898aa', fontSize: '12px', lineHeight: '15px' };
  const link = { color: '#007bff', textDecoration: 'none' };