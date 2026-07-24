"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CalcularBoton({ proyectoId }: { proyectoId: string }) {
  const router = useRouter();
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function calcular() {
    setError(null);
    setCalculando(true);
    try {
      const respuesta = await fetch(`/api/proyectos/${proyectoId}/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escenario: "base" }),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.error ?? "No se pudo calcular el proyecto");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCalculando(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={calcular}
        disabled={calculando}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {calculando ? "Calculando…" : "Calcular resultados"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
