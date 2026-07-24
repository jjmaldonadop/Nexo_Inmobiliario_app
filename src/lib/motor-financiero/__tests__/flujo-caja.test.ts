import { describe, expect, it } from "vitest";
import { construirFlujoCaja } from "../flujo-caja";
import { PARAMETROS_FISCALES_DEFAULT } from "../tipos";

describe("construirFlujoCaja", () => {
  it("combina ingresos, IVA de costos, financiamiento e ISR terminal (escenario sintético de 3 meses)", () => {
    const flujos = construirFlujoCaja(
      {
        ingresosSinImpuestos: [100000, 0, 0],
        ivaVenta: [8400, 0, 0], // 100000 * 0.7 * 0.12
        timbresVenta: [900, 0, 0], // 100000 * 0.3 * 0.03
        costosYGastosConTerreno: [50000, 10000, 0],
        costosYGastosSujetosAIVA: [30000, 10000, 0], // excluye los 20,000 de terreno del mes 0
        desembolsoCredito: [0, 200000, 0],
        pagoPrincipal: [0, 0, 50000],
        tasaAnualCredito: 0.12,
      },
      PARAMETROS_FISCALES_DEFAULT
    );

    expect(flujos).toHaveLength(3);

    // Mes 0: sin crédito activo todavía.
    expect(flujos[0].ingresosConImpuestos).toBeCloseTo(109300, 6);
    expect(flujos[0].ivaCostos).toBeCloseTo(3060, 6); // 30000*0.12*0.85
    expect(flujos[0].flujoOperativo).toBeCloseTo(56240, 6);
    expect(flujos[0].flujoConFinanciamiento).toBeCloseTo(56240, 6);
    expect(flujos[0].isr).toBe(0); // ISR solo se reconoce en el último mes

    // Mes 1: se dispone el crédito, saldo = 0 + 200,000 - 0 (sin pago previo).
    expect(flujos[1].ivaCostos).toBeCloseTo(1020, 6);
    expect(flujos[1].flujoOperativo).toBeCloseTo(-11020, 6);
    expect(flujos[1].saldoCredito).toBeCloseTo(200000, 6);
    expect(flujos[1].intereses).toBeCloseTo(2000, 6); // 200,000 * (0.12/12)
    expect(flujos[1].flujoConFinanciamiento).toBeCloseTo(186980, 6);

    // Mes 2: se paga principal; el saldo de intereses usa el saldo previo (sin pago del mes 1).
    expect(flujos[2].saldoCredito).toBeCloseTo(200000, 6);
    expect(flujos[2].intereses).toBeCloseTo(2000, 6);
    expect(flujos[2].flujoConFinanciamiento).toBeCloseTo(-52000, 6);

    // ISR terminal = SUM(flujoConFinanciamiento) * 25% * 0.8, reconocido solo en el último mes.
    const sumaFlujoConFinanciamiento = 56240 + 186980 + -52000;
    const isrEsperado = sumaFlujoConFinanciamiento * 0.25 * 0.8;
    expect(flujos[2].isr).toBeCloseTo(isrEsperado, 4);
    expect(flujos[2].flujoNeto).toBeCloseTo(-52000 - isrEsperado, 4);

    // Los meses anteriores al último no cargan ISR: flujoNeto == flujoConFinanciamiento.
    expect(flujos[0].flujoNeto).toBe(flujos[0].flujoConFinanciamiento);
    expect(flujos[1].flujoNeto).toBe(flujos[1].flujoConFinanciamiento);
  });

  it("devuelve un arreglo vacío sin lanzar cuando no hay meses", () => {
    const flujos = construirFlujoCaja(
      {
        ingresosSinImpuestos: [],
        ivaVenta: [],
        timbresVenta: [],
        costosYGastosConTerreno: [],
        costosYGastosSujetosAIVA: [],
        desembolsoCredito: [],
        pagoPrincipal: [],
        tasaAnualCredito: 0.0775,
      },
      PARAMETROS_FISCALES_DEFAULT
    );
    expect(flujos).toEqual([]);
  });
});
