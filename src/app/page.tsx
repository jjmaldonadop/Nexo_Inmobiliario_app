import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TablaProyectos, type ProyectoFila } from "@/components/tabla-proyectos";

// La lista de proyectos cambia con cada creación/cálculo — no tiene sentido prerenderizarla
// estáticamente (y el build fallaría sin una base de datos disponible en tiempo de build).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const proyectos = await prisma.proyecto.findMany({
    include: { zona: true, resultados: { orderBy: { fechaCalculo: "desc" }, take: 1 } },
    orderBy: { fechaCreacion: "desc" },
  });

  const filas: ProyectoFila[] = proyectos.map((p) => {
    const ultimo = p.resultados[0];
    return {
      id: p.id,
      nombre: p.nombre,
      zona: p.zona.zona,
      estado: p.estado,
      van: ultimo?.van ?? null,
      tir: ultimo?.tir ?? null,
      roi: ultimo?.roi ?? null,
    };
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nexo Inmobiliario</h1>
          <p className="text-sm text-slate-500">Panel de proyectos de factibilidad financiera.</p>
        </div>
        <Link
          href="/proyectos/nuevo"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Nuevo proyecto
        </Link>
      </div>

      {proyectos.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay proyectos registrados.</p>
      ) : (
        <TablaProyectos proyectos={filas} />
      )}
    </main>
  );
}
