// Catálogo de zonificación POT extraído de la hoja `POT` del Excel base.
// Ver MOTOR_FINANCIERO.md, sección 1, para la celda de origen de cada valor.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const zonas = [
  {
    zona: "G5",
    nombre: "Núcleo",
    indiceEdificBaseMin: 0,
    indiceEdificBaseMax: 6,
    indiceEdificAmplMin: 6,
    indiceEdificAmplMax: 9,
    alturaBaseMin: 0,
    alturaBaseMax: 64,
    alturaAmplMin: 64,
    alturaAmplMax: 96,
    porcentajeResidencialMixto: 0.25,
  },
  {
    zona: "G4",
    nombre: "Central",
    indiceEdificBaseMin: 0,
    indiceEdificBaseMax: 4,
    indiceEdificAmplMin: 4,
    indiceEdificAmplMax: 6,
    alturaBaseMin: 0,
    alturaBaseMax: 32,
    alturaAmplMin: 32,
    alturaAmplMax: 48,
    porcentajeResidencialMixto: 0.35,
  },
  {
    zona: "G3",
    nombre: "Urbana",
    indiceEdificBaseMin: 0,
    indiceEdificBaseMax: 2.7,
    indiceEdificAmplMin: 2.7,
    indiceEdificAmplMax: 4,
    alturaBaseMin: 0,
    alturaBaseMax: 16,
    alturaAmplMin: 16,
    alturaAmplMax: 24,
    porcentajeResidencialMixto: 0.5,
  },
  {
    zona: "G2",
    nombre: "Semiurbana",
    indiceEdificBaseMin: 0,
    indiceEdificBaseMax: 1.8,
    indiceEdificAmplMin: 1.8,
    indiceEdificAmplMax: 2.7,
    alturaBaseMin: 0,
    alturaBaseMax: 16,
    alturaAmplMin: 16,
    alturaAmplMax: 24,
    porcentajeResidencialMixto: 0.75,
  },
  {
    zona: "G1",
    nombre: "Rural",
    indiceEdificBaseMin: 0,
    indiceEdificBaseMax: 1.2,
    indiceEdificAmplMin: 1.2,
    indiceEdificAmplMax: 1.8,
    alturaBaseMin: 0,
    alturaBaseMax: 16,
    alturaAmplMin: 16,
    alturaAmplMax: 24,
    porcentajeResidencialMixto: 0.75,
  },
  {
    zona: "G0",
    nombre: "Natural",
    indiceEdificBaseMin: 0,
    indiceEdificBaseMax: 0.8,
    indiceEdificAmplMin: null,
    indiceEdificAmplMax: null,
    alturaBaseMin: 0,
    alturaBaseMax: 24,
    alturaAmplMin: null,
    alturaAmplMax: null,
    porcentajeResidencialMixto: null,
  },
];

async function main() {
  for (const zona of zonas) {
    await prisma.zonificacionPOT.upsert({
      where: { zona: zona.zona },
      update: zona,
      create: zona,
    });
  }

  await prisma.configuracionGlobal.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
