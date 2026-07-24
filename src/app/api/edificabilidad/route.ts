import { NextResponse } from "next/server";
import { calcularAlturaMaxima, calcularEdificabilidad } from "@/lib/motor-financiero";
import { edificabilidadInputSchema } from "@/lib/api/schemas";
import { prisma } from "@/lib/prisma";

/** Helper sin estado para el formulario de captura (paso 6): dado un terreno y una zona,
 * devuelve el área construible alcanzable y la altura máxima (MOTOR_FINANCIERO.md §2). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = edificabilidadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", detalles: parsed.error.flatten() }, { status: 400 });
  }

  const { zonaId, areaTerrenoM2, pctIncentivos } = parsed.data;
  const zona = await prisma.zonificacionPOT.findUnique({ where: { id: zonaId } });
  if (!zona) {
    return NextResponse.json({ error: `Zona ${zonaId} no encontrada` }, { status: 404 });
  }

  return NextResponse.json({
    edificabilidad: calcularEdificabilidad(zona, areaTerrenoM2, pctIncentivos),
    altura: calcularAlturaMaxima(zona),
  });
}
