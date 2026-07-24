// VAN, TIR, ROI y capital máximo requerido (MOTOR_FINANCIERO.md §7.6-7.7).

/**
 * Replica `NPV()` de Excel, no un VAN "puro": el PRIMER valor del arreglo también se descuenta
 * (como si ocurriera al final del período 1, no en el período 0). Así es como el Excel real
 * calcula `F89 = NPV(10%/12, I84:BO84)` — si se necesita un flujo con el desembolso inicial en
 * el período 0 sin descontar, hay que anteponerlo por fuera de este arreglo.
 */
export function npv(tasaPeriodo: number, flujos: number[]): number {
  return flujos.reduce((acumulado, valor, i) => acumulado + valor / Math.pow(1 + tasaPeriodo, i + 1), 0);
}

export interface FlujoConFecha {
  monto: number;
  fecha: Date;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const DIAS_POR_ANIO = 365;

function xnpv(tasa: number, flujos: FlujoConFecha[]): number {
  const fecha0 = flujos[0].fecha.getTime();
  return flujos.reduce((acumulado, f) => {
    const dias = (f.fecha.getTime() - fecha0) / MS_POR_DIA;
    return acumulado + f.monto / Math.pow(1 + tasa, dias / DIAS_POR_ANIO);
  }, 0);
}

/**
 * TIR sobre flujos con fechas irregulares (equivalente a `XIRR` de Excel). Usa Newton-Raphson
 * con derivada numérica y cae a bisección si no converge o la derivada se anula.
 */
export function xirr(flujos: FlujoConFecha[], guess = 0.1): number {
  if (flujos.length < 2) {
    throw new Error("xirr requiere al menos dos flujos");
  }

  const h = 1e-6;
  let tasa = guess;

  for (let iter = 0; iter < 100; iter++) {
    const f = xnpv(tasa, flujos);
    const derivada = (xnpv(tasa + h, flujos) - xnpv(tasa - h, flujos)) / (2 * h);
    if (derivada === 0 || !Number.isFinite(derivada)) break;

    const nuevaTasa = tasa - f / derivada;
    if (!Number.isFinite(nuevaTasa) || nuevaTasa <= -1) break;

    if (Math.abs(nuevaTasa - tasa) < 1e-10) {
      return nuevaTasa;
    }
    tasa = nuevaTasa;
  }

  return xirrPorBiseccion(flujos);
}

function xirrPorBiseccion(flujos: FlujoConFecha[], lo = -0.99, hi = 10): number {
  let flo = xnpv(lo, flujos);
  const fhiInicial = xnpv(hi, flujos);
  if (Math.sign(flo) === Math.sign(fhiInicial)) {
    throw new Error("xirr no converge: no hay cambio de signo de VAN en el rango [-99%, 1000%]");
  }

  for (let i = 0; i < 200; i++) {
    const medio = (lo + hi) / 2;
    const fMedio = xnpv(medio, flujos);
    if (Math.abs(fMedio) < 1e-6) return medio;
    if (Math.sign(fMedio) === Math.sign(flo)) {
      lo = medio;
      flo = fMedio;
    } else {
      hi = medio;
    }
  }
  return (lo + hi) / 2;
}

export function calcularROI(utilidadDespuesImpuestos: number, capitalTotalSocios: number): number {
  return utilidadDespuesImpuestos / capitalTotalSocios;
}

/** maxCapitalRequerido = -min(flujoNetoAcumulado) (`FCF!F85 = -MIN(I85:BB85)`). */
export function calcularMaxCapitalRequerido(flujoNeto: number[]): number {
  let acumulado = 0;
  let minimo = 0;
  for (const valor of flujoNeto) {
    acumulado += valor;
    minimo = Math.min(minimo, acumulado);
  }
  return -minimo;
}
