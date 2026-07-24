import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: {
      zona: true,
      terreno: true,
      costos: true,
      ventas: true,
      financiamiento: true,
      resultados: { orderBy: { fechaCalculo: "desc" } },
    },
  });

  if (!proyecto) {
    return NextResponse.json({ error: `Proyecto ${id} no encontrado` }, { status: 404 });
  }

  return NextResponse.json({ proyecto });
}
