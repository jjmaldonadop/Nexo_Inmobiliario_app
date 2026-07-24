import { describe, expect, it } from "vitest";
import {
  calcularCuotaEnganche,
  calcularImpuestosVenta,
  calcularIngresoSinImpuestos,
  calcularPrecioSinImpuestos,
  factorVentaConImpuestos,
  generarCurvaEnganche,
  generarCurvaEscrituracion,
} from "../ventas";

const PARAMS = { iva: 0.12, pctVentaConIVA: 0.7, timbres: 0.03, pctVentaConTimbres: 0.3 };

describe("calcularImpuestosVenta", () => {
  it("reproduce Ventas Conceptual!F6/G6 (Comercial)", () => {
    const ingreso = calcularIngresoSinImpuestos(123.73, 2500);
    expect(ingreso).toBeCloseTo(309325, 2); // F6
    const impuestos = calcularImpuestosVenta(ingreso, PARAMS);
    expect(impuestos.ingresoConImpuestos).toBeCloseTo(338092.225, 2); // G6
  });
});

describe("factorVentaConImpuestos / calcularPrecioSinImpuestos", () => {
  it("da el factor 1.093 usado en Ventas Conceptual!D5", () => {
    expect(factorVentaConImpuestos(PARAMS)).toBeCloseTo(1.093, 9);
  });

  it("retrocalcula el precio sin impuestos desde el precio de lista (Ventas Conceptual!D5)", () => {
    // E5 = 3300 (precio con impuestos), D5 = CEILING(E5/1.093, 0.01) ~ 3019.22... (sin redondeo aquí)
    expect(calcularPrecioSinImpuestos(3300, PARAMS)).toBeCloseTo(3019.213, 2);
  });
});

describe("calcularCuotaEnganche / generarCurvaEnganche", () => {
  it("reproduce Est Enganches + Lista precios!K10 (Comprador 1)", () => {
    const p = {
      precioSinImpuestos: 1734469.350411711,
      pctEnganche: 0.2,
      montoReserva: 20000,
      mesesEnganche: 30,
      mesInicioVentas: 0,
    };
    expect(calcularCuotaEnganche(p)).toBeCloseTo(10896.462336078075, 6); // K10
  });

  it("genera reserva + 30 cuotas, y el total cobrado es exactamente pctEnganche * precio", () => {
    const p = {
      precioSinImpuestos: 1734469.350411711,
      pctEnganche: 0.2,
      montoReserva: 20000,
      mesesEnganche: 30,
      mesInicioVentas: 0,
    };
    const curva = generarCurvaEnganche(p);
    expect(curva).toHaveLength(31); // reserva + 30 cuotas (Est Enganches, columnas J10:AN10)
    expect(curva[0]).toEqual({ mes: 1, monto: 20000 });
    const total = curva.reduce((acc, c) => acc + c.monto, 0);
    expect(total).toBeCloseTo(0.2 * p.precioSinImpuestos, 4);
  });
});

describe("generarCurvaEscrituracion", () => {
  it("reproduce FCF!BF18:BI18 (80% del ingreso total en 4 cuotas)", () => {
    const curva = generarCurvaEscrituracion(96309122.79963402, 0.8, 30, 4);
    expect(curva).toHaveLength(4);
    for (const c of curva) {
      expect(c.monto).toBeCloseTo(19261824.559926804, 2); // BF18..BI18
    }
    expect(curva.map((c) => c.mes)).toEqual([30, 31, 32, 33]);
  });
});
