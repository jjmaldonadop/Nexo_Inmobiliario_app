import { COLOR_NEGATIVO } from "@/lib/colores-grafica";

interface StatTileProps {
  label: string;
  value: string;
  /** Cuando se define, colorea el valor: rojo si es negativo, tinta normal si no
   * (convención financiera estándar — el propio Excel base muestra negativos en rojo). */
  signoDe?: number;
}

/** Contrato de stat tile del skill de dataviz: label en sentence case, value en semibold. */
export function StatTile({ label, value, signoDe }: StatTileProps) {
  const esNegativo = signoDe !== undefined && signoDe < 0;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className="text-2xl font-semibold tabular-nums"
        style={esNegativo ? { color: COLOR_NEGATIVO } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
