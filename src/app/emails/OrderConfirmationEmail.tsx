import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Row,
    Column,
    Link
  } from "@react-email/components";
  import * as React from "react";
  import { format } from "date-fns";
  import { es } from "date-fns/locale";
  
  // Tipos para las props del email
  interface Item {
    nombre: string;
    cantidad: number;
    precio_final_unitario: number;
  }
  
  interface Direccion {
      nombre_completo: string;
      direccion: string;
      localidad: string;
      provincia: string;
      codigo_postal: string;
  }
  
  interface OrderConfirmationEmailProps {
    pedidoId: string;
    fechaPedido: Date;
    direccionEnvio: Direccion;
    items: Item[];
    total: number;
    logoUrl?: string | null;
    isNewUser?: boolean;
  }
  
  const main = {
    backgroundColor: "#f6f9fc",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  };
  
  const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    border: "1px solid #f0f0f0",
    borderRadius: "4px",
  };
  
  const box = {
    padding: "0 48px",
  };
  
  const hr = {
    borderColor: "#e6ebf1",
    margin: "20px 0",
  };
  
  const paragraph = {
    color: "#525f7f",
    fontSize: "16px",
    lineHeight: "24px",
    textAlign: "left" as const,
  };
  
  const anchor = {
    color: "#2a6df5",
  };
  
  export const OrderConfirmationEmail = ({
    pedidoId,
    fechaPedido,
    direccionEnvio,
    items,
    total,
    logoUrl,
    isNewUser = false,
  }: OrderConfirmationEmailProps) => {
    const finalLogoUrl = logoUrl || "https://placehold.co/120x50/e2e8f0/e2e8f0?text=Gomera+Mascotas";
  
    return (
      <Html>
        <Head />
        <Preview>Confirmación de tu pedido en Gomera Mascotas #{pedidoId.substring(0, 8)}</Preview>
        <Body style={main}>
          <Container style={container}>
            <Section style={box}>
              <Img src={finalLogoUrl} width="120" height="auto" alt="Gomera Mascotas" />
              <Hr style={hr} />
              <Text style={paragraph}>
                ¡Gracias por tu compra, {direccionEnvio.nombre_completo}!
              </Text>
              
              {isNewUser && (
                <>
                  <Text style={paragraph}>
                    Hemos creado una cuenta para ti para que puedas ver tu historial de pedidos fácilmente. 
                    Para acceder, ve a nuestra página de inicio de sesión y utiliza la opción "¿Has olvidado tu contraseña?" 
                    con este mismo correo electrónico para establecer tu contraseña personal.
                  </Text>
                  <Hr style={hr} />
                </>
              )}
  
              <Text style={paragraph}>
                Hemos recibido tu pedido y lo estamos preparando para su envío. Aquí tienes un resumen de tu compra realizada el {format(fechaPedido, "PPP", { locale: es })}.
              </Text>
              <Text style={{ ...paragraph, fontWeight: "bold" }}>
                Número de Pedido: {pedidoId.substring(0, 8).toUpperCase()}
              </Text>
              <Hr style={hr} />
  
              {items.map((item) => (
                <Row key={item.nombre}>
                    <Column>
                        <Text style={paragraph}>{item.nombre} (x{item.cantidad})</Text>
                    </Column>
                     <Column align="right">
                        <Text style={paragraph}>{(item.precio_final_unitario * item.cantidad).toFixed(2)} €</Text>
                    </Column>
                </Row>
              ))}
              <Hr style={hr} />
  
              <Row>
                <Column>
                    <Text style={{...paragraph, fontWeight: "bold"}}>Total</Text>
                </Column>
                <Column align="right">
                    <Text style={{...paragraph, fontWeight: "bold"}}>{total.toFixed(2)} €</Text>
                </Column>
              </Row>
              <Hr style={hr} />
              
              <Section>
                <Text style={{ ...paragraph, fontWeight: "bold" }}>Dirección de envío</Text>
                <Text style={paragraph}>
                    {direccionEnvio.nombre_completo}<br/>
                    {direccionEnvio.direccion}<br/>
                    {direccionEnvio.codigo_postal} {direccionEnvio.localidad}, {direccionEnvio.provincia}
                </Text>
              </Section>
              <Hr style={hr} />
              <Text style={paragraph}>
                Si tienes alguna pregunta sobre tu pedido, no dudes en <a style={anchor} href="mailto:contacto@gomeramascotas.com">contactar con nosotros</a>.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  };
  
  export default OrderConfirmationEmail;