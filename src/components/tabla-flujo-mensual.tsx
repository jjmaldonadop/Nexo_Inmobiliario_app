import { COLOR_NEGATIVO } from "@/lib/colores-grafica";
import { formatoQ } from "@/lib/formato";

export interface FlujoMensualFila {
  mes: number;
  ingresosConImpuestos: number;
  costosYGastos: number;
  flujoOperativo: number;
  intereses: number;
  isr: number;
  flujoNeto: number;
}

function Celda({ valor }: { valor: number }) {
  return (
    <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums" style={valor < 0 ? { color: COLOR_NEGATIVO } : undefined}>
      {formatoQ.format(valor)}
    </td>
  );
}

/** Tabla de flujo de caja mensual (sección 8.3 de la especificación) — cada tooltip de la
 * gráfica de arriba tiene su valor exacto también aquí, sin necesidad de pasar el mouse. */
export function TablaFlujoMensual({ filas }: { filas: FlujoMensualFila[] }) {
  let acumulado = 0;

  return (
    <div className="max-h-96 overflow-auto rounded border border-slate-200">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left">Mes</th>
            <th className="px-3 py-2 text-right">Ingresos</th>
            <th className="px-3 py-2 text-right">Costos y gastos</th>
            <th className="px-3 py-2 text-right">Flujo operativo</th>
            <th className="px-3 py-2 text-right">Intereses</th>
            <th className="px-3 py-2 text-right">ISR</th>
            <th className="px-3 py-2 text-right">Flujo neto</th>
            <th className="px-3 py-2 text-right">Acumulado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filas.map((f) => {
            acumulado += f.flujoNeto;
            return (
              <tr key={f.mes} className="hover:bg-slate-50">
                <td className="px-3 py-1.5 font-medium">{f.mes}</td>
                <Celda valor={f.ingresosConImpuestos} />
                <Celda valor={f.costosYGastos} />
                <Celda valor={f.flujoOperativo} />
                <Celda valor={f.intereses} />
                <Celda valor={f.isr} />
                <Celda valor={f.flujoNeto} />
                <Celda valor={acumulado} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
