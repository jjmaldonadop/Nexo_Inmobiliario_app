import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calcularProyecto } from "@/lib/motor-financiero";
import { mapearProyectoParaCalculo, proyectoParaCalculoInclude } from "@/lib/api/mapear-proyecto";
import { obtenerParametrosFiscales } from "@/lib/api/parametros-fiscales";

/** Corre el motor de cálculo sobre un proyecto ya capturado y persiste un `Resultado`. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: proyectoParaCalculoInclude,
  });

  if (!proyecto) {
    return NextResponse.json({ error: `Proyecto ${id} no encontrado` }, { status: 404 });
  }
  if (!proyecto.terreno) {
    return NextResponse.json({ error: "El proyecto no tiene terreno registrado" }, { status: 422 });
  }
  if (!proyecto.financiamiento) {
    return NextResponse.json({ error: "El proyecto no tiene financiamiento registrado" }, { status: 422 });
  }
  if (proyecto.ventas.length === 0) {
    return NextResponse.json({ error: "El proyecto no tiene ventas registradas" }, { status: 422 });
  }

  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const escenario = typeof body.escenario === "string" ? body.escenario : "base";

  const parametrosFiscales = await obtenerParametrosFiscales();
  const input = mapearProyectoParaCalculo(
    // `proyecto.terreno` y `proyecto.financiamiento` ya se validaron arriba como no nulos.
    proyecto as typeof proyecto & {
      terreno: NonNullable<typeof proyecto.terreno>;
      financiamiento: NonNullable<typeof proyecto.financiamiento>;
    },
    parametrosFiscales
  );

  let resultadoCalculo;
  try {
    resultadoCalculo = calcularProyecto(input);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido en el motor de cálculo";
    return NextResponse.json({ error: mensaje }, { status: 422 });
  }

  const resultado = await prisma.resultado.create({
    data: {
      proyectoId: proyecto.id,
      escenario,
      van: resultadoCalculo.van,
      tir: resultadoCalculo.tir,
      roi: resultadoCalculo.roi,
      maxCapitalRequerido: resultadoCalculo.maxCapitalRequerido,
      isrTotal: resultadoCalculo.isrTotal,
      utilidadDespuesImpuestos: resultadoCalculo.utilidadDespuesImpuestos,
      // FlujoMensual[] es estructuralmente JSON-compatible; Prisma solo exige un índice de
      // firma que un `interface` con campos nombrados no declara.
      flujoCajaMensualJson: resultadoCalculo.flujoCajaMensual as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ resultado }, { status: 201 });
}
