/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // reactStrictMode: true, // Puedes descomentar esto si quieres ser explícito

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rjkuylsjihqnfsodhmgq.supabase.co', // <-- Reemplaza con tu hostname si es diferente
        // port: '', // Generalmente no se necesita para https
        // pathname: '/storage/v1/object/public/clinic-assets/**', // Opcional: para ser más específico con la ruta
      },
      // Puedes añadir más objetos aquí para otros dominios permitidos
      // {
      //   protocol: 'https',
      //   hostname: 'otro.dominio.com',
      // },
    ],
  },
};

module.exports = nextConfig;