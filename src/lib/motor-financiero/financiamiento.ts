// Réplica de `FCF Base 26.01.27 ` filas 67-75 (MOTOR_FINANCIERO.md §7.5).
//
// El crédito bancario NO se deriva automáticamente de LTV * costo acumulado mes a mes: el Excel
// real usa un monto techo fijo con curvas de disposición y repago manuales (hallazgo #1). LTV se
// conserva solo como referencia de cumplimiento (ver `verificarLTV`).
//
// Nota sobre el signo (MOTOR_FINANCIERO.md §10, hallazgo #10): el Excel tiene un bug de signo
// latente en las columnas sin actividad de crédito; esta implementación usa siempre la fórmula
// financieramente correcta, que es la que gobierna el tramo con actividad real:
//   saldo[t] = saldo[t-1] + desembolso[t] - pagoPrincipal[t-1]
import type { CurvaMensual } from "./tipos";

export interface MesCredito {
  mes: number;
  saldo: number;
  desembolso: number;
  pagoPrincipal: number;
  intereses: number;
}

function aMapa(curva: CurvaMensual[]): Map<number, number> {
  return new Map(curva.map((c) => [c.mes, c.monto]));
}

export function calcularCurvaCredito(
  desembolsos: CurvaMensual[],
  pagosPrincipal: CurvaMensual[],
  tasaAnual: number,
  mesInicio: number,
  mesFin: number
): MesCredito[] {
  const tasaMensual = tasaAnual / 12;
  const desembolsoPorMes = aMapa(desembolsos);
  const pagoPorMes = aMapa(pagosPrincipal);

  const resultado: MesCredito[] = [];
  let saldoAnterior = 0;
  let pagoPrincipalAnterior = 0;

  for (let mes = mesInicio; mes <= mesFin; mes++) {
    const desembolso = desembolsoPorMes.get(mes) ?? 0;
    const saldo = saldoAnterior + desembolso - pagoPrincipalAnterior;
    const intereses = saldo * tasaMensual;
    const pagoPrincipal = pagoPorMes.get(mes) ?? 0;

    resultado.push({ mes, saldo, desembolso, pagoPrincipal, intereses });

    saldoAnterior = saldo;
    pagoPrincipalAnterior = pagoPrincipal;
  }

  return resultado;
}

/** Verificación de cumplimiento (no genera el desembolso): saldo <= LTV * valorGarantia. */
export function verificarLTV(saldoCredito: number, valorGarantia: number, ltv: number): boolean {
  return saldoCredito <= valorGarantia * ltv;
}
