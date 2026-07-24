import { describe, expect, it } from "vitest";
import { calcularAlturaMaxima, calcularEdificabilidad } from "../edificabilidad";
import type { ZonaPOT } from "../tipos";

// Valores reales de la hoja POT para G4 (MOTOR_FINANCIERO.md §1).
const G4: ZonaPOT = {
  indiceEdificBaseMax: 4,
  indiceEdificAmplMax: 6,
  alturaBaseMax: 32,
  alturaAmplMax: 48,
};

// G0 no tiene rango "ampliado" en el Excel (MOTOR_FINANCIERO.md §1, hallazgo #6).
const G0: ZonaPOT = {
  indiceEdificBaseMax: 0.8,
  indiceEdificAmplMax: null,
  alturaBaseMax: 24,
  alturaAmplMax: null,
};

describe("calcularEdificabilidad", () => {
  it("reproduce Edificabilidad!B24/B25/B27/B28 para terreno de 880 m2 en zona G4", () => {
    const r = calcularEdificabilidad(G4, 880, 1);
    expect(r.areaConstruibleBase).toBeCloseTo(3520, 6); // Edificabilidad!B24
    expect(r.areaConstruibleAmpliada).toBeCloseTo(5280, 6); // Edificabilidad!B25
    expect(r.areaAmpliadaConIncentivos).toBeCloseTo(1760, 6); // Edificabilidad!B27
    expect(r.areaTotalAlcanzable).toBeCloseTo(5280, 6); // Edificabilidad!B28
  });

  it("en G0 usa el índice base como ampliado (bug intencional replicado del Excel)", () => {
    const r = calcularEdificabilidad(G0, 1000, 1);
    expect(r.areaConstruibleBase).toBeCloseTo(800, 6);
    expect(r.areaConstruibleAmpliada).toBeCloseTo(800, 6);
    expect(r.areaAmpliadaConIncentivos).toBe(0);
    expect(r.areaTotalAlcanzable).toBeCloseTo(800, 6);
  });

  it("aplica el % de incentivos solo a la porción ampliada", () => {
    const r = calcularEdificabilidad(G4, 880, 0.5);
    expect(r.areaAmpliadaConIncentivos).toBeCloseTo(880, 6); // (5280-3520)*0.5
    expect(r.areaTotalAlcanzable).toBeCloseTo(4400, 6);
  });
});

describe("calcularAlturaMaxima", () => {
  it("devuelve base/ampliada para G4", () => {
    expect(calcularAlturaMaxima(G4)).toEqual({ alturaBase: 32, alturaAmpliada: 48 });
  });

  it("usa la altura base como ampliada cuando la zona no define rango ampliado (G0)", () => {
    expect(calcularAlturaMaxima(G0)).toEqual({ alturaBase: 24, alturaAmpliada: 24 });
  });
});
