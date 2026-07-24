// Réplica de `Ventas Conceptual` y `Est Enganches + Lista precios` (MOTOR_FINANCIERO.md §5-6).
import type { CurvaMensual } from "./tipos";

export interface ParametrosImpuestoVenta {
  iva: number;
  pctVentaConIVA: number;
  timbres: number;
  pctVentaConTimbres: number;
}

export function calcularIngresoSinImpuestos(cantidad: number, precioUnitarioSinImpuestos: number): number {
  return cantidad * precioUnitarioSinImpuestos;
}

export interface ImpuestosVenta {
  ivaSobreVenta: number;
  timbresSobreVenta: number;
  ingresoConImpuestos: number;
}

/**
 * ivaSobreVenta = ingresoSinImpuestos * pctVentaConIVA * iva        (70% * 12%)
 * timbresSobreVenta = ingresoSinImpuestos * pctVentaConTimbres * timbres  (30% * 3%)
 */
export function calcularImpuestosVenta(
  ingresoSinImpuestos: number,
  p: ParametrosImpuestoVenta
): ImpuestosVenta {
  const ivaSobreVenta = ingresoSinImpuestos * p.pctVentaConIVA * p.iva;
  const timbresSobreVenta = ingresoSinImpuestos * p.pctVentaConTimbres * p.timbres;
  return {
    ivaSobreVenta,
    timbresSobreVenta,
    ingresoConImpuestos: ingresoSinImpuestos + ivaSobreVenta + timbresSobreVenta,
  };
}

/**
 * Factor combinado precio-con-impuestos / precio-sin-impuestos
 * (`Ventas Conceptual!D5`, factor 1.093 = 0.7*1.12 + 0.3*1.03).
 */
export function factorVentaConImpuestos(p: ParametrosImpuestoVenta): number {
  return p.pctVentaConIVA * (1 + p.iva) + p.pctVentaConTimbres * (1 + p.timbres);
}

export function calcularPrecioSinImpuestos(precioConImpuestos: number, p: ParametrosImpuestoVenta): number {
  return precioConImpuestos / factorVentaConImpuestos(p);
}

export interface ParametrosEnganche {
  precioSinImpuestos: number;
  pctEnganche: number;
  montoReserva: number;
  mesesEnganche: number;
  mesInicioVentas: number;
}

/** cuotaMensualEnganche = ((%enganche * precioSinImpuestos) - montoReserva) / mesesEnganche. */
export function calcularCuotaEnganche(p: ParametrosEnganche): number {
  return (p.pctEnganche * p.precioSinImpuestos - p.montoReserva) / p.mesesEnganche;
}

/**
 * Curva de cobro del enganche de una unidad (`Est Enganches + Lista precios`, fila tipo): la
 * reserva se cobra un mes después de `mesInicioVentas`, luego `mesesEnganche` cuotas iguales.
 */
export function generarCurvaEnganche(p: ParametrosEnganche): CurvaMensual[] {
  const cuota = calcularCuotaEnganche(p);
  const mesReserva = p.mesInicioVentas + 1;
  const curva: CurvaMensual[] = [{ mes: mesReserva, monto: p.montoReserva }];
  for (let i = 1; i <= p.mesesEnganche; i++) {
    curva.push({ mes: mesReserva + i, monto: cuota });
  }
  return curva;
}

/**
 * Curva del saldo (80% restante, o el complemento de `pctEnganche`) pagado al escriturar,
 * repartido en `mesesEscrituracion` cuotas iguales (MOTOR_FINANCIERO.md §7.2: `BF18:BI18` en
 * el Excel real, 4 cuotas de 25%).
 */
export function generarCurvaEscrituracion(
  montoBase: number,
  pctSaldo: number,
  mesInicioEscrituracion: number,
  mesesEscrituracion: number
): CurvaMensual[] {
  const montoPorMes = (montoBase * pctSaldo) / mesesEscrituracion;
  return Array.from({ length: mesesEscrituracion }, (_, i) => ({
    mes: mesInicioEscrituracion + i,
    monto: montoPorMes,
  }));
}
