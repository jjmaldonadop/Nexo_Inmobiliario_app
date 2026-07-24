import type { FilaCurva } from "@/components/curva-mensual-editor";

export type GrupoCostoForm = "COSTO_DIRECTO" | "GASTO_INDIRECTO" | "DEVELOPER_FEE";
export type UnidadVentaForm = "m2" | "unidad";

export interface CostoForm {
  categoria: string;
  grupo: GrupoCostoForm;
  costoPorM2: string;
  areaM2: string;
  montoTotalManual: string;
  mesInicio: string;
  mesesDuracion: string;
  curva: FilaCurva[];
}

export interface VentaForm {
  tipoUnidad: string;
  unidad: UnidadVentaForm;
  cantidad: string;
  precioVentaSinImpuestosUSD: string;
  unidadesPorMes: string;
  mesInicioVentas: string;
  pctEnganche: string;
  montoReservaQ: string;
  mesesEnganche: string;
  mesInicioEscrituracion: string;
  mesesEscrituracion: string;
}

export interface FinanciamientoForm {
  tasaAnual: string;
  ltv: string;
  montoTechoCredito: string;
  curvaDisposicion: FilaCurva[];
  curvaRepago: FilaCurva[];
  capitalTotalSociosObjetivo: string;
}

export interface ProyectoForm {
  nombre: string;
  ubicacion: string;
  zonaId: string;
  fechaInicio: string;
  duracionMeses: string;
  tipoCambioQxUSD: string;
  terrenoAreaM2: string;
  terrenoCostoUSDPorVara2: string;
  costos: CostoForm[];
  ventas: VentaForm[];
  financiamiento: FinanciamientoForm;
}

export const COSTO_VACIO: CostoForm = {
  categoria: "",
  grupo: "COSTO_DIRECTO",
  costoPorM2: "",
  areaM2: "",
  montoTotalManual: "",
  mesInicio: "",
  mesesDuracion: "",
  curva: [],
};

export const VENTA_VACIA: VentaForm = {
  tipoUnidad: "",
  unidad: "m2",
  cantidad: "",
  precioVentaSinImpuestosUSD: "",
  unidadesPorMes: "",
  mesInicioVentas: "",
  pctEnganche: "0.2",
  montoReservaQ: "20000",
  mesesEnganche: "30",
  mesInicioEscrituracion: "",
  mesesEscrituracion: "4",
};

export const PROYECTO_FORM_INICIAL: ProyectoForm = {
  nombre: "",
  ubicacion: "",
  zonaId: "",
  fechaInicio: "",
  duracionMeses: "48",
  tipoCambioQxUSD: "7.8",
  terrenoAreaM2: "",
  terrenoCostoUSDPorVara2: "",
  costos: [],
  ventas: [VENTA_VACIA],
  financiamiento: {
    tasaAnual: "0.0775",
    ltv: "0.7",
    montoTechoCredito: "",
    curvaDisposicion: [],
    curvaRepago: [],
    capitalTotalSociosObjetivo: "",
  },
};

function num(valor: string): number {
  return valor.trim() === "" ? 0 : Number(valor);
}

function numOpcional(valor: string): number | undefined {
  return valor.trim() === "" ? undefined : Number(valor);
}

function curvaAJson(filas: FilaCurva[]): { mes: number; monto: number }[] {
  return filas
    .filter((f) => f.mes.trim() !== "" && f.monto.trim() !== "")
    .map((f) => ({ mes: Number(f.mes), monto: Number(f.monto) }));
}

/** montoTotal = costoPorM2 * areaM2 cuando ambos están definidos (Costos Conceptual!D6-D14,
 * MOTOR_FINANCIERO.md §4); si no, se usa el monto manual (p. ej. Developer Fee, PM). */
export function montoTotalCosto(costo: CostoForm): number {
  const costoPorM2 = numOpcional(costo.costoPorM2);
  const areaM2 = numOpcional(costo.areaM2);
  if (costoPorM2 !== undefined && areaM2 !== undefined) {
    return costoPorM2 * areaM2;
  }
  return num(costo.montoTotalManual);
}

/** Traduce el estado del formulario (todo strings, para inputs controlados) al payload que
 * espera `POST /api/proyectos` (crearProyectoSchema en src/lib/api/schemas.ts). */
export function formularioAPayload(form: ProyectoForm) {
  return {
    nombre: form.nombre,
    ubicacion: form.ubicacion.trim() === "" ? undefined : form.ubicacion,
    zonaId: form.zonaId,
    fechaInicio: form.fechaInicio,
    duracionMeses: num(form.duracionMeses),
    tipoCambioQxUSD: num(form.tipoCambioQxUSD),
    terreno: {
      areaM2: num(form.terrenoAreaM2),
      costoUSDPorVara2: num(form.terrenoCostoUSDPorVara2),
    },
    costos: form.costos.map((c) => ({
      categoria: c.categoria,
      grupo: c.grupo,
      costoPorM2: numOpcional(c.costoPorM2),
      areaM2: numOpcional(c.areaM2),
      montoTotal: montoTotalCosto(c),
      mesInicio: numOpcional(c.mesInicio),
      mesesDuracion: numOpcional(c.mesesDuracion),
      curvaDesembolsoJson: c.curva.length > 0 ? curvaAJson(c.curva) : undefined,
    })),
    ventas: form.ventas.map((v) => ({
      tipoUnidad: v.tipoUnidad,
      unidad: v.unidad,
      cantidad: num(v.cantidad),
      precioVentaSinImpuestosUSD: num(v.precioVentaSinImpuestosUSD),
      unidadesPorMes: num(v.unidadesPorMes),
      mesInicioVentas: num(v.mesInicioVentas),
      pctEnganche: num(v.pctEnganche),
      montoReservaQ: num(v.montoReservaQ),
      mesesEnganche: num(v.mesesEnganche),
      mesInicioEscrituracion: numOpcional(v.mesInicioEscrituracion),
      mesesEscrituracion: num(v.mesesEscrituracion),
    })),
    financiamiento: {
      tasaAnual: num(form.financiamiento.tasaAnual),
      ltv: num(form.financiamiento.ltv),
      montoTechoCredito: num(form.financiamiento.montoTechoCredito),
      curvaDisposicionJson: curvaAJson(form.financiamiento.curvaDisposicion),
      curvaRepagoJson: curvaAJson(form.financiamiento.curvaRepago),
      capitalTotalSociosObjetivo: num(form.financiamiento.capitalTotalSociosObjetivo),
    },
  };
}
