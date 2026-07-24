import { describe, expect, it } from "vitest";
import { calcularCurvaCredito, verificarLTV } from "../financiamiento";

describe("calcularCurvaCredito", () => {
  it("reproduce FCF!AG69:AI74 (arranque real del desembolso del crédito, tasa 7.75%)", () => {
    // Curva real de disposición de los primeros 3 meses con actividad (FCF!AG69, AH69, AI69).
    const desembolsos = [
      { mes: 0, monto: 1500000 },
      { mes: 1, monto: 1500000 },
      { mes: 2, monto: 2363636.3636363638 },
    ];
    const curva = calcularCurvaCredito(desembolsos, [], 0.0775, 0, 2);

    expect(curva[0].saldo).toBeCloseTo(1500000, 4); // AG73
    expect(curva[0].intereses).toBeCloseTo(9687.5, 4); // AG74

    expect(curva[1].saldo).toBeCloseTo(3000000, 4); // AH73
    expect(curva[1].intereses).toBeCloseTo(19375, 4); // AH74

    expect(curva[2].saldo).toBeCloseTo(5363636.363636363, 3); // AI73
    expect(curva[2].intereses).toBeCloseTo(34640.15151515151, 3); // AI74
  });

  it("descuenta el pago de principal del mes anterior, no del mes actual", () => {
    const desembolsos = [{ mes: 0, monto: 1000000 }];
    const pagos = [{ mes: 0, monto: 400000 }];
    const curva = calcularCurvaCredito(desembolsos, pagos, 0.12, 0, 1);

    // mes 0: saldo = 0 + 1,000,000 - 0 (no hay pago anterior) = 1,000,000
    expect(curva[0].saldo).toBe(1000000);
    // mes 1: saldo = 1,000,000 + 0 - 400,000 (pago del mes 0) = 600,000
    expect(curva[1].saldo).toBe(600000);
  });
});

describe("verificarLTV", () => {
  it("es referencia de cumplimiento, no genera el desembolso", () => {
    expect(verificarLTV(55000000, 78571429, 0.7)).toBe(true);
    expect(verificarLTV(60000000, 78571429, 0.7)).toBe(false);
  });
});
