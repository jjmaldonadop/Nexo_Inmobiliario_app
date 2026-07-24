// Orquestador del flujo de caja mensual (MOTOR_FINANCIERO.md §7). Combina curvas ya generadas
// por costos.ts / ventas.ts / financiamiento.ts — no genera esas curvas por sí mismo.
import type { FlujoMensual, ParametrosFiscales } from "./tipos";

export interface CurvasFlujoCaja {
  /** Un valor por mes (índice 0..n-1), ya agregando todas las unidades/categorías. */
  ingresosSinImpuestos: number[];
  ivaVenta: number[];
  timbresVenta: number[];
  /** Costos + gastos + terreno del mes (`FCF!I50`, incluye terreno). */
  costosYGastosConTerreno: number[];
  /** Subconjunto de lo anterior que sí genera crédito fiscal de IVA: costos generales +
   * developer fee + gastos indirectos, EXCLUYE terreno (`FCF!I51 = (I24+I39+I40)*iva*pct`). */
  costosYGastosSujetosAIVA: number[];
  desembolsoCredito: number[];
  pagoPrincipal: number[];
  tasaAnualCredito: number;
}

/**
 * flujoOperativo[t]         = ingresosConImpuestos[t] - costosYGastosConTerreno[t] - ivaCostos[t]
 * saldoCredito[t]           = saldoCredito[t-1] + desembolsoCredito[t] - pagoPrincipal[t-1]
 * intereses[t]              = saldoCredito[t] * (tasaAnualCredito / 12)
 * flujoConFinanciamiento[t] = flujoOperativo[t] + desembolsoCredito[t] - intereses[t] - pagoPrincipal[t]
 * ISR (único, último mes)   = SUM(flujoConFinanciamiento) * isr * factorBaseGravableISR
 * flujoNeto[t]               = flujoConFinanciamiento[t] - ISR[t]
 */
export function construirFlujoCaja(c: CurvasFlujoCaja, params: ParametrosFiscales): FlujoMensual[] {
  const n = c.ingresosSinImpuestos.length;
  const tasaMensual = c.tasaAnualCredito / 12;

  const flujos: FlujoMensual[] = [];
  let saldoCredito = 0;
  let pagoPrincipalAnterior = 0;

  for (let t = 0; t < n; t++) {
    const ingresosConImpuestos = c.ingresosSinImpuestos[t] + c.ivaVenta[t] + c.timbresVenta[t];
    const ivaCostos = c.costosYGastosSujetosAIVA[t] * params.iva * params.pctCostosConCreditoFiscalIVA;
    const flujoOperativo = ingresosConImpuestos - c.costosYGastosConTerreno[t] - ivaCostos;

    const desembolsoCredito = c.desembolsoCredito[t];
    saldoCredito = saldoCredito + desembolsoCredito - pagoPrincipalAnterior;
    const intereses = saldoCredito * tasaMensual;
    const pagoPrincipal = c.pagoPrincipal[t];

    const flujoConFinanciamiento = flujoOperativo + desembolsoCredito - intereses - pagoPrincipal;

    flujos.push({
      mes: t,
      ingresosSinImpuestos: c.ingresosSinImpuestos[t],
      ivaVenta: c.ivaVenta[t],
      timbresVenta: c.timbresVenta[t],
      ingresosConImpuestos,
      costosYGastos: c.costosYGastosConTerreno[t],
      ivaCostos,
      flujoOperativo,
      desembolsoCredito,
      saldoCredito,
      intereses,
      pagoPrincipal,
      flujoConFinanciamiento,
      isr: 0,
      flujoNeto: flujoConFinanciamiento,
    });

    pagoPrincipalAnterior = pagoPrincipal;
  }

  aplicarISRTerminal(flujos, params);

  return flujos;
}

/** ISR = SUM(flujoConFinanciamiento de todos los meses) * isr * factorBaseGravableISR,
 * reconocido solo en el último mes (`FCF!BO81`, MOTOR_FINANCIERO.md §7.6). Muta `flujos` in
 * place para evitar recorrer el arreglo dos veces en el caller. */
function aplicarISRTerminal(flujos: FlujoMensual[], params: ParametrosFiscales): void {
  if (flujos.length === 0) return;

  const sumaFlujoConFinanciamiento = flujos.reduce((acc, f) => acc + f.flujoConFinanciamiento, 0);
  const isrTotal = sumaFlujoConFinanciamiento * params.isr * params.factorBaseGravableISR;

  const ultimo = flujos[flujos.length - 1];
  ultimo.isr = isrTotal;
  ultimo.flujoNeto = ultimo.flujoConFinanciamiento - isrTotal;
}
