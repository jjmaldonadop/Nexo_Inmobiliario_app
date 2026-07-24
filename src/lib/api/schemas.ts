// Validación de payloads de la API con zod. Refleja 1:1 los campos requeridos/opcionales de
// prisma/schema.prisma — ver ese archivo para la fórmula/hallazgo detrás de cada campo.
import { z } from "zod";

export const curvaMensualSchema = z.object({
  mes: z.number().int().min(0),
  monto: z.number(),
});

export const crearTerrenoSchema = z.object({
  areaM2: z.number().positive(),
  costoUSDPorVara2: z.number().nonnegative(),
});

export const grupoCostoSchema = z.enum(["COSTO_DIRECTO", "GASTO_INDIRECTO", "DEVELOPER_FEE"]);

export const crearCostoSchema = z.object({
  categoria: z.string().min(1),
  grupo: grupoCostoSchema.default("COSTO_DIRECTO"),
  costoPorM2: z.number().nonnegative().optional(),
  areaM2: z.number().nonnegative().optional(),
  montoTotal: z.number().nonnegative(),
  mesInicio: z.number().int().min(0).optional(),
  mesesDuracion: z.number().int().positive().optional(),
  curvaDesembolsoJson: z.array(curvaMensualSchema).optional(),
});

export const crearVentaSchema = z.object({
  tipoUnidad: z.string().min(1),
  unidad: z.enum(["m2", "unidad"]).default("m2"),
  cantidad: z.number().positive(),
  precioVentaSinImpuestosUSD: z.number().positive(),
  unidadesPorMes: z.number().positive(),
  mesInicioVentas: z.number().int().min(0),
  pctEnganche: z.number().min(0).max(1).default(0.2),
  montoReservaQ: z.number().nonnegative().default(20000),
  mesesEnganche: z.number().int().positive().default(30),
  mesInicioEscrituracion: z.number().int().min(0).optional(),
  mesesEscrituracion: z.number().int().positive().default(4),
});

export const crearFinanciamientoSchema = z.object({
  tasaAnual: z.number().positive().default(0.0775),
  ltv: z.number().min(0).max(1).default(0.7),
  montoTechoCredito: z.number().nonnegative(),
  curvaDisposicionJson: z.array(curvaMensualSchema),
  curvaRepagoJson: z.array(curvaMensualSchema),
  capitalTotalSociosObjetivo: z.number().positive(),
});

export const estadoProyectoSchema = z.enum([
  "EN_ANALISIS",
  "APROBADO",
  "EN_CONSTRUCCION",
  "ARCHIVADO",
]);

export const crearProyectoSchema = z.object({
  nombre: z.string().min(1),
  ubicacion: z.string().optional(),
  zonaId: z.string().min(1),
  fechaInicio: z.coerce.date(),
  duracionMeses: z.number().int().positive().default(48),
  estado: estadoProyectoSchema.default("EN_ANALISIS"),
  tipoCambioQxUSD: z.number().positive().default(7.8),
  terreno: crearTerrenoSchema,
  costos: z.array(crearCostoSchema).default([]),
  ventas: z.array(crearVentaSchema).min(1),
  financiamiento: crearFinanciamientoSchema,
});

export const edificabilidadInputSchema = z.object({
  zonaId: z.string().min(1),
  areaTerrenoM2: z.number().positive(),
  pctIncentivos: z.number().min(0).max(1).default(1),
});
