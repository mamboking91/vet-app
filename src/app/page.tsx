import { Button } from "@/components/ui/button"; // Asegúrate que la ruta del alias sea correcta

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">¡Bienvenido a la Clínica Veterinaria!</h1>
      <Button>Haz Clic Aquí</Button>
    </main>
  );
}