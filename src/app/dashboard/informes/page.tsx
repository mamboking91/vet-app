import { Suspense } from 'react';
// Importamos la nueva acción
import { getVentasReport, getTopItemsReport } from './actions';
import ReportesCliente from './ReportesCliente';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

function Loader() {
  // ... (código del loader sin cambios)
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
       <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default async function InformesPage({
  searchParams,
}: {
  searchParams?: { from?: string; to?: string };
}) {
  const to = searchParams?.to ? new Date(searchParams.to) : endOfMonth(new Date());
  const from = searchParams?.from ? new Date(searchParams.from) : startOfMonth(subMonths(new Date(), 1));

  // Llamamos a ambas acciones en paralelo para mayor eficiencia
  const [ventasData, topItemsData] = await Promise.all([
    getVentasReport(from, to),
    getTopItemsReport(from, to)
  ]);

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Panel de Informes</h1>
        <p className="text-lg text-gray-600 mt-1">
          Analiza el rendimiento de la clínica con datos en tiempo real.
        </p>
      </header>

      <main>
        <Suspense fallback={<Loader />}>
          {/* Pasamos ambos conjuntos de datos al componente cliente */}
          <ReportesCliente 
            initialVentasData={ventasData}
            initialTopItemsData={topItemsData}
            defaultDates={{ from, to }} 
          />
        </Suspense>
      </main>
    </div>
  );
}