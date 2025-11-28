
'use client';

// This is a dedicated loading UI for the dashboard route.
// Next.js automatically uses this file to show a loading state while the page content loads.
export default function DashboardLoading() {
  return (
    <div className="flex justify-center items-center h-full w-full">
      <p className="text-white text-xl">Carregando painel...</p>
    </div>
  );
}
