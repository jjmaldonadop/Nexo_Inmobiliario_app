"use client";

export interface FilaCurva {
  mes: string;
  monto: string;
}

interface CurvaMensualEditorProps {
  filas: FilaCurva[];
  onChange: (filas: FilaCurva[]) => void;
  etiqueta?: string;
}

/** Editor repetible de curvas {mes, monto} — usado tanto para `Costo.curvaDesembolsoJson` como
 * para `Financiamiento.curvaDisposicionJson` / `curvaRepagoJson` (MOTOR_FINANCIERO.md §7.3, §7.5:
 * en el Excel real estas curvas son manuales por mes, no una fórmula lineal). */
export function CurvaMensualEditor({ filas, onChange, etiqueta }: CurvaMensualEditorProps) {
  function actualizarFila(indice: number, campo: keyof FilaCurva, valor: string) {
    onChange(filas.map((f, i) => (i === indice ? { ...f, [campo]: valor } : f)));
  }

  function agregarFila() {
    onChange([...filas, { mes: "", monto: "" }]);
  }

  function quitarFila(indice: number) {
    onChange(filas.filter((_, i) => i !== indice));
  }

  const total = filas.reduce((acc, f) => acc + (Number(f.monto) || 0), 0);

  return (
    <div className="space-y-2">
      {etiqueta && <p className="text-sm font-medium text-slate-700">{etiqueta}</p>}
      {filas.length === 0 && <p className="text-sm text-slate-400">Sin meses definidos.</p>}
      {filas.map((fila, indice) => (
        <div key={indice} className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Mes"
            value={fila.mes}
            onChange={(e) => actualizarFila(indice, "mes", e.target.value)}
            className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            placeholder="Monto (Q)"
            value={fila.monto}
            onChange={(e) => actualizarFila(indice, "monto", e.target.value)}
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => quitarFila(indice)}
            className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            Quitar
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={agregarFila}
          className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          + Agregar mes
        </button>
        <span className="text-sm text-slate-500">Total: Q{total.toLocaleString("es-GT")}</span>
      </div>
    </div>
  );
}
