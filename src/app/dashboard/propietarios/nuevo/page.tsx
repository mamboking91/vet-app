// app/dashboard/propietarios/nuevo/page.tsx
import React from 'react';
import PropietarioForm from './propietarioForm'; // Crearemos este componente a continuación

export default function NuevoPropietarioPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Añadir Nuevo Propietario</h1>
      <PropietarioForm />
    </div>
  );
}