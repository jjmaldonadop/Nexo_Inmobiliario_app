import { describe, expect, it } from "vitest";
import {
  aplicarIVA,
  calcularCostoTotalProyecto,
  calcularCostoTotalTerreno,
  calcularMontoCosto,
  generarCurvaDesembolsoLineal,
} from "../costos";

describe("calcularMontoCosto / aplicarIVA", () => {
  it("reproduce Costos Conceptual!D6/E6 (Prefactibilidad residencial)", () => {
    const monto = calcularMontoCosto(1.25, 880);
    expect(monto).toBeCloseTo(1100, 6); // D6
    expect(aplicarIVA(monto, 0.12)).toBeCloseTo(1232, 6); // E6
  });

  it("reproduce Costos Conceptual!D11/E11 (Construcción Edificio)", () => {
    const monto = calcularMontoCosto(700, 5280);
    expect(monto).toBeCloseTo(3696000, 6); // D11
    expect(aplicarIVA(monto, 0.12)).toBeCloseTo(4139520, 6); // E11
  });
});

describe("calcularCostoTotalProyecto", () => {
  it("reproduce Costos Conceptual!D15 (total residencial sin IVA)", () => {
    const montos = [1100, 146087.5, 152830, 584350, 1855000, 3696000, 359600, 359600, 179800];
    expect(calcularCostoTotalProyecto(montos)).toBeCloseTo(7334367.5, 4); // D15
  });
});

describe("calcularCostoTotalTerreno", () => {
  it("reproduce 'Modelo de Desarrollo \"Q\"'!B35 (terreno de 880 m2 en zona G4)", () => {
    const costo = calcularCostoTotalTerreno(1242, 880, 1.423, 7.8);
    expect(costo).toBeCloseTo(12131200.224, 3);
  });
});

describe("generarCurvaDesembolsoLineal", () => {
  it("reparte el monto total en partes iguales durante mesesDuracion", () => {
    const curva = generarCurvaDesembolsoLineal({ montoTotal: 300000, mesInicio: 5, mesesDuracion: 3 });
    expect(curva).toEqual([
      { mes: 5, monto: 100000 },
      { mes: 6, monto: 100000 },
      { mes: 7, monto: 100000 },
    ]);
  });
});
