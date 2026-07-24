// Réplica de `Edificabilidad!B15:B32` (MOTOR_FINANCIERO.md §2).
import type { ZonaPOT } from "./tipos";

export interface ResultadoEdificabilidad {
  areaConstruibleBase: number;
  areaConstruibleAmpliada: number;
  areaAmpliadaConIncentivos: number;
  areaTotalAlcanzable: number;
}

/**
 * areaConstruibleBase = indiceBase * areaTerrenoM2
 * areaConstruibleAmpliada = indiceAmpliado * areaTerrenoM2
 * areaAmpliadaConIncentivos = (areaConstruibleAmpliada - areaConstruibleBase) * pctIncentivos
 * areaTotalAlcanzable = areaConstruibleBase + areaAmpliadaConIncentivos
 *
 * Para la zona G0 (`indiceEdificAmplMax === null`) el Excel reutiliza el índice base como
 * "ampliado" (`Edificabilidad!B16` referencia `POT!G155` en ambas ramas), por lo que
 * areaAmpliadaConIncentivos da 0 automáticamente.
 */
export function calcularEdificabilidad(
  zona: ZonaPOT,
  areaTerrenoM2: number,
  pctIncentivos = 1
): ResultadoEdificabilidad {
  const indiceAmpliado = zona.indiceEdificAmplMax ?? zona.indiceEdificBaseMax;
  const areaConstruibleBase = zona.indiceEdificBaseMax * areaTerrenoM2;
  const areaConstruibleAmpliada = indiceAmpliado * areaTerrenoM2;
  const areaAmpliadaConIncentivos = (areaConstruibleAmpliada - areaConstruibleBase) * pctIncentivos;
  const areaTotalAlcanzable = areaConstruibleBase + areaAmpliadaConIncentivos;

  return { areaConstruibleBase, areaConstruibleAmpliada, areaAmpliadaConIncentivos, areaTotalAlcanzable };
}

export interface AlturaMaxima {
  alturaBase: number;
  alturaAmpliada: number;
}

export function calcularAlturaMaxima(zona: ZonaPOT): AlturaMaxima {
  return {
    alturaBase: zona.alturaBaseMax,
    alturaAmpliada: zona.alturaAmplMax ?? zona.alturaBaseMax,
  };
}
