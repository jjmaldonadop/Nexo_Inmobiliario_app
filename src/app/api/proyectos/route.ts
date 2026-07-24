import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearProyectoSchema } from "@/lib/api/schemas";

/** Dashboard de proyectos (paso 7): último resultado calculado de cada uno, más reciente primero. */
export async function GET() {
  const proyectos = await prisma.proyecto.findMany({
    include: {
      zona: true,
      resultados: { orderBy: { fechaCalculo: "desc" }, take: 1 },
    },
    orderBy: { fechaCreacion: "desc" },
  });
  return NextResponse.json({ proyectos });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = crearProyectoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", detalles: parsed.error.flatten() }, { status: 400 });
  }

  const { zonaId, terreno, costos, ventas, financiamiento, ...datosProyecto } = parsed.data;

  const zona = await prisma.zonificacionPOT.findUnique({ where: { id: zonaId } });
  if (!zona) {
    return NextResponse.json({ error: `Zona ${zonaId} no encontrada` }, { status: 404 });
  }

  const proyecto = await prisma.proyecto.create({
    data: {
      ...datosProyecto,
      zona: { connect: { id: zonaId } },
      terreno: { create: terreno },
      costos: { create: costos },
      ventas: { create: ventas },
      financiamiento: { create: financiamiento },
    },
    include: { terreno: true, costos: true, ventas: true, financiamiento: true, zona: true },
  });

  return NextResponse.json({ proyecto }, { status: 201 });
}
