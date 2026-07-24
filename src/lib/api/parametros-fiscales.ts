import { prisma } from "@/lib/prisma";
import { PARAMETROS_FISCALES_DEFAULT, type ParametrosFiscales } from "@/lib/motor-financiero";

/** Lee la fila singleton de `ConfiguracionGlobal`; si aún no existe (antes del seed), usa los
 * valores por defecto documentados en MOTOR_FINANCIERO.md §5. */
export async function obtenerParametrosFiscales(): Promise<ParametrosFiscales> {
  const config = await prisma.configuracionGlobal.findFirst();
  if (!config) return PARAMETROS_FISCALES_DEFAULT;

  return {
    iva: config.iva,
    pctCostosConCreditoFiscalIVA: config.pctCostosConCreditoFiscalIVA,
    isr: config.isr,
    factorBaseGravableISR: config.factorBaseGravableISR,
    timbres: config.timbres,
    pctVentaConIVA: config.pctVentaConIVA,
    pctVentaConTimbres: config.pctVentaConTimbres,
    tasaDescuentoVANAnual: config.tasaDescuentoVANAnual,
    factorM2AVaras2: config.factorM2AVaras2,
  };
}
