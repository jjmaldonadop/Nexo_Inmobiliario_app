import { NextResponse } from "next/server";
import { COOKIE_NAME, cookieMaxAgeSegundos, crearToken, compararConstante } from "@/lib/auth-token";

export async function POST(request: Request) {
  const claveEsperada = process.env.APP_PASSWORD;
  if (!claveEsperada) {
    return NextResponse.json(
      { error: "El servidor no tiene configurada la variable APP_PASSWORD" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password || !compararConstante(password, claveEsperada)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = await crearToken();
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAgeSegundos(),
  });
  return respuesta;
}
