import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatoPct, formatoQ } from "@/lib/formato";
import { GraficaComparativa } from "@/components/grafica-comparativa";

export const dynamic = "force-dynamic";

interface FilaIndicador {
  etiqueta: string;
  valores: (string | null)[];
}

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  const ids = (idsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length < 2) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Panel comparativo</h1>
        <p className="text-sm text-slate-500">
          Selecciona 2 o más proyectos desde el dashboard para compararlos lado a lado.
        </p>
        <Link href="/" className="text-sm text-slate-900 underline">
          Volver al dashboard
        </Link>
      </main>
    );
  }

  const proyectosEncontrados = await prisma.proyecto.findMany({
    where: { id: { in: ids } },
    include: { zona: true, resultados: { orderBy: { fechaCalculo: "desc" }, take: 1 } },
  });

  // Preserva el orden en que se seleccionaron (el orden de `ids`), no el orden que devuelva la BD.
  const proyectos = ids
    .map((id) => proyectosEncontrados.find((p) => p.id === id))
    .filter((p): p is (typeof proyectosEncontrados)[number] => p !== undefined);

  const filas: FilaIndicador[] = [
    { etiqueta: "Zona", valores: proyectos.map((p) => `${p.zona.zona} — ${p.zona.nombre}`) },
    { etiqueta: "Estado", valores: proyectos.map((p) => p.estado) },
    {
      etiqueta: "VAN",
      valores: proyectos.map((p) => (p.resultados[0] ? formatoQ.format(p.resultados[0].van) : null)),
    },
    {
      etiqueta: "TIR",
      valores: proyectos.map((p) => (p.resultados[0] ? formatoPct.format(p.resultados[0].tir) : null)),
    },
    {
      etiqueta: "ROI",
      valores: proyectos.map((p) => (p.resultados[0] ? formatoPct.format(p.resultados[0].roi) : null)),
    },
    {
      etiqueta: "Capital máximo requerido",
      valores: proyectos.map((p) =>
        p.resultados[0] ? formatoQ.format(p.resultados[0].maxCapitalRequerido) : null
      ),
    },
    {
      etiqueta: "ISR total",
      valores: proyectos.map((p) => (p.resultados[0] ? formatoQ.format(p.resultados[0].isrTotal) : null)),
    },
    {
      etiqueta: "Utilidad después de impuestos",
      valores: proyectos.map((p) =>
        p.resultados[0] ? formatoQ.format(p.resultados[0].utilidadDespuesImpuestos) : null
      ),
    },
  ];

  const proyectosConResultado = proyectos.filter((p) => p.resultados[0]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel comparativo</h1>
          <p className="text-sm text-slate-500">{proyectos.length} proyectos seleccionados.</p>
        </div>
        <Link href="/" className="text-sm text-slate-900 underline">
          Volver al dashboard
        </Link>
      </div>

      {proyectosConResultado.length >= 2 ? (
        <GraficaComparativa
          proyectos={proyectosConResultado.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            van: p.resultados[0]!.van,
            tir: p.resultados[0]!.tir,
            roi: p.resultados[0]!.roi,
          }))}
        />
      ) : (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
          Al menos {2 - proyectosConResultado.length} de los proyectos seleccionados todavía no tiene
          resultados calculados — la gráfica necesita al menos 2 proyectos con cálculo.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Indicador
              </th>
              {proyectos.map((p) => (
                <th key={p.id} className="px-3 py-2 text-right">
                  <Link href={`/proyectos/${p.id}`} className="font-medium text-slate-900 hover:underline">
                    {p.nombre}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filas.map((fila) => (
              <tr key={fila.etiqueta} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-700">{fila.etiqueta}</td>
                {fila.valores.map((v, i) => (
                  <td key={proyectos[i]!.id} className="px-3 py-2 text-right tabular-nums">
                    {v ?? <span className="text-slate-400">Sin calcular</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
