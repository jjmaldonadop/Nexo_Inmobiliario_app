"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CurvaMensualEditor } from "@/components/curva-mensual-editor";
import {
  COSTO_VACIO,
  formularioAPayload,
  montoTotalCosto,
  PROYECTO_FORM_INICIAL,
  VENTA_VACIA,
  type CostoForm,
  type ProyectoForm,
  type VentaForm,
} from "./tipos";

interface ZonaPOT {
  id: string;
  zona: string;
  nombre: string;
}

interface EdificabilidadPreview {
  edificabilidad: {
    areaConstruibleBase: number;
    areaConstruibleAmpliada: number;
    areaTotalAlcanzable: number;
  };
  altura: { alturaBase: number; alturaAmpliada: number };
}

const inputClase = "w-full rounded border border-slate-300 px-2 py-1 text-sm";
const labelClase = "block text-sm font-medium text-slate-700";
const campoClase = "space-y-1";

/** El input se anida dentro del `<label>` para que quede asociado implícitamente (accesibilidad
 * y `getByLabel` en pruebas), sin tener que inventar un `id` único por campo. */
function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={campoClase}>
      <span className={labelClase}>{label}</span>
      {children}
    </label>
  );
}

export default function NuevoProyectoPage() {
  const router = useRouter();
  const [zonas, setZonas] = useState<ZonaPOT[]>([]);
  const [form, setForm] = useState<ProyectoForm>(PROYECTO_FORM_INICIAL);
  const [edificabilidad, setEdificabilidad] = useState<EdificabilidadPreview | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/zonas")
      .then((r) => r.json())
      .then((data) => setZonas(data.zonas ?? []))
      .catch(() => setError("No se pudo cargar el catálogo de zonificación POT."));
  }, []);

  // Vista previa de edificabilidad: se recalcula al vuelo con la misma fórmula del motor
  // (MOTOR_FINANCIERO.md §2), vía el endpoint POST /api/edificabilidad del paso 5.
  useEffect(() => {
    const areaM2 = Number(form.terrenoAreaM2);
    if (!form.zonaId || !areaM2 || areaM2 <= 0) {
      setEdificabilidad(null);
      return;
    }
    const controlador = new AbortController();
    const timeout = setTimeout(() => {
      fetch("/api/edificabilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zonaId: form.zonaId, areaTerrenoM2: areaM2 }),
        signal: controlador.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setEdificabilidad(data))
        .catch(() => {});
    }, 400);
    return () => {
      clearTimeout(timeout);
      controlador.abort();
    };
  }, [form.zonaId, form.terrenoAreaM2]);

  function actualizar<K extends keyof ProyectoForm>(campo: K, valor: ProyectoForm[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const respuesta = await fetch("/api/proyectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formularioAPayload(form)),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.error ?? "No se pudo crear el proyecto");
      }
      router.push(`/proyectos/${data.proyecto.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo proyecto</h1>
        <p className="text-sm text-slate-500">
          Captura de terreno, zona POT, costos, plan de ventas y financiamiento.
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-8">
        <SeccionDatosGenerales form={form} zonas={zonas} actualizar={actualizar} />
        <SeccionTerreno form={form} actualizar={actualizar} edificabilidad={edificabilidad} />
        <SeccionCostos costos={form.costos} onChange={(costos) => actualizar("costos", costos)} />
        <SeccionVentas ventas={form.ventas} onChange={(ventas) => actualizar("ventas", ventas)} />
        <SeccionFinanciamiento
          financiamiento={form.financiamiento}
          onChange={(financiamiento) => actualizar("financiamiento", financiamiento)}
        />

        {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {enviando ? "Creando…" : "Crear proyecto"}
        </button>
      </form>
    </main>
  );
}

function SeccionDatosGenerales({
  form,
  zonas,
  actualizar,
}: {
  form: ProyectoForm;
  zonas: ZonaPOT[];
  actualizar: <K extends keyof ProyectoForm>(campo: K, valor: ProyectoForm[K]) => void;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 p-4">
      <h2 className="font-medium">Información general</h2>
      <Campo label="Nombre del proyecto">
        <input
          required
          className={inputClase}
          value={form.nombre}
          onChange={(e) => actualizar("nombre", e.target.value)}
        />
      </Campo>
      <Campo label="Ubicación">
        <input
          className={inputClase}
          value={form.ubicacion}
          onChange={(e) => actualizar("ubicacion", e.target.value)}
        />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Zona POT">
          <select
            required
            className={inputClase}
            value={form.zonaId}
            onChange={(e) => actualizar("zonaId", e.target.value)}
          >
            <option value="">Selecciona una zona…</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.zona} — {z.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Fecha de inicio (mes 0 del flujo)">
          <input
            required
            type="date"
            className={inputClase}
            value={form.fechaInicio}
            onChange={(e) => actualizar("fechaInicio", e.target.value)}
          />
        </Campo>
        <Campo label="Duración (meses)">
          <input
            type="number"
            className={inputClase}
            value={form.duracionMeses}
            onChange={(e) => actualizar("duracionMeses", e.target.value)}
          />
        </Campo>
        <Campo label="Tipo de cambio Q/USD">
          <input
            type="number"
            step="0.01"
            className={inputClase}
            value={form.tipoCambioQxUSD}
            onChange={(e) => actualizar("tipoCambioQxUSD", e.target.value)}
          />
        </Campo>
      </div>
    </section>
  );
}

function SeccionTerreno({
  form,
  actualizar,
  edificabilidad,
}: {
  form: ProyectoForm;
  actualizar: <K extends keyof ProyectoForm>(campo: K, valor: ProyectoForm[K]) => void;
  edificabilidad: EdificabilidadPreview | null;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 p-4">
      <h2 className="font-medium">Terreno</h2>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Área (m2)">
          <input
            required
            type="number"
            className={inputClase}
            value={form.terrenoAreaM2}
            onChange={(e) => actualizar("terrenoAreaM2", e.target.value)}
          />
        </Campo>
        <Campo label="Costo por vara2 (USD)">
          <input
            required
            type="number"
            className={inputClase}
            value={form.terrenoCostoUSDPorVara2}
            onChange={(e) => actualizar("terrenoCostoUSDPorVara2", e.target.value)}
          />
        </Campo>
      </div>

      {edificabilidad && (
        <div className="rounded bg-slate-100 p-3 text-sm text-slate-700">
          <p>
            Área construible alcanzable:{" "}
            <strong>{edificabilidad.edificabilidad.areaTotalAlcanzable.toLocaleString("es-GT")} m2</strong>{" "}
            (base {edificabilidad.edificabilidad.areaConstruibleBase.toLocaleString("es-GT")} m2 + ampliada
            con incentivos)
          </p>
          <p>
            Altura máxima: {edificabilidad.altura.alturaBase} m base / {edificabilidad.altura.alturaAmpliada} m
            ampliada
          </p>
        </div>
      )}
    </section>
  );
}

function SeccionCostos({
  costos,
  onChange,
}: {
  costos: CostoForm[];
  onChange: (costos: CostoForm[]) => void;
}) {
  function actualizarCosto(indice: number, cambios: Partial<CostoForm>) {
    onChange(costos.map((c, i) => (i === indice ? { ...c, ...cambios } : c)));
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Costos</h2>
        <button
          type="button"
          onClick={() => onChange([...costos, { ...COSTO_VACIO }])}
          className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100"
        >
          + Agregar costo
        </button>
      </div>

      {costos.length === 0 && <p className="text-sm text-slate-400">Sin costos capturados.</p>}

      {costos.map((costo, indice) => (
        <div key={indice} className="space-y-2 rounded border border-slate-200 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Campo label="Categoría">
              <input
                required
                className={inputClase}
                value={costo.categoria}
                onChange={(e) => actualizarCosto(indice, { categoria: e.target.value })}
                placeholder="Construcción Edificio, Diseño, PM…"
              />
            </Campo>
            <Campo label="Grupo">
              <select
                className={inputClase}
                value={costo.grupo}
                onChange={(e) => actualizarCosto(indice, { grupo: e.target.value as CostoForm["grupo"] })}
              >
                <option value="COSTO_DIRECTO">Costo directo</option>
                <option value="GASTO_INDIRECTO">Gasto indirecto</option>
                <option value="DEVELOPER_FEE">Developer fee</option>
              </select>
            </Campo>
            <Campo label="Costo por m2 (USD, opcional)">
              <input
                type="number"
                className={inputClase}
                value={costo.costoPorM2}
                onChange={(e) => actualizarCosto(indice, { costoPorM2: e.target.value })}
              />
            </Campo>
            <Campo label="Área (m2, opcional)">
              <input
                type="number"
                className={inputClase}
                value={costo.areaM2}
                onChange={(e) => actualizarCosto(indice, { areaM2: e.target.value })}
              />
            </Campo>
            <Campo label="Monto total manual (si no usa costo × área)">
              <input
                type="number"
                className={inputClase}
                value={costo.montoTotalManual}
                onChange={(e) => actualizarCosto(indice, { montoTotalManual: e.target.value })}
              />
            </Campo>
            <div className={campoClase}>
              <p className={labelClase}>Monto total calculado</p>
              <p className="px-2 py-1 text-sm font-medium">
                Q{montoTotalCosto(costo).toLocaleString("es-GT")}
              </p>
            </div>
            <Campo label="Mes de inicio (desembolso lineal)">
              <input
                type="number"
                className={inputClase}
                value={costo.mesInicio}
                onChange={(e) => actualizarCosto(indice, { mesInicio: e.target.value })}
              />
            </Campo>
            <Campo label="Meses de duración (desembolso lineal)">
              <input
                type="number"
                className={inputClase}
                value={costo.mesesDuracion}
                onChange={(e) => actualizarCosto(indice, { mesesDuracion: e.target.value })}
              />
            </Campo>
          </div>

          <CurvaMensualEditor
            etiqueta="Curva de desembolso manual (opcional — tiene prioridad sobre mes de inicio/duración)"
            filas={costo.curva}
            onChange={(curva) => actualizarCosto(indice, { curva })}
          />

          <button
            type="button"
            onClick={() => onChange(costos.filter((_, i) => i !== indice))}
            className="text-sm text-red-600 hover:underline"
          >
            Quitar este costo
          </button>
        </div>
      ))}
    </section>
  );
}

function SeccionVentas({
  ventas,
  onChange,
}: {
  ventas: VentaForm[];
  onChange: (ventas: VentaForm[]) => void;
}) {
  function actualizarVenta(indice: number, cambios: Partial<VentaForm>) {
    onChange(ventas.map((v, i) => (i === indice ? { ...v, ...cambios } : v)));
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Plan de ventas</h2>
        <button
          type="button"
          onClick={() => onChange([...ventas, { ...VENTA_VACIA }])}
          className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100"
        >
          + Agregar tipo de unidad
        </button>
      </div>

      {ventas.map((venta, indice) => (
        <div key={indice} className="space-y-2 rounded border border-slate-200 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Campo label="Tipo de unidad">
              <input
                required
                className={inputClase}
                value={venta.tipoUnidad}
                onChange={(e) => actualizarVenta(indice, { tipoUnidad: e.target.value })}
                placeholder="Residencial, Comercial, Parqueos…"
              />
            </Campo>
            <Campo label="Unidad">
              <select
                className={inputClase}
                value={venta.unidad}
                onChange={(e) => actualizarVenta(indice, { unidad: e.target.value as VentaForm["unidad"] })}
              >
                <option value="m2">m2</option>
                <option value="unidad">unidad</option>
              </select>
            </Campo>
            <Campo label="Cantidad">
              <input
                required
                type="number"
                className={inputClase}
                value={venta.cantidad}
                onChange={(e) => actualizarVenta(indice, { cantidad: e.target.value })}
              />
            </Campo>
            <Campo label="Precio sin impuestos (USD)">
              <input
                required
                type="number"
                className={inputClase}
                value={venta.precioVentaSinImpuestosUSD}
                onChange={(e) => actualizarVenta(indice, { precioVentaSinImpuestosUSD: e.target.value })}
              />
            </Campo>
            <Campo label="Velocidad de absorción (por mes)">
              <input
                required
                type="number"
                className={inputClase}
                value={venta.unidadesPorMes}
                onChange={(e) => actualizarVenta(indice, { unidadesPorMes: e.target.value })}
              />
            </Campo>
            <Campo label="Mes de inicio de ventas">
              <input
                required
                type="number"
                className={inputClase}
                value={venta.mesInicioVentas}
                onChange={(e) => actualizarVenta(indice, { mesInicioVentas: e.target.value })}
              />
            </Campo>
            <Campo label="% Enganche">
              <input
                type="number"
                step="0.01"
                className={inputClase}
                value={venta.pctEnganche}
                onChange={(e) => actualizarVenta(indice, { pctEnganche: e.target.value })}
              />
            </Campo>
            <Campo label="Reserva (Q)">
              <input
                type="number"
                className={inputClase}
                value={venta.montoReservaQ}
                onChange={(e) => actualizarVenta(indice, { montoReservaQ: e.target.value })}
              />
            </Campo>
            <Campo label="Meses de enganche">
              <input
                type="number"
                className={inputClase}
                value={venta.mesesEnganche}
                onChange={(e) => actualizarVenta(indice, { mesesEnganche: e.target.value })}
              />
            </Campo>
            <Campo label="Mes de inicio de escrituración (opcional)">
              <input
                type="number"
                className={inputClase}
                value={venta.mesInicioEscrituracion}
                onChange={(e) => actualizarVenta(indice, { mesInicioEscrituracion: e.target.value })}
              />
            </Campo>
            <Campo label="Meses de escrituración">
              <input
                type="number"
                className={inputClase}
                value={venta.mesesEscrituracion}
                onChange={(e) => actualizarVenta(indice, { mesesEscrituracion: e.target.value })}
              />
            </Campo>
          </div>

          {ventas.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(ventas.filter((_, i) => i !== indice))}
              className="text-sm text-red-600 hover:underline"
            >
              Quitar este tipo de unidad
            </button>
          )}
        </div>
      ))}
    </section>
  );
}

function SeccionFinanciamiento({
  financiamiento,
  onChange,
}: {
  financiamiento: ProyectoForm["financiamiento"];
  onChange: (financiamiento: ProyectoForm["financiamiento"]) => void;
}) {
  function actualizar<K extends keyof ProyectoForm["financiamiento"]>(
    campo: K,
    valor: ProyectoForm["financiamiento"][K]
  ) {
    onChange({ ...financiamiento, [campo]: valor });
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 p-4">
      <h2 className="font-medium">Financiamiento</h2>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Tasa anual">
          <input
            type="number"
            step="0.0001"
            className={inputClase}
            value={financiamiento.tasaAnual}
            onChange={(e) => actualizar("tasaAnual", e.target.value)}
          />
        </Campo>
        <Campo label="LTV (referencia de cumplimiento)">
          <input
            type="number"
            step="0.01"
            className={inputClase}
            value={financiamiento.ltv}
            onChange={(e) => actualizar("ltv", e.target.value)}
          />
        </Campo>
        <Campo label="Monto techo del crédito (Q)">
          <input
            required
            type="number"
            className={inputClase}
            value={financiamiento.montoTechoCredito}
            onChange={(e) => actualizar("montoTechoCredito", e.target.value)}
          />
        </Campo>
        <Campo label="Capital total de socios objetivo (Q)">
          <input
            required
            type="number"
            className={inputClase}
            value={financiamiento.capitalTotalSociosObjetivo}
            onChange={(e) => actualizar("capitalTotalSociosObjetivo", e.target.value)}
          />
        </Campo>
      </div>

      <CurvaMensualEditor
        etiqueta="Curva de disposición del crédito (mes → monto desembolsado)"
        filas={financiamiento.curvaDisposicion}
        onChange={(curvaDisposicion) => actualizar("curvaDisposicion", curvaDisposicion)}
      />
      <CurvaMensualEditor
        etiqueta="Curva de repago de principal (mes → monto pagado)"
        filas={financiamiento.curvaRepago}
        onChange={(curvaRepago) => actualizar("curvaRepago", curvaRepago)}
      />
    </section>
  );
}
