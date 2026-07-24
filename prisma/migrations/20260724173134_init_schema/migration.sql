-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('EN_ANALISIS', 'APROBADO', 'EN_CONSTRUCCION', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "GrupoCosto" AS ENUM ('COSTO_DIRECTO', 'GASTO_INDIRECTO', 'DEVELOPER_FEE');

-- CreateTable
CREATE TABLE "ConfiguracionGlobal" (
    "id" TEXT NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 0.12,
    "pctCostosConCreditoFiscalIVA" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "isr" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "factorBaseGravableISR" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "timbres" DOUBLE PRECISION NOT NULL DEFAULT 0.03,
    "pctVentaConIVA" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "pctVentaConTimbres" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "tasaDescuentoVANAnual" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "factorM2AVaras2" DOUBLE PRECISION NOT NULL DEFAULT 1.423,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZonificacionPOT" (
    "id" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "indiceEdificBaseMin" DOUBLE PRECISION NOT NULL,
    "indiceEdificBaseMax" DOUBLE PRECISION NOT NULL,
    "indiceEdificAmplMin" DOUBLE PRECISION,
    "indiceEdificAmplMax" DOUBLE PRECISION,
    "alturaBaseMin" DOUBLE PRECISION NOT NULL,
    "alturaBaseMax" DOUBLE PRECISION NOT NULL,
    "alturaAmplMin" DOUBLE PRECISION,
    "alturaAmplMax" DOUBLE PRECISION,
    "porcentajeResidencialMixto" DOUBLE PRECISION,

    CONSTRAINT "ZonificacionPOT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT,
    "zonaId" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "duracionMeses" INTEGER NOT NULL DEFAULT 48,
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'EN_ANALISIS',
    "tipoCambioQxUSD" DOUBLE PRECISION NOT NULL DEFAULT 7.8,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Terreno" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "areaM2" DOUBLE PRECISION NOT NULL,
    "costoUSDPorVara2" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Terreno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Costo" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "grupo" "GrupoCosto" NOT NULL DEFAULT 'COSTO_DIRECTO',
    "costoPorM2" DOUBLE PRECISION,
    "areaM2" DOUBLE PRECISION,
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "mesInicio" INTEGER,
    "mesesDuracion" INTEGER,
    "curvaDesembolsoJson" JSONB,

    CONSTRAINT "Costo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "tipoUnidad" TEXT NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'm2',
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioVentaSinImpuestosUSD" DOUBLE PRECISION NOT NULL,
    "unidadesPorMes" DOUBLE PRECISION NOT NULL,
    "mesInicioVentas" INTEGER NOT NULL,
    "pctEnganche" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "montoReservaQ" DOUBLE PRECISION NOT NULL DEFAULT 20000,
    "mesesEnganche" INTEGER NOT NULL DEFAULT 30,
    "mesInicioEscrituracion" INTEGER,
    "mesesEscrituracion" INTEGER NOT NULL DEFAULT 4,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Financiamiento" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "tasaAnual" DOUBLE PRECISION NOT NULL DEFAULT 0.0775,
    "ltv" DOUBLE PRECISION NOT NULL DEFAULT 0.70,
    "montoTechoCredito" DOUBLE PRECISION NOT NULL,
    "curvaDisposicionJson" JSONB NOT NULL,
    "curvaRepagoJson" JSONB NOT NULL,
    "capitalTotalSociosObjetivo" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Financiamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resultado" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "escenario" TEXT NOT NULL DEFAULT 'base',
    "fechaCalculo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "van" DOUBLE PRECISION NOT NULL,
    "tir" DOUBLE PRECISION NOT NULL,
    "roi" DOUBLE PRECISION NOT NULL,
    "maxCapitalRequerido" DOUBLE PRECISION NOT NULL,
    "isrTotal" DOUBLE PRECISION NOT NULL,
    "utilidadDespuesImpuestos" DOUBLE PRECISION NOT NULL,
    "flujoCajaMensualJson" JSONB NOT NULL,

    CONSTRAINT "Resultado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZonificacionPOT_zona_key" ON "ZonificacionPOT"("zona");

-- CreateIndex
CREATE UNIQUE INDEX "Terreno_proyectoId_key" ON "Terreno"("proyectoId");

-- CreateIndex
CREATE UNIQUE INDEX "Financiamiento_proyectoId_key" ON "Financiamiento"("proyectoId");

-- CreateIndex
CREATE INDEX "Resultado_proyectoId_escenario_idx" ON "Resultado"("proyectoId", "escenario");

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "ZonificacionPOT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Terreno" ADD CONSTRAINT "Terreno_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Costo" ADD CONSTRAINT "Costo_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Financiamiento" ADD CONSTRAINT "Financiamiento_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resultado" ADD CONSTRAINT "Resultado_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

