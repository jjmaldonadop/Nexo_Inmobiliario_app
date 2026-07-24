"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { COLOR_NEGATIVO } from "@/lib/colores-grafica";
import { formatoPct, formatoQ } from "@/lib/formato";

export interface ProyectoFila {
  id: string;
  nombre: string;
  zona: string;
  estado: string;
  van: number | null;
  tir: number | null;
  roi: number | null;
}

type Columna = "nombre" | "zona" | "estado" | "van" | "tir" | "roi";

const ESTADOS = ["EN_ANALISIS", "APROBADO", "EN_CONSTRUCCION", "ARCHIVADO"];

function valorOrdenable(fila: ProyectoFila, columna: Columna): string | number {
  const v = fila[columna];
  return v ?? -Infinity;
}

function CabeceraOrdenable({
  columna,
  ordenActual,
  direccion,
  onClick,
  children,
  alinearDerecha,
}: {
  columna: Columna;
  ordenActual: Columna;
  direccion: "asc" | "desc";
  onClick: (columna: Columna) => void;
  children: React.ReactNode;
  alinearDerecha?: boolean;
}) {
  const activa = columna === ordenActual;
  return (
    <th
      className={`cursor-pointer select-none px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-700 ${alinearDerecha ? "text-right" : "text-left"}`}
      onClick={() => onClick(columna)}
    >
      {children}
      {activa && <span className="ml-1">{direccion === "asc" ? "↑" : "↓"}</span>}
    </th>
  );
}

/** Dashboard de proyectos (sección 8.1 de la especificación): ordenable por columna, filtrable
 * por estado y por texto. */
export function TablaProyectos({ proyectos }: { proyectos: ProyectoFila[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("TODOS");
  const [ordenPor, setOrdenPor] = useState<Columna>("nombre");
  const [direccion, setDireccion] = useState<"asc" | "desc">("asc");

  function cambiarOrden(columna: Columna) {
    if (columna === ordenPor) {
      setDireccion((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setOrdenPor(columna);
      setDireccion("asc");
    }
  }

  const filas = useMemo(() => {
    const filtradas = proyectos.filter((p) => {
      const coincideEstado = estadoFiltro === "TODOS" || p.estado === estadoFiltro;
      const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
      return coincideEstado && coincideBusqueda;
    });

    const signo = direccion === "asc" ? 1 : -1;
    return [...filtradas].sort((a, b) => {
      const va = valorOrdenable(a, ordenPor);
      const vb = valorOrdenable(b, ordenPor);
      if (va < vb) return -1 * signo;
      if (va > vb) return 1 * signo;
      return 0;
    });
  }, [proyectos, busqueda, estadoFiltro, ordenPor, direccion]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="Buscar por nombre…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        />
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="TODOS">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-400">
          {filas.length} de {proyectos.length} proyectos
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <CabeceraOrdenable columna="nombre" ordenActual={ordenPor} direccion={direccion} onClick={cambiarOrden}>
                Proyecto
              </CabeceraOrdenable>
              <CabeceraOrdenable columna="zona" ordenActual={ordenPor} direccion={direccion} onClick={cambiarOrden}>
                Zona
              </CabeceraOrdenable>
              <CabeceraOrdenable columna="estado" ordenActual={ordenPor} direccion={direccion} onClick={cambiarOrden}>
                Estado
              </CabeceraOrdenable>
              <CabeceraOrdenable
                columna="van"
                ordenActual={ordenPor}
                direccion={direccion}
                onClick={cambiarOrden}
                alinearDerecha
              >
                VAN
              </CabeceraOrdenable>
              <CabeceraOrdenable
                columna="tir"
                ordenActual={ordenPor}
                direccion={direccion}
                onClick={cambiarOrden}
                alinearDerecha
              >
                TIR
              </CabeceraOrdenable>
              <CabeceraOrdenable
                columna="roi"
                ordenActual={ordenPor}
                direccion={direccion}
                onClick={cambiarOrden}
                alinearDerecha
              >
                ROI
              </CabeceraOrdenable>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filas.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/proyectos/${p.id}`} className="font-medium text-slate-900 hover:underline">
                    {p.nombre}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{p.zona}</td>
                <td className="px-3 py-2 text-slate-600">{p.estado}</td>
                <td
                  className="px-3 py-2 text-right tabular-nums"
                  style={p.van !== null && p.van < 0 ? { color: COLOR_NEGATIVO } : undefined}
                >
                  {p.van !== null ? formatoQ.format(p.van) : "—"}
                </td>
                <td
                  className="px-3 py-2 text-right tabular-nums"
                  style={p.tir !== null && p.tir < 0 ? { color: COLOR_NEGATIVO } : undefined}
                >
                  {p.tir !== null ? formatoPct.format(p.tir) : "—"}
                </td>
                <td
                  className="px-3 py-2 text-right tabular-nums"
                  style={p.roi !== null && p.roi < 0 ? { color: COLOR_NEGATIVO } : undefined}
                >
                  {p.roi !== null ? formatoPct.format(p.roi) : "—"}
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  Ningún proyecto coincide con el filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
