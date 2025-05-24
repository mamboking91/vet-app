// app/dashboard/EspeciesChart.tsx
"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { EspecieData } from './page'; // Importa el tipo desde la página del dashboard

interface EspeciesChartProps {
  data: EspecieData[];
}

// Define una paleta de colores para el gráfico
// Puedes expandir esta lista si tienes muchas especies
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF5733', '#33FF57'];

export default function EspeciesChart({ data }: EspeciesChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay datos suficientes para mostrar el gráfico.</p>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}> {/* Contenedor con dimensiones para Recharts */}
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%" // Centro X
            cy="50%" // Centro Y
            labelLine={false}
            // label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} // Etiqueta opcional en las porciones
            outerRadius={80} // Radio exterior del pastel
            fill="#8884d8"
            dataKey="value" // La propiedad de 'data' que contiene los valores numéricos
            nameKey="name"  // La propiedad de 'data' que contiene los nombres/etiquetas
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [`${value} paciente(s)`, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}