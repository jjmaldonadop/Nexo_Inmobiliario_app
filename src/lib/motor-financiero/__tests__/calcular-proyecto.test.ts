import { describe, expect, it } from "vitest";
import { calcularProyecto, construirFechasMensuales } from "../calcular-proyecto";
import { PARAMETROS_FISCALES_DEFAULT } from "../tipos";

describe("construirFechasMensuales", () => {
  it("mes 0 conserva la fecha exacta; los siguientes son fin de mes (convención EOMONTH)", () => {
    const fechas = construirFechasMensuales(new Date(2024, 5, 1), 4); // 2024-06-01
    expect(fechas[0]).toEqual(new Date(2024, 5, 1));
    expect(fechas[1]).toEqual(new Date(2024, 6, 31)); // 2024-07-31
    expect(fechas[2]).toEqual(new Date(2024, 7, 31)); // 2024-08-31
    expect(fechas[3]).toEqual(new Date(2024, 8, 30)); // 2024-09-30
  });
});

describe("calcularProyecto", () => {
  it("arma un proyecto pequeño de punta a punta y devuelve indicadores coherentes", () => {
    const resultado = calcularProyecto({
      fechaInicio: new Date(2024, 5, 1),
      duracionMeses: 24,
      terrenoCostoTotalQ: 1_000_000,
      costos: [
        { montoTotal: 2_000_000, mesInicio: 0, mesesDuracion: 6, curvaDesembolsoJson: null },
        { montoTotal: 300_000, mesInicio: null, mesesDuracion: null, curvaDesembolsoJson: [{ mes: 3, monto: 300_000 }] },
      ],
      ventas: [
        {
          cantidad: 1000,
          precioVentaSinImpuestosUSD: 3000,
          mesInicioVentas: 1,
          pctEnganche: 0.2,
          montoReservaQ: 20000,
          mesesEnganche: 12,
          mesInicioEscrituracion: 15,
          mesesEscrituracion: 4,
        },
      ],
      financiamiento: {
        tasaAnual: 0.0775,
        curvaDisposicionJson: [{ mes: 2, monto: 1_500_000 }],
        curvaRepagoJson: [{ mes: 18, monto: 1_500_000 }],
      },
      capitalTotalSociosObjetivo: 2_000_000,
      parametrosFiscales: PARAMETROS_FISCALES_DEFAULT,
    });

    // El ingreso total sin impuestos cobrado (enganche + escrituración) debe igualar
    // cantidad * precio, sin fugas ni duplicados.
    const totalIngresosSinImpuestos = resultado.flujoCajaMensual.reduce(
      (acc, f) => acc + f.ingresosSinImpuestos,
      0
    );
    expect(totalIngresosSinImpuestos).toBeCloseTo(1000 * 3000, 2);

    // El terreno y los costos deben aparecer íntegros en algún punto del flujo.
    const totalCostos = resultado.flujoCajaMensual.reduce((acc, f) => acc + f.costosYGastos, 0);
    expect(totalCostos).toBeCloseTo(1_000_000 + 2_000_000 + 300_000, 2);

    // ISR solo se reconoce en el último mes con actividad.
    const mesesConISR = resultado.flujoCajaMensual.filter((f) => f.isr !== 0);
    expect(mesesConISR).toHaveLength(1);
    expect(mesesConISR[0]).toBe(resultado.flujoCajaMensual[resultado.flujoCajaMensual.length - 1]);

    expect(Number.isFinite(resultado.van)).toBe(true);
    expect(Number.isFinite(resultado.tir)).toBe(true);
    expect(resultado.roi).toBeCloseTo(resultado.utilidadDespuesImpuestos / 2_000_000, 9);
    expect(resultado.maxCapitalRequerido).toBeGreaterThan(0);
  });

  it("ignora curvas cuyo mes cae fuera del horizonte del proyecto en vez de lanzar", () => {
    const resultado = calcularProyecto({
      fechaInicio: new Date(2024, 5, 1),
      duracionMeses: 3,
      terrenoCostoTotalQ: 100_000,
      costos: [],
      ventas: [
        {
          cantidad: 10,
          precioVentaSinImpuestosUSD: 1000,
          mesInicioVentas: 0,
          pctEnganche: 0.2,
          montoReservaQ: 1000,
          mesesEnganche: 2,
          mesInicioEscrituracion: 200, // muy lejos del horizonte calculado
          mesesEscrituracion: 1,
        },
      ],
      financiamiento: { tasaAnual: 0.08, curvaDisposicionJson: [], curvaRepagoJson: [] },
      capitalTotalSociosObjetivo: 100_000,
      parametrosFiscales: PARAMETROS_FISCALES_DEFAULT,
    });

    // El horizonte se extiende automáticamente para cubrir la escrituración (mes 200), así que
    // nada se pierde silenciosamente.
    expect(resultado.flujoCajaMensual.length).toBeGreaterThan(200);
  });
});
