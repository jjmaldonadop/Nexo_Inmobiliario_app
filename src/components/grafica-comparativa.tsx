"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLOR_EJE, COLOR_GRID, COLOR_TEXTO_MUTED, COLOR_TEXTO_SECUNDARIO, PALETA_CATEGORICA } from "@/lib/colores-grafica";
import { formatoPct, formatoQ, formatoQCompacto } from "@/lib/formato";

export interface ProyectoComparado {
  id: string;
  nombre: string;
  van: number;
  tir: number;
  roi: number;
}

interface DatoBarra {
  id: string;
  nombre: string;
  valor: number;
  color: string;
}

interface MiniBarChartProps {
  titulo: string;
  datos: DatoBarra[];
  /** Formato completo — usado en el tooltip y en la tabla comparativa de abajo. */
  formateador: (v: number) => string;
  formateadorEje: (v: number) => string;
  /** Formato corto para la etiqueta directa sobre la barra (por defecto, el mismo que
   * `formateador`); ver nota en `MiniBarChart` sobre por qué VAN necesita uno más corto. */
  formateadorEtiqueta?: (v: number) => string;
}

interface LabelRenderProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: unknown;
}

/** "Value at the tip" (marks-and-anatomy.md): con barras negativas la punta está ABAJO, no
 * arriba — `position="top"` de Recharts las apilaría todas contra la línea base. Este render
 * a medida decide el lado según el signo de cada valor. */
function etiquetaEnLaPunta(formateador: (v: number) => string) {
  return function EtiquetaValor(props: LabelRenderProps) {
    const value = typeof props.value === "number" ? props.value : undefined;
    if (value === undefined) return null;
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const height = Number(props.height ?? 0);
    const cx = x + width / 2;
    const cy = value < 0 ? y + height + 14 : y - 6;
    return (
      <text x={cx} y={cy} textAnchor="middle" fontSize={11} fill={COLOR_TEXTO_SECUNDARIO}>
        {formateador(value)}
      </text>
    );
  };
}

// VAN, TIR y ROI tienen escalas distintas (Quetzales vs. %): un solo eje mezclándolas sería el
// anti-patrón de doble eje, así que cada indicador es su propia gráfica pequeña — la identidad
// del proyecto (color) es lo único que se comparte entre las tres (skill de dataviz).
//
// La etiqueta directa usa `formateadorEtiqueta` (corto) en vez de `formateador` (completo): con
// barras de hasta 3-4 proyectos y solo 48px de ancho, un monto en Quetzales con dos decimales es
// más ancho que la barra y las etiquetas de barras vecinas chocan entre sí. El valor exacto sigue
// disponible en el tooltip y en la tabla de abajo — la etiqueta corta nunca es la única fuente.
function MiniBarChart({ titulo, datos, formateador, formateadorEje, formateadorEtiqueta }: MiniBarChartProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-medium text-slate-700">{titulo}</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 20, right: 8, left: 8, bottom: 20 }}>
            <CartesianGrid vertical={false} stroke={COLOR_GRID} />
            <XAxis dataKey="id" tick={false} axisLine={{ stroke: COLOR_EJE }} tickLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: COLOR_TEXTO_MUTED, fontSize: 11 }}
              tickFormatter={formateadorEje}
              width={56}
            />
            <Tooltip
              cursor={{ fill: COLOR_GRID }}
              contentStyle={{ borderRadius: 8, borderColor: COLOR_GRID, fontSize: 13 }}
              formatter={(value) => [formateador(Number(value)), titulo]}
              labelFormatter={(_id, payload) => payload?.[0]?.payload?.nombre ?? ""}
            />
            <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {datos.map((d) => (
                <Cell key={d.id} fill={d.color} />
              ))}
              <LabelList dataKey="valor" content={etiquetaEnLaPunta(formateadorEtiqueta ?? formateador)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function GraficaComparativa({ proyectos }: { proyectos: ProyectoComparado[] }) {
  const conColor = proyectos.map((p, i) => ({ ...p, color: PALETA_CATEGORICA[i % PALETA_CATEGORICA.length] }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {conColor.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5 text-sm text-slate-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            {p.nombre}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniBarChart
          titulo="VAN"
          datos={conColor.map((p) => ({ id: p.id, nombre: p.nombre, valor: p.van, color: p.color }))}
          formateador={(v) => formatoQ.format(v)}
          formateadorEje={(v) => formatoQCompacto.format(v)}
          formateadorEtiqueta={(v) => formatoQCompacto.format(v)}
        />
        <MiniBarChart
          titulo="TIR"
          datos={conColor.map((p) => ({ id: p.id, nombre: p.nombre, valor: p.tir, color: p.color }))}
          formateador={(v) => formatoPct.format(v)}
          formateadorEje={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <MiniBarChart
          titulo="ROI"
          datos={conColor.map((p) => ({ id: p.id, nombre: p.nombre, valor: p.roi, color: p.color }))}
          formateador={(v) => formatoPct.format(v)}
          formateadorEje={(v) => `${(v * 100).toFixed(0)}%`}
        />
      </div>
    </div>
  );
}
