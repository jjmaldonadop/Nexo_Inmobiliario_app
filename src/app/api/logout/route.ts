import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth-token";

export async function POST() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return respuesta;
}
