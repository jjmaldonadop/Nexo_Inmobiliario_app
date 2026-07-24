// Réplica de `Costos Conceptual` (MOTOR_FINANCIERO.md §4).

export function calcularMontoCosto(costoPorM2: number, areaM2: number): number {
  return costoPorM2 * areaM2;
}

export function aplicarIVA(montoSinIVA: number, iva: number): number {
  return montoSinIVA * (1 + iva);
}

export function calcularCostoTotalProyecto(montos: number[]): number {
  return montos.reduce((acumulado, monto) => acumulado + monto, 0);
}

/**
 * costoTotalTerrenoQ = costoUSDPorVara2 * (areaM2 * factorM2AVaras2) * tipoCambioQxUSD
 * (`'Modelo de Desarrollo "Q"'!B35`, MOTOR_FINANCIERO.md §3).
 */
export function calcularCostoTotalTerreno(
  costoUSDPorVara2: number,
  areaM2: number,
  factorM2AVaras2: number,
  tipoCambioQxUSD: number
): number {
  return costoUSDPorVara2 * areaM2 * factorM2AVaras2 * tipoCambioQxUSD;
}

export interface CurvaDesembolsoLineal {
  montoTotal: number;
  mesInicio: number;
  mesesDuracion: number;
}

/** Modo simple del campo `Costo.curvaDesembolsoJson`: reparte `montoTotal` en partes iguales. */
export function generarCurvaDesembolsoLineal(c: CurvaDesembolsoLineal): { mes: number; monto: number }[] {
  const montoPorMes = c.montoTotal / c.mesesDuracion;
  return Array.from({ length: c.mesesDuracion }, (_, i) => ({
    mes: c.mesInicio + i,
    monto: montoPorMes,
  }));
}
