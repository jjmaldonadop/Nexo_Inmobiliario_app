import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Catálogo de zonificación POT (hoja `POT` del Excel, MOTOR_FINANCIERO.md §1). */
export async function GET() {
  const zonas = await prisma.zonificacionPOT.findMany({ orderBy: { zona: "asc" } });
  return NextResponse.json({ zonas });
}
