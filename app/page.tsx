"use client";
import { useEffect, useState, useMemo } from "react";
import { Activity, Zap, Clock, BarChart2, Filter } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

import ExecutiveSummary   from "./components/ExecutiveSummary";
import AnomalyBadge       from "./components/AnomalyBadge";
import SegmentAnalysis    from "./components/SegmentAnalysis";
import AlertasBadge       from "./components/AlertasBadge";

import {
  detectarAnomalias,
  analizarPorTurno,
  calcularResumenEjecutivo,
  type RegistroRaw,
} from "./lib/analytics";
import { enriquecerAlertas } from "./lib/intelligence";

// ── TOKENS ────────────────────────────────────────────────────────────────
const C = {
  bg:     "#060d1a",
  glass:  "rgba(11,22,40,0.8)",
  border: "rgba(56,165,255,0.12)",
  accent: "#38a5ff",
  green:  "#34d399",
  yellow: "#fbbf24",
  red:    "#f87171",
  purple: "#a78bfa",
  muted:  "#4d7099",
  dim:    "#1e3350",
  text:   "#e8f4ff",
};

const TURNOS = ["Todos", "Matutino", "Vespertino", "Nocturno"];
const TURNO_COLOR: Record<string, string> = {
  Matutino:   C.accent,
  Vespertino: C.yellow,
  Nocturno:   C.purple,
  Todos:      C.accent,
};

// ── HELPERS ───────────────────────────────────────────────────────────────
interface KPIs {
  toneladas_total: number;      toneladas_total_var: number;
  eficiencia_promedio: number;  eficiencia_promedio_var: number;
  tiempo_operativo_promedio: number; tiempo_operativo_promedio_var: number;
  consumo_promedio: number;     consumo_promedio_var: number;
}
interface AlertaRaw {
  nivel: "critico" | "advertencia";
  mensaje: string; turno: string; fecha: string;
}
interface PuntoTendencia {
  fecha: string; toneladas: number; eficiencia: number; meta_toneladas: number;
}
interface Prediccion {
  fecha: string; prediccion: number;
  limite_inferior: number; limite_superior: number;
  es_fin_semana: boolean; es_mantenimiento: boolean;
}

// ── KPI CARD ──────────────────────────────────────────────────────────────
function KPICard({ title, value, unit, variacion, meta, icon: Icon, color, invertVar = false }: {
  title: string; value: string; unit: string; variacion: number;
  meta: string; icon: any; color: string; invertVar?: boolean;
}) {
  const good = invertVar ? variacion <= 0 : variacion >= 0;
  return (
    <div style={{
      background: `${color}09`, border: `1px solid ${color}28`,
      borderRadius: 16, padding: "20px 22px",
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", gap: 12,
      boxShadow: `0 0 40px ${color}08`,
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 40px ${color}20`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${color}08`;
      }}
    >
      <div style={{ position: "absolute", top: -20, right: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: color, opacity: 0.06, filter: "blur(20px)" }} />

      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10,
          letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted }}>
          {title}
        </span>
        <div style={{ width: 28, height: 28, borderRadius: 8,
          background: `${color}18`, display: "flex",
          alignItems: "center", justifyContent: "center" }}>
          <Icon size={13} color={color} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 30,
          fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>
          {value}
        </span>
        <span style={{ fontSize: 12, color: C.muted }}>{unit}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between" }}>
        <span style={{
          fontFamily: "'Space Mono',monospace", fontSize: 11,
          padding: "3px 8px", borderRadius: 6,
          background: good ? `${C.green}18` : `${C.red}18`,
          color: good ? C.green : C.red,
          border: `1px solid ${good ? C.green : C.red}33`,
        }}>
          {good ? "▲" : "▼"} {Math.abs(variacion)}%
        </span>
        <span style={{ fontFamily: "'Space Mono',monospace",
          fontSize: 10, color: C.dim }}>
          meta {meta}
        </span>
      </div>

      <div style={{ height: 2, borderRadius: 2, background: C.dim }}>
        <div style={{
          height: "100%", borderRadius: 2,
          width: `${Math.min(Math.abs(variacion) * 3 + 60, 100)}%`,
          background: `linear-gradient(90deg, ${color}, ${color}66)`,
          transition: "width 1s ease",
        }} />
      </div>
    </div>
  );
}

// ── TOOLTIP CUSTOM ────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(6,13,26,0.97)",
      border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "10px 14px",
      backdropFilter: "blur(20px)",
    }}>
      <p style={{ fontFamily: "'Space Mono',monospace",
        fontSize: 10, color: C.muted, marginBottom: 8, marginTop: 0 }}>
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        p.value != null && p.name && (
          <div key={i} style={{ display: "flex", alignItems: "center",
            gap: 8, fontSize: 12, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%",
              background: p.color, display: "inline-block" }} />
            <span style={{ color: C.muted }}>{p.name}:</span>
            <span style={{ fontFamily: "'Space Mono',monospace",
              fontWeight: 700, color: p.color }}>
              {Number(p.value).toLocaleString()}
              {p.name.includes("%") ? "%" : " ton"}
            </span>
          </div>
        )
      ))}
    </div>
  );
};

// ── SECTION WRAPPER ───────────────────────────────────────────────────────
function Section({ title, sub, children, style = {} }: {
  title: string; sub?: string;
  children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: C.glass, border: `1px solid ${C.border}`,
      borderRadius: 20, padding: "24px",
      backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column", gap: 20,
      ...style,
    }}>
      <div style={{ paddingBottom: 16, borderBottom: `1px solid ${C.dim}` }}>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: C.muted, display: "block", marginBottom: sub ? 4 : 0 }}>
          {title}
        </span>
        {sub && (
          <span style={{ fontSize: 12, color: C.dim }}>{sub}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── FILTRO DE TURNO ───────────────────────────────────────────────────────
function TurnoFilter({ selected, onChange }: {
  selected: string; onChange: (t: string) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Filter size={12} color={C.muted} />
      <div style={{ display: "flex", gap: 4 }}>
        {TURNOS.map(t => {
          const active = selected === t;
          const color = TURNO_COLOR[t] ?? C.accent;
          return (
            <button key={t} onClick={() => onChange(t)} style={{
              fontFamily: "'Space Mono',monospace", fontSize: 10,
              padding: "4px 10px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${active ? color + "60" : C.dim}`,
              background: active ? `${color}18` : "transparent",
              color: active ? color : C.muted,
              transition: "all 0.15s",
            }}>
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── PÁGINA ────────────────────────────────────────────────────────────────
export default function Page() {
  const [kpis, setKpis]               = useState<KPIs | null>(null);
  const [alertasRaw, setAlertasRaw]   = useState<AlertaRaw[]>([]);
  const [tendencia, setTendencia]     = useState<PuntoTendencia[]>([]);
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [historico, setHistorico]     = useState<RegistroRaw[]>([]);
  const [turnoFiltro, setTurnoFiltro] = useState("Todos");
  const [loaded, setLoaded]           = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/kpis").then(r => r.json()),
      fetch("/api/tendencia").then(r => r.json()),
      fetch("/api/predicciones").then(r => r.json()),
      // Historico completo para analytics
      fetch("/api/tendencia?turno=todos").then(r => r.json()),
    ]).then(async ([k, t, p]) => {
      // Cargamos el JSON crudo para analytics
      const raw = await fetch("/api/historico").then(r => r.json()).catch(() => ({ registros: [] }));
      setKpis(k.kpis);
      setAlertasRaw(k.alertas ?? []);
      setTendencia(t.tendencia ?? []);
      setPredicciones(p.predicciones ?? []);
      setHistorico(raw.registros ?? []);
      setLoaded(true);
    });
  }, []);

  // ── Analytics derivados ──────────────────────────────────────────────
  const anomalias = useMemo(
    () => historico.length ? detectarAnomalias(historico) : [],
    [historico]
  );
  const turnosStats = useMemo(
    () => historico.length ? analizarPorTurno(historico, anomalias) : [],
    [historico, anomalias]
  );
  const resumenEjecutivo = useMemo(
    () => historico.length && turnosStats.length
      ? calcularResumenEjecutivo(historico, turnosStats, anomalias)
      : null,
    [historico, turnosStats, anomalias]
  );
  const alertasInteligentes = useMemo(
    () => enriquecerAlertas(alertasRaw),
    [alertasRaw]
  );

  // ── Tendencia filtrada por turno ────────────────────────────────────
  const tendenciaFiltrada = useMemo(() => {
    if (turnoFiltro === "Todos" || !historico.length) {
      return tendencia.map(d => ({ ...d, fecha: d.fecha.slice(5) }));
    }
    // Filtrar histórico por turno y reagrupar
    const filtrado = historico
      .filter(r => r.turno === turnoFiltro)
      .slice(-30);
    const porFecha: Record<string, { ton: number; ef: number[]; fecha: string }> = {};
    filtrado.forEach(r => {
      if (!porFecha[r.fecha]) porFecha[r.fecha] = { ton: 0, ef: [], fecha: r.fecha };
      porFecha[r.fecha].ton += r.toneladas;
      porFecha[r.fecha].ef.push(r.eficiencia);
    });
    return Object.values(porFecha).map(d => ({
      fecha: d.fecha.slice(5),
      toneladas: Math.round(d.ton),
      eficiencia: +(d.ef.reduce((a, b) => a + b, 0) / d.ef.length).toFixed(1),
      meta_toneladas: 2400,
    }));
  }, [turnoFiltro, tendencia, historico]);

  const predFmt = predicciones.map(d => ({ ...d, fecha: d.fecha.slice(5) }));
  const chartColor = TURNO_COLOR[turnoFiltro] ?? C.accent;

  // ── Colores KPI eficiencia ──────────────────────────────────────────
  const efColor = !kpis ? C.accent
    : kpis.eficiencia_promedio >= 85 ? C.green
    : kpis.eficiencia_promedio >= 70 ? C.yellow : C.red;

  // ── Loading ─────────────────────────────────────────────────────────
  if (!loaded || !kpis) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: C.bg, flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%",
        border: `2px solid ${C.dim}`, borderTop: `2px solid ${C.accent}`,
        animation: "spin 1s linear infinite" }} />
      <span style={{ fontFamily: "'Space Mono',monospace",
        fontSize: 12, color: C.muted }}>
        Cargando datos operativos...
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      padding: "32px 40px",
      backgroundImage: `
        linear-gradient(rgba(56,165,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56,165,255,0.025) 1px, transparent 1px)`,
      backgroundSize: "48px 48px",
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto",
        display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start",
          justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center",
              gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>⛏</span>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28,
                fontWeight: 800, color: C.text, margin: 0 }}>
                Mine<span style={{ color: C.accent }}>Track</span>
              </h1>
            </div>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 11,
              color: C.muted, letterSpacing: "0.15em",
              textTransform: "uppercase", margin: 0 }}>
              Dashboard Operativo · Producción de Hierro · Empresa MTX
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {alertasRaw.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "6px 14px", borderRadius: 20,
                background: `${C.red}15`, border: `1px solid ${C.red}40` }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%",
                  background: C.red, display: "inline-block" }} />
                <span style={{ fontFamily: "'Space Mono',monospace",
                  fontSize: 11, color: C.red }}>
                  {alertasRaw.length} alertas activas
                </span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "6px 14px", borderRadius: 20,
              background: `${C.green}12`, border: `1px solid ${C.green}30` }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%",
                background: C.green, display: "inline-block" }} />
              <span style={{ fontFamily: "'Space Mono',monospace",
                fontSize: 11, color: C.green }}>
                {new Date().toLocaleDateString("es-MX", {
                  weekday: "short", day: "numeric", month: "short"
                })}
              </span>
            </div>
          </div>
        </div>

        {/* ── 1. RESUMEN EJECUTIVO ── */}
        {resumenEjecutivo && (
          <ExecutiveSummary resumen={resumenEjecutivo} />
        )}

        {/* ── 2. KPI CARDS ── */}
        <Section title="Indicadores Clave — Producción de Hoy"
          sub="Comparativa vs día anterior">
          <div style={{ display: "grid",
            gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            <KPICard title="Toneladas Procesadas"
              value={kpis.toneladas_total.toLocaleString()} unit="ton/día"
              variacion={kpis.toneladas_total_var} meta="7,200 ton"
              icon={BarChart2} color={C.accent} />
            <KPICard title="Eficiencia Extracción"
              value={kpis.eficiencia_promedio.toString()} unit="%"
              variacion={kpis.eficiencia_promedio_var} meta="85%"
              icon={Activity} color={efColor} />
            <KPICard title="Tiempo Operativo"
              value={kpis.tiempo_operativo_promedio.toString()} unit="h/turno"
              variacion={kpis.tiempo_operativo_promedio_var} meta="8 h"
              icon={Clock} color={C.purple} />
            <KPICard title="Consumo Energético"
              value={kpis.consumo_promedio.toString()} unit="kWh/ton"
              variacion={kpis.consumo_promedio_var} meta="<20 kWh"
              icon={Zap} color={C.yellow} invertVar />
          </div>
        </Section>

        {/* ── 3. GRÁFICAS ── */}
        <div style={{ display: "grid",
          gridTemplateColumns: "1.3fr 0.7fr", gap: 24 }}>

          {/* Tendencia con filtro */}
          <Section title="Tendencia de Producción — Últimos 30 días"
            sub="Filtra por turno para comparar segmentos">
            <div style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { label: "Toneladas", color: chartColor },
                  { label: "Eficiencia %", color: C.green },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex",
                    alignItems: "center", gap: 6 }}>
                    <span style={{ width: 20, height: 2, background: l.color,
                      borderRadius: 2, display: "inline-block" }} />
                    <span style={{ fontFamily: "'Space Mono',monospace",
                      fontSize: 10, color: C.muted }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <TurnoFilter selected={turnoFiltro} onChange={setTurnoFiltro} />
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={tendenciaFiltrada}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="fecha"
                  tick={{ fill: C.muted, fontSize: 10, fontFamily: "Space Mono" }}
                  tickLine={false} axisLine={false} interval={4} />
                <YAxis yAxisId="t"
                  tick={{ fill: C.muted, fontSize: 10, fontFamily: "Space Mono" }}
                  tickLine={false} axisLine={false} width={54} />
                <YAxis yAxisId="e" orientation="right" domain={[40, 100]}
                  tick={{ fill: C.muted, fontSize: 10, fontFamily: "Space Mono" }}
                  tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Area yAxisId="t" type="monotone" dataKey="toneladas"
                  name="Toneladas" stroke={chartColor} strokeWidth={2}
                  fill="url(#gT)" dot={false} />
                <Line yAxisId="e" type="monotone" dataKey="eficiencia"
                  name="Eficiencia %" stroke={C.green} strokeWidth={2}
                  dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Section>

          {/* Predicción */}
          <Section title="Predicción — Próximos 7 días"
            sub={`Regresión Lineal · IC 90% · R² > 0.84`}>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={predFmt}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.accent} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="fecha"
                  tick={{ fill: C.muted, fontSize: 10, fontFamily: "Space Mono" }}
                  tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fill: C.muted, fontSize: 10, fontFamily: "Space Mono" }}
                  tickLine={false} axisLine={false} width={56} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="limite_superior"
                  stroke="transparent" fill="url(#gP)" />
                <Area type="monotone" dataKey="limite_inferior"
                  stroke="transparent" fill={C.bg} />
                <Line type="monotone" dataKey="prediccion"
                  name="Predicción ton" stroke={C.accent} strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const dc = payload.es_mantenimiento ? C.yellow
                      : payload.es_fin_semana ? C.muted : C.accent;
                    return <circle key={`d${cx}`} cx={cx} cy={cy} r={5}
                      fill={dc} stroke={C.bg} strokeWidth={2} />;
                  }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { color: C.accent,  label: "Normal" },
                { color: C.yellow,  label: "Mantenimiento" },
                { color: C.muted,   label: "Fin de semana" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex",
                  alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%",
                    background: l.color, display: "inline-block",
                    border: `2px solid ${C.bg}` }} />
                  <span style={{ fontFamily: "'Space Mono',monospace",
                    fontSize: 10, color: C.muted }}>{l.label}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ── 4. ANÁLISIS POR TURNO ── */}
        {turnosStats.length > 0 && (
          <SegmentAnalysis turnos={turnosStats} />
        )}

        {/* ── 5. ALERTAS INTELIGENTES ── */}
        <AlertasBadge alertas={alertasInteligentes} />

        {/* ── 6. ANOMALÍAS ── */}
        {anomalias.length > 0 && (
          <AnomalyBadge anomalias={anomalias} />
        )}

        {/* ── FOOTER ── */}
        <div style={{ display: "flex", justifyContent: "space-between",
          paddingTop: 20, borderTop: `1px solid ${C.dim}` }}>
          <span style={{ fontFamily: "'Space Mono',monospace",
            fontSize: 10, color: C.dim }}>
            MineTrack v2.0 · Datos sintéticos con variación estadística real
          </span>
          <span style={{ fontFamily: "'Space Mono',monospace",
            fontSize: 10, color: C.dim }}>
            Z-score · Regresión Lineal · IC 90% · R² &gt; 0.84
          </span>
        </div>

      </div>
    </div>
  );
}