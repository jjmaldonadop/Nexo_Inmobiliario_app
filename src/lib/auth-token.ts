// Sesión de acceso compartida (una sola contraseña para todo el equipo de Nexo Inmobiliario —
// especificación sección 3: "acceso restringido"). El token es un valor firmado con
// HMAC-SHA256, sin estado en servidor: solo el navegador guarda la cookie.
//
// Usa Web Crypto (`crypto.subtle`, `btoa`) en vez de `node:crypto`/`Buffer` porque el
// middleware de Next.js corre en el runtime Edge por defecto, que no tiene esos módulos de
// Node — así el mismo código funciona igual en el middleware (Edge) y en la API route de
// login (Node).

export const COOKIE_NAME = "nexo_auth";
const DURACION_SEGUNDOS = 60 * 60 * 24 * 30; // 30 días

function obtenerSecreto(): string {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto) {
    throw new Error("Falta configurar la variable de entorno SESSION_SECRET");
  }
  return secreto;
}

function bufferABase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binario = "";
  for (let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i]);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function firmar(payload: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(obtenerSecreto()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const firma = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(payload));
  return bufferABase64Url(firma);
}

/** Comparación sin cortocircuito — evita que un atacante infiera la firma/contraseña correcta
 * midiendo cuánto tarda cada intento fallido. */
export function compararConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function crearToken(): Promise<string> {
  const expira = Math.floor(Date.now() / 1000) + DURACION_SEGUNDOS;
  const payload = String(expira);
  const firma = await firmar(payload);
  return `${payload}.${firma}`;
}

export async function verificarToken(token: string): Promise<boolean> {
  const [payload, firma] = token.split(".");
  if (!payload || !firma) return false;

  const expira = Number(payload);
  if (!Number.isFinite(expira) || expira < Math.floor(Date.now() / 1000)) return false;

  const firmaEsperada = await firmar(payload);
  return compararConstante(firmaEsperada, firma);
}

export function cookieMaxAgeSegundos(): number {
  return DURACION_SEGUNDOS;
}
