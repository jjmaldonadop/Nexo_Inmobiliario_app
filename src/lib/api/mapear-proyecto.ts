import type { Prisma } from "@prisma/client";
import {
  calcularCostoTotalTerreno,
  type CurvaMensual,
  type ParametrosFiscales,
  type ProyectoParaCalculo,
} from "@/lib/motor-financiero";

const proyectoParaCalculoInclude = {
  terreno: true,
  costos: true,
  ventas: true,
  financiamiento: true,
} satisfies Prisma.ProyectoInclude;

export type ProyectoConRelaciones = Prisma.ProyectoGetPayload<{
  include: typeof proyectoParaCalculoInclude;
}>;

export { proyectoParaCalculoInclude };

/** El campo `Json` de Prisma se tipa como `JsonValue`; aquí confiamos en que el schema (zod, en
 * las API routes) ya garantizó la forma `CurvaMensual[]` al escribirlo. */
function comoCurvaMensual(valor: Prisma.JsonValue): CurvaMensual[] {
  return valor as unknown as CurvaMensual[];
}

/** Traduce el registro de Prisma (con sus relaciones) a la forma que espera el motor puro. */
export function mapearProyectoParaCalculo(
  proyecto: ProyectoConRelaciones,
  parametrosFiscales: ParametrosFiscales
): ProyectoParaCalculo {
  if (!proyecto.terreno) {
    throw new Error(`Proyecto ${proyecto.id} no tiene terreno registrado`);
  }
  if (!proyecto.financiamiento) {
    throw new Error(`Proyecto ${proyecto.id} no tiene financiamiento registrado`);
  }

  const terrenoCostoTotalQ = calcularCostoTotalTerreno(
    proyecto.terreno.costoUSDPorVara2,
    proyecto.terreno.areaM2,
    parametrosFiscales.factorM2AVaras2,
    proyecto.tipoCambioQxUSD
  );

  return {
    fechaInicio: proyecto.fechaInicio,
    duracionMeses: proyecto.duracionMeses,
    terrenoCostoTotalQ,
    costos: proyecto.costos.map((c) => ({
      montoTotal: c.montoTotal,
      mesInicio: c.mesInicio,
      mesesDuracion: c.mesesDuracion,
      curvaDesembolsoJson: c.curvaDesembolsoJson === null ? null : comoCurvaMensual(c.curvaDesembolsoJson),
    })),
    ventas: proyecto.ventas.map((v) => ({
      cantidad: v.cantidad,
      precioVentaSinImpuestosUSD: v.precioVentaSinImpuestosUSD,
      mesInicioVentas: v.mesInicioVentas,
      pctEnganche: v.pctEnganche,
      montoReservaQ: v.montoReservaQ,
      mesesEnganche: v.mesesEnganche,
      mesInicioEscrituracion: v.mesInicioEscrituracion,
      mesesEscrituracion: v.mesesEscrituracion,
    })),
    financiamiento: {
      tasaAnual: proyecto.financiamiento.tasaAnual,
      curvaDisposicionJson: comoCurvaMensual(proyecto.financiamiento.curvaDisposicionJson),
      curvaRepagoJson: comoCurvaMensual(proyecto.financiamiento.curvaRepagoJson),
    },
    capitalTotalSociosObjetivo: proyecto.financiamiento.capitalTotalSociosObjetivo,
    parametrosFiscales,
  };
}
