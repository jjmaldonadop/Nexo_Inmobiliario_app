"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLOR_EJE, COLOR_GRID, COLOR_SERIE, COLOR_SERIE_FILL, COLOR_TEXTO_MUTED } from "@/lib/colores-grafica";
import { formatoQ, formatoQCompacto } from "@/lib/formato";

interface FlujoMes {
  mes: number;
  flujoNeto: number;
}

/** Serie única (flujo neto acumulado) — sin caja de leyenda, el título ya dice qué se grafica.
 * Área a ~10% de opacidad + línea de 2px, grid en hairline recesivo (skill de dataviz). */
export function GraficaFlujoAcumulado({ flujos }: { flujos: FlujoMes[] }) {
  const datos = useMemo(() => {
    let acumulado = 0;
    return flujos.map((f) => {
      acumulado += f.flujoNeto;
      return { mes: f.mes, flujoNetoAcumulado: acumulado };
    });
  }, [flujos]);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={COLOR_GRID} />
          <XAxis
            dataKey="mes"
            tickLine={false}
            axisLine={{ stroke: COLOR_EJE }}
            tick={{ fill: COLOR_TEXTO_MUTED, fontSize: 12 }}
            tickFormatter={(mes: number) => `Mes ${mes}`}
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: COLOR_TEXTO_MUTED, fontSize: 12 }}
            tickFormatter={(v: number) => formatoQCompacto.format(v)}
            width={68}
          />
          <Tooltip
            cursor={{ stroke: COLOR_EJE, strokeWidth: 1 }}
            contentStyle={{ borderRadius: 8, borderColor: COLOR_GRID, fontSize: 13 }}
            formatter={(value) => [formatoQ.format(Number(value)), "Flujo neto acumulado"]}
            labelFormatter={(mes) => `Mes ${mes}`}
          />
          <Area
            type="monotone"
            dataKey="flujoNetoAcumulado"
            stroke={COLOR_SERIE}
            strokeWidth={2}
            fill={COLOR_SERIE_FILL}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
