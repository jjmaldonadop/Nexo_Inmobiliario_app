// Adaptador: arma las curvas mensuales de un proyecto completo (terreno + costos + ventas +
// financiamiento) y las combina en un flujo de caja + indicadores finales. Es la pieza que las
// API routes usan para pasar de "forma Prisma" a "forma motor puro" — el motor en sí (tipos.ts,
// costos.ts, ventas.ts, financiamiento.ts, flujo-caja.ts, indicadores.ts) no conoce Prisma.
import { generarCurvaDesembolsoLineal } from "./costos";
import { calcularMaxCapitalRequerido, calcularROI, npv, xirr } from "./indicadores";
import { construirFlujoCaja } from "./flujo-caja";
import type { CurvaMensual, FlujoMensual, ParametrosFiscales } from "./tipos";
import {
  calcularImpuestosVenta,
  calcularIngresoSinImpuestos,
  generarCurvaEnganche,
  generarCurvaEscrituracion,
} from "./ventas";

export interface CostoProyecto {
  montoTotal: number;
  mesInicio: number | null;
  mesesDuracion: number | null;
  curvaDesembolsoJson: CurvaMensual[] | null;
}

export interface VentaProyecto {
  cantidad: number;
  precioVentaSinImpuestosUSD: number;
  mesInicioVentas: number;
  pctEnganche: number;
  montoReservaQ: number;
  mesesEnganche: number;
  mesInicioEscrituracion: number | null;
  mesesEscrituracion: number;
}

export interface FinanciamientoProyecto {
  tasaAnual: number;
  curvaDisposicionJson: CurvaMensual[];
  curvaRepagoJson: CurvaMensual[];
}

export interface ProyectoParaCalculo {
  fechaInicio: Date;
  duracionMeses: number;
  terrenoCostoTotalQ: number;
  costos: CostoProyecto[];
  ventas: VentaProyecto[];
  financiamiento: FinanciamientoProyecto;
  capitalTotalSociosObjetivo: number;
  parametrosFiscales: ParametrosFiscales;
}

export interface ResultadoCalculo {
  van: number;
  tir: number;
  roi: number;
  maxCapitalRequerido: number;
  isrTotal: number;
  utilidadDespuesImpuestos: number;
  flujoCajaMensual: FlujoMensual[];
}

function sumarCurvaEnArreglo(arreglo: number[], curva: CurvaMensual[]): void {
  for (const { mes, monto } of curva) {
    if (mes < 0 || mes >= arreglo.length) continue; // fuera del horizonte del proyecto
    arreglo[mes] += monto;
  }
}

/** Un mes 0 con fecha exacta y, desde ahí, fin de cada mes calendario sucesivo — misma
 * convención que las fechas reales de `FCF!I15` + `EOMONTH` (MOTOR_FINANCIERO.md §10). */
export function construirFechasMensuales(fechaInicio: Date, n: number): Date[] {
  const fechas: Date[] = [fechaInicio];
  for (let i = 1; i < n; i++) {
    const anterior = fechas[i - 1];
    // primer día del mes siguiente al mes de `anterior`, luego retrocedemos 1 día → fin de mes.
    const primerDiaSiguiente = new Date(anterior.getFullYear(), anterior.getMonth() + 2, 1);
    fechas.push(new Date(primerDiaSiguiente.getTime() - 24 * 60 * 60 * 1000));
  }
  return fechas;
}

function curvaDeCosto(costo: CostoProyecto): CurvaMensual[] {
  if (costo.curvaDesembolsoJson) return costo.curvaDesembolsoJson;
  if (costo.mesInicio !== null && costo.mesesDuracion !== null) {
    return generarCurvaDesembolsoLineal({
      montoTotal: costo.montoTotal,
      mesInicio: costo.mesInicio,
      mesesDuracion: costo.mesesDuracion,
    });
  }
  return [{ mes: costo.mesInicio ?? 0, monto: costo.montoTotal }];
}

export function calcularProyecto(p: ProyectoParaCalculo): ResultadoCalculo {
  const horizonte =
    Math.max(
      p.duracionMeses,
      ...p.costos.map((c) => (c.mesInicio ?? 0) + (c.mesesDuracion ?? 1)),
      ...p.ventas.map(
        (v) => (v.mesInicioEscrituracion ?? v.mesInicioVentas + v.mesesEnganche + 1) + v.mesesEscrituracion
      ),
      ...p.financiamiento.curvaDisposicionJson.map((c) => c.mes + 1),
      ...p.financiamiento.curvaRepagoJson.map((c) => c.mes + 1)
    ) + 1;

  const ingresosSinImpuestos = new Array(horizonte).fill(0);
  const ivaVenta = new Array(horizonte).fill(0);
  const timbresVenta = new Array(horizonte).fill(0);
  const costosYGastosSujetosAIVA = new Array(horizonte).fill(0);
  const costosYGastosConTerreno = new Array(horizonte).fill(0);
  const desembolsoCredito = new Array(horizonte).fill(0);
  const pagoPrincipal = new Array(horizonte).fill(0);

  // Terreno: desembolso único en el mes 0 (`FCF!I23`, MOTOR_FINANCIERO.md §7.3).
  costosYGastosConTerreno[0] += p.terrenoCostoTotalQ;

  for (const costo of p.costos) {
    const curva = curvaDeCosto(costo);
    sumarCurvaEnArreglo(costosYGastosConTerreno, curva);
    sumarCurvaEnArreglo(costosYGastosSujetosAIVA, curva);
  }

  const paramsImpuestoVenta = {
    iva: p.parametrosFiscales.iva,
    pctVentaConIVA: p.parametrosFiscales.pctVentaConIVA,
    timbres: p.parametrosFiscales.timbres,
    pctVentaConTimbres: p.parametrosFiscales.pctVentaConTimbres,
  };

  for (const venta of p.ventas) {
    const ingresoSinImpuestos = calcularIngresoSinImpuestos(venta.cantidad, venta.precioVentaSinImpuestosUSD);
    const { ivaSobreVenta, timbresSobreVenta } = calcularImpuestosVenta(ingresoSinImpuestos, paramsImpuestoVenta);

    const curvaEnganche = generarCurvaEnganche({
      precioSinImpuestos: ingresoSinImpuestos,
      pctEnganche: venta.pctEnganche,
      montoReserva: venta.montoReservaQ,
      mesesEnganche: venta.mesesEnganche,
      mesInicioVentas: venta.mesInicioVentas,
    });
    sumarCurvaEnArreglo(ingresosSinImpuestos, curvaEnganche);

    const mesInicioEscrituracion =
      venta.mesInicioEscrituracion ?? venta.mesInicioVentas + venta.mesesEnganche + 1;
    const pctSaldo = 1 - venta.pctEnganche;

    sumarCurvaEnArreglo(
      ingresosSinImpuestos,
      generarCurvaEscrituracion(ingresoSinImpuestos, pctSaldo, mesInicioEscrituracion, venta.mesesEscrituracion)
    );
    sumarCurvaEnArreglo(
      ivaVenta,
      generarCurvaEscrituracion(ivaSobreVenta, 1, mesInicioEscrituracion, venta.mesesEscrituracion)
    );
    sumarCurvaEnArreglo(
      timbresVenta,
      generarCurvaEscrituracion(timbresSobreVenta, 1, mesInicioEscrituracion, venta.mesesEscrituracion)
    );
  }

  sumarCurvaEnArreglo(desembolsoCredito, p.financiamiento.curvaDisposicionJson);
  sumarCurvaEnArreglo(pagoPrincipal, p.financiamiento.curvaRepagoJson);

  const flujoCajaMensual = construirFlujoCaja(
    {
      ingresosSinImpuestos,
      ivaVenta,
      timbresVenta,
      costosYGastosConTerreno,
      costosYGastosSujetosAIVA,
      desembolsoCredito,
      pagoPrincipal,
      tasaAnualCredito: p.financiamiento.tasaAnual,
    },
    p.parametrosFiscales
  );

  const fechas = construirFechasMensuales(p.fechaInicio, horizonte);
  const flujoNeto = flujoCajaMensual.map((f) => f.flujoNeto);

  const van = npv(p.parametrosFiscales.tasaDescuentoVANAnual / 12, flujoNeto);
  const tir = xirr(
    flujoCajaMensual.map((f, i) => ({ monto: f.flujoNeto, fecha: fechas[i] })),
    0.1
  );

  const isrTotal = flujoCajaMensual[flujoCajaMensual.length - 1]?.isr ?? 0;
  const interesesTotal = flujoCajaMensual.reduce((acc, f) => acc + f.intereses, 0);
  const flujoOperativoTotal = flujoCajaMensual.reduce((acc, f) => acc + f.flujoOperativo, 0);
  const utilidadDespuesImpuestos = flujoOperativoTotal - isrTotal - interesesTotal;

  const roi = calcularROI(utilidadDespuesImpuestos, p.capitalTotalSociosObjetivo);
  const maxCapitalRequerido = calcularMaxCapitalRequerido(flujoNeto);

  return { van, tir, roi, maxCapitalRequerido, isrTotal, utilidadDespuesImpuestos, flujoCajaMensual };
}
