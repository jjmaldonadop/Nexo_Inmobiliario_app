import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CalcularBoton } from "./calcular-boton";

const formatoQ = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });
const formatoPct = new Intl.NumberFormat("es-GT", { style: "percent", minimumFractionDigits: 2 });

// Igual que en la home: contenido por proyecto que cambia con cada cálculo, no estático.
export const dynamic = "force-dynamic";

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: {
      zona: true,
      terreno: true,
      costos: true,
      ventas: true,
      financiamiento: true,
      resultados: { orderBy: { fechaCalculo: "desc" } },
    },
  });

  if (!proyecto) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">{proyecto.nombre}</h1>
        <p className="text-sm text-slate-500">
          {proyecto.ubicacion ?? "Sin ubicación"} — Zona {proyecto.zona.zona} ({proyecto.zona.nombre}) —{" "}
          {proyecto.estado}
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-2 font-medium">Terreno</h2>
        {proyecto.terreno ? (
          <p className="text-sm text-slate-700">
            {proyecto.terreno.areaM2.toLocaleString("es-GT")} m2 — Costo {formatoQ.format(proyecto.terreno.costoUSDPorVara2)}/vara2
          </p>
        ) : (
          <p className="text-sm text-slate-400">Sin terreno registrado.</p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-2 font-medium">Costos ({proyecto.costos.length})</h2>
        <ul className="space-y-1 text-sm text-slate-700">
          {proyecto.costos.map((c) => (
            <li key={c.id}>
              {c.categoria} — {formatoQ.format(c.montoTotal)} ({c.grupo})
            </li>
          ))}
          {proyecto.costos.length === 0 && <li className="text-slate-400">Sin costos registrados.</li>}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-2 font-medium">Ventas ({proyecto.ventas.length})</h2>
        <ul className="space-y-1 text-sm text-slate-700">
          {proyecto.ventas.map((v) => (
            <li key={v.id}>
              {v.tipoUnidad}: {v.cantidad.toLocaleString("es-GT")} {v.unidad} ×{" "}
              {formatoQ.format(v.precioVentaSinImpuestosUSD)} (desde mes {v.mesInicioVentas})
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-2 font-medium">Financiamiento</h2>
        {proyecto.financiamiento ? (
          <p className="text-sm text-slate-700">
            Techo {formatoQ.format(proyecto.financiamiento.montoTechoCredito)} a{" "}
            {formatoPct.format(proyecto.financiamiento.tasaAnual)} anual — Capital socios objetivo{" "}
            {formatoQ.format(proyecto.financiamiento.capitalTotalSociosObjetivo)}
          </p>
        ) : (
          <p className="text-sm text-slate-400">Sin financiamiento registrado.</p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Resultados</h2>
          <CalcularBoton proyectoId={proyecto.id} />
        </div>
        {proyecto.resultados.length === 0 && (
          <p className="text-sm text-slate-400">Todavía no se ha calculado este proyecto.</p>
        )}
        <ul className="space-y-2">
          {proyecto.resultados.map((r) => (
            <li key={r.id} className="rounded bg-slate-100 p-3 text-sm">
              <p className="font-medium">
                Escenario &quot;{r.escenario}&quot; — {r.fechaCalculo.toLocaleString("es-GT")}
              </p>
              <p>
                VAN: {formatoQ.format(r.van)} · TIR: {formatoPct.format(r.tir)} · ROI: {formatoPct.format(r.roi)}
              </p>
              <p>
                Capital máximo requerido: {formatoQ.format(r.maxCapitalRequerido)} · ISR:{" "}
                {formatoQ.format(r.isrTotal)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
