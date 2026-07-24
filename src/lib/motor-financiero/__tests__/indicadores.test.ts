import { describe, expect, it } from "vitest";
import { calcularMaxCapitalRequerido, calcularROI, npv, xirr } from "../indicadores";
import { EXCEL_CACHEADO, FECHAS_FIXTURE, FLUJO_NETO_FIXTURE } from "./fixtures/fcf-base-parity";

describe("npv (semántica Excel NPV, no VAN puro)", () => {
  it("descuenta también el primer valor del arreglo (período 1, no período 0)", () => {
    // NPV(10%, [110]) = 110 / 1.1^1 = 100, NO 110 sin descontar.
    expect(npv(0.1, [110])).toBeCloseTo(100, 9);
  });

  it("coincide con una suma manual de varios períodos", () => {
    const valores = [100, 100, 100];
    const esperado = 100 / 1.05 + 100 / 1.05 ** 2 + 100 / 1.05 ** 3;
    expect(npv(0.05, valores)).toBeCloseTo(esperado, 9);
  });
});

describe("xirr", () => {
  it("recupera una TIR anual del 10% en un caso analítico simple (365 días exactos)", () => {
    const flujos = [
      { monto: -1000, fecha: new Date("2024-01-01") },
      { monto: 1100, fecha: new Date("2025-01-01") }, // 2024 es bisiesto → 366 días, pero cerca de 10%
    ];
    const tasa = xirr(flujos, 0.1);
    expect(tasa).toBeCloseTo(0.1, 2);
  });

  it("recupera exactamente 10% cuando el período es de 365 días", () => {
    const flujos = [
      { monto: -1000, fecha: new Date("2023-01-01") },
      { monto: 1100, fecha: new Date("2024-01-01") }, // 2023 no es bisiesto → 365 días
    ];
    expect(xirr(flujos, 0.1)).toBeCloseTo(0.1, 6);
  });
});

describe("calcularROI", () => {
  it("reproduce FCF!F88 con la utilidad después de impuestos y el capital de socios reales", () => {
    // F83 (Utilidad Después de Impuestos) y C79 (Total Aporte Socios), ver MOTOR_FINANCIERO.md §8.
    const roi = calcularROI(4420176.53639663, 20000000);
    expect(roi).toBeCloseTo(EXCEL_CACHEADO.roi, 6);
  });
});

describe("calcularMaxCapitalRequerido", () => {
  it("reproduce FCF!F85 sobre el flujo neto mensual real del proyecto", () => {
    expect(calcularMaxCapitalRequerido(FLUJO_NETO_FIXTURE)).toBeCloseTo(
      EXCEL_CACHEADO.maxCapitalRequerido,
      3
    );
  });
});

describe("paridad contra FCF Base 26.01.27  (sección 7 de la especificación)", () => {
  it("VAN: coincide con precisión estricta contra FCF!F89 (no depende de fechas)", () => {
    // NPV(10%/12, I84:BO84) — MOTOR_FINANCIERO.md §7.7.
    const van = npv(0.1 / 12, FLUJO_NETO_FIXTURE);
    expect(van).toBeCloseTo(EXCEL_CACHEADO.van, 3);
  });

  it("TIR: con fechas reconstruidas da ~6.25%, no el 6.3559% cacheado en FCF!F87", () => {
    // MOTOR_FINANCIERO.md §10, hallazgo #9: I15:BO15 son TEXT(), no fechas — XIRR no pudo
    // haberse recalculado con ese rango; F87 es un valor cacheado de una versión anterior del
    // archivo. Reconstruyendo la secuencia real de fechas (EOMONTH mensual desde 2024-06-01),
    // la TIR correcta es ~6.2548%, no 6.3559%. Esta prueba documenta esa discrepancia en vez de
    // asumir que el número cacheado es la verdad absoluta.
    const fechas = FECHAS_FIXTURE.map((f) => new Date(f));
    const flujos = FLUJO_NETO_FIXTURE.map((monto, i) => ({ monto, fecha: fechas[i] }));

    const tir = xirr(flujos, 0.06);

    expect(tir).toBeCloseTo(0.0625, 3);
    // Sanity check: la TIR corregida debe quedar cerca (mismo orden de magnitud) del valor
    // cacheado dañado — una diferencia de más de 1 punto porcentual indicaría un bug real en
    // xirr(), no la discrepancia de fechas ya documentada.
    expect(Math.abs(tir - EXCEL_CACHEADO.tirCacheadoConFechasDanadas)).toBeLessThan(0.01);
  });
});
