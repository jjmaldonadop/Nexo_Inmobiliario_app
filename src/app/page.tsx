import Link from "next/link";
import { prisma } from "@/lib/prisma";

// La lista de proyectos cambia con cada creación/cálculo — no tiene sentido prerenderizarla
// estáticamente (y el build fallaría sin una base de datos disponible en tiempo de build).
export const dynamic = "force-dynamic";

const formatoQ = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });
const formatoPct = new Intl.NumberFormat("es-GT", { style: "percent", minimumFractionDigits: 2 });

export default async function HomePage() {
  const proyectos = await prisma.proyecto.findMany({
    include: { zona: true, resultados: { orderBy: { fechaCalculo: "desc" }, take: 1 } },
    orderBy: { fechaCreacion: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nexo Inmobiliario</h1>
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
        <ul className="space-y-2">
          {proyectos.map((p) => {
            const ultimo = p.resultados[0];
            return (
              <li key={p.id}>
                <Link
                  href={`/proyectos/${p.id}`}
                  className="block rounded-lg border border-slate-200 p-4 hover:bg-slate-100"
                >
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-sm text-slate-500">
                    Zona {p.zona.zona} — {p.estado}
                    {ultimo && ` — VAN ${formatoQ.format(ultimo.van)} — TIR ${formatoPct.format(ultimo.tir)}`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
