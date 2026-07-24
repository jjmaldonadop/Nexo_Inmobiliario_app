// Cliente de Prisma singleton (patrón estándar de Next.js: evita agotar conexiones en dev por
// hot-reload, que reimporta este módulo en cada cambio).
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
