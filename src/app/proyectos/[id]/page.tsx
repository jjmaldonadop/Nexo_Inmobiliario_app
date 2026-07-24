import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { FlujoMensual } from "@/lib/motor-financiero";
import { formatoFecha, formatoPct, formatoQ } from "@/lib/formato";
import { StatTile } from "@/components/stat-tile";
import { GraficaFlujoAcumulado } from "@/components/grafica-flujo-acumulado";
import { TablaFlujoMensual } from "@/components/tabla-flujo-mensual";
import { CalcularBoton } from "./calcular-boton";

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

  const ultimoResultado = proyecto.resultados[0] as (typeof proyecto.resultados)[number] | undefined;
  const flujoMensual = ultimoResultado
    ? (ultimoResultado.flujoCajaMensualJson as unknown as FlujoMensual[])
    : null;

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{proyecto.nombre}</h1>
          <p className="text-sm text-slate-500">
            {proyecto.ubicacion ?? "Sin ubicación"} — Zona {proyecto.zona.zona} ({proyecto.zona.nombre}) —{" "}
            {proyecto.estado}
          </p>
        </div>
        <CalcularBoton proyectoId={proyecto.id} />
      </div>

      {ultimoResultado && flujoMensual ? (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="VAN" value={formatoQ.format(ultimoResultado.van)} signoDe={ultimoResultado.van} />
            <StatTile label="TIR" value={formatoPct.format(ultimoResultado.tir)} signoDe={ultimoResultado.tir} />
            <StatTile label="ROI" value={formatoPct.format(ultimoResultado.roi)} signoDe={ultimoResultado.roi} />
            <StatTile
              label="Capital máximo requerido"
              value={formatoQ.format(ultimoResultado.maxCapitalRequerido)}
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="mb-3 font-medium">Flujo neto acumulado</h2>
            <GraficaFlujoAcumulado flujos={flujoMensual} />
          </section>

          <section className="space-y-3">
            <h2 className="font-medium">Flujo de caja mensual</h2>
            <TablaFlujoMensual filas={flujoMensual} />
          </section>
        </>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm text-slate-500">
            Todavía no se ha calculado este proyecto. Presiona &quot;Calcular resultados&quot; para
            generar el flujo de caja, VAN, TIR y ROI.
          </p>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 p-4">
        <h2 className="mb-2 font-medium">Terreno</h2>
        {proyecto.terreno ? (
          <p className="text-sm text-slate-700">
            {proyecto.terreno.areaM2.toLocaleString("es-GT")} m2 — Costo{" "}
            {formatoQ.format(proyecto.terreno.costoUSDPorVara2)}/vara2
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

      {proyecto.resultados.length > 0 && (
        <section className="rounded-lg border border-slate-200 p-4">
          <h2 className="mb-3 font-medium">Historial de cálculos</h2>
          <ul className="space-y-2">
            {proyecto.resultados.map((r) => (
              <li key={r.id} className="rounded bg-slate-100 p-3 text-sm">
                <p className="font-medium">
                  Escenario &quot;{r.escenario}&quot; — {formatoFecha.format(r.fechaCalculo)}
                </p>
                <p>
                  VAN: {formatoQ.format(r.van)} · TIR: {formatoPct.format(r.tir)} · ROI:{" "}
                  {formatoPct.format(r.roi)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
