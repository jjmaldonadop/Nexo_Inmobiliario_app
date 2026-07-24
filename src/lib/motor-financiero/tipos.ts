// Tipos compartidos del motor de cálculo. Ver MOTOR_FINANCIERO.md para la fórmula de origen
// de cada campo (celda exacta del Excel `MF_Documento_Base.xlsx`).

export interface ZonaPOT {
  indiceEdificBaseMax: number;
  /** `null` para la zona G0, que no tiene rango "ampliado" (MOTOR_FINANCIERO.md §1). */
  indiceEdificAmplMax: number | null;
  alturaBaseMax: number;
  alturaAmplMax: number | null;
}

export interface ParametrosFiscales {
  iva: number;
  pctCostosConCreditoFiscalIVA: number;
  isr: number;
  /** MOTOR_FINANCIERO.md §7.6: factor no documentado en el Excel, aplicado al ISR final. */
  factorBaseGravableISR: number;
  timbres: number;
  pctVentaConIVA: number;
  pctVentaConTimbres: number;
  tasaDescuentoVANAnual: number;
  factorM2AVaras2: number;
}

export const PARAMETROS_FISCALES_DEFAULT: ParametrosFiscales = {
  iva: 0.12,
  pctCostosConCreditoFiscalIVA: 0.85,
  isr: 0.25,
  factorBaseGravableISR: 0.8,
  timbres: 0.03,
  pctVentaConIVA: 0.7,
  pctVentaConTimbres: 0.3,
  tasaDescuentoVANAnual: 0.1,
  factorM2AVaras2: 1.423,
};

export interface CurvaMensual {
  mes: number;
  monto: number;
}

export interface FlujoMensual {
  mes: number;
  ingresosSinImpuestos: number;
  ivaVenta: number;
  timbresVenta: number;
  ingresosConImpuestos: number;
  costosYGastos: number;
  ivaCostos: number;
  flujoOperativo: number;
  desembolsoCredito: number;
  saldoCredito: number;
  intereses: number;
  pagoPrincipal: number;
  flujoConFinanciamiento: number;
  isr: number;
  flujoNeto: number;
}
