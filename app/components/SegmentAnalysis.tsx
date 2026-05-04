"use client";
import { Trophy, TrendingUp, TrendingDown, Minus, Zap, Clock, BarChart2, Activity } from "lucide-react";
import type { EstadisticosTurno } from "../lib/analytics";

const C = {
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

const TURNO_COLOR: Record<string, string> = {
  Matutino:   "#38a5ff",
  Vespertino: "#fbbf24",
  Nocturno:   "#a78bfa",
};

const RANK_BADGE: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "1°", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  2: { label: "2°", color: "#94a3b8", bg: "rgba(148,163,184,0.10)" },
  3: { label: "3°", color: "#cd7c3a", bg: "rgba(205,124,58,0.10)" },
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: 4, borderRadius: 2,
      background: "rgba(255,255,255,0.05)", overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", borderRadius: 2,
        width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}55, ${color})`,
        transition: "width 1s ease",
      }} />
    </div>
  );
}

function MetricRow({ icon: Icon, label, value, unit, max, color, rank }: {
  icon: any; label: string; value: number; unit: string;
  max: number; color: string; rank?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Icon size={12} color={C.muted} style={{ flexShrink: 0 }} />
      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10,
        color: C.muted, minWidth: 72, textTransform: "uppercase",
        letterSpacing: "0.08em" }}>
        {label}
      </span>
      <MiniBar value={value} max={max} color={color} />
      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11,
        color, minWidth: 52, textAlign: "right" }}>
        {value.toLocaleString()}{unit}
      </span>
      {rank && (
        <span style={{
          fontFamily: "'Space Mono',monospace", fontSize: 10,
          padding: "1px 6px", borderRadius: 5,
          background: RANK_BADGE[rank]?.bg,
          color: RANK_BADGE[rank]?.color,
          minWidth: 24, textAlign: "center",
        }}>
          {RANK_BADGE[rank]?.label}
        </span>
      )}
    </div>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={{ position: "relative", width: 72, height: 72,
      flexShrink: 0, display: "flex", alignItems: "center",
      justifyContent: "center" }}>
      <svg width={72} height={72} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={36} cy={36} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={5} />
        <circle cx={36} cy={36} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s ease" }} />
      </svg>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontFamily: "'Space Mono',monospace",
          fontSize: 14, fontWeight: 700, color, display: "block",
          lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontFamily: "'Space Mono',monospace",
          fontSize: 8, color: C.muted }}>
          /100
        </span>
      </div>
    </div>
  );
}

export default function SegmentAnalysis({ turnos }: { turnos: EstadisticosTurno[] }) {
  if (!turnos.length) return null;

  const maxTon  = Math.max(...turnos.map(t => t.toneladas_media));
  const maxEf   = 100;
  const maxCon  = Math.max(...turnos.map(t => t.consumo_media)) * 1.1;
  const maxTiempo = 8;

  // Turno con más problemas
  const masProblemas = [...turnos].sort(
    (a, b) => (b.n_anomalias + b.n_alertas) - (a.n_anomalias + a.n_alertas)
  )[0];

  // Ranking por eficiencia para comparativa visual
  const byScore = [...turnos].sort((a, b) => b.score_general - a.score_general);

  return (
    <div style={{
      background: C.glass,
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      padding: "24px",
      backdropFilter: "blur(20px)",
      display: "flex",
      flexDirection: "column",
      gap: 24,
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between", paddingBottom: 16,
        borderBottom: `1px solid ${C.dim}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10,
            background: "rgba(56,165,255,0.12)",
            border: "1px solid rgba(56,165,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={15} color={C.accent} />
          </div>
          <div>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: C.muted, display: "block" }}>
              Análisis por Segmento de Turno
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>
              Comparativa objetiva · Histórico completo
            </span>
          </div>
        </div>
        {masProblemas && (
          <div style={{
            padding: "6px 12px", borderRadius: 10,
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
          }}>
            <span style={{ fontFamily: "'Space Mono',monospace",
              fontSize: 10, color: C.red }}>
              Mayor riesgo: {masProblemas.turno}
            </span>
          </div>
        )}
      </div>

      {/* Cards de turno */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {byScore.map((t, idx) => {
          const color = TURNO_COLOR[t.turno] ?? C.accent;
          const rankGlobal = idx + 1;

          return (
            <div key={t.turno} style={{
              borderRadius: 16, padding: "20px",
              background: `${color}07`,
              border: `1px solid ${color}25`,
              display: "flex", flexDirection: "column", gap: 16,
              position: "relative", overflow: "hidden",
            }}>
              {/* Rank badge top-right */}
              <div style={{
                position: "absolute", top: 14, right: 14,
                padding: "3px 8px", borderRadius: 8,
                background: RANK_BADGE[rankGlobal]?.bg,
                color: RANK_BADGE[rankGlobal]?.color,
                fontFamily: "'Space Mono',monospace", fontSize: 11,
                fontWeight: 700,
              }}>
                {RANK_BADGE[rankGlobal]?.label}
              </div>

              {/* Turno + score ring */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <ScoreRing score={t.score_general} color={color} />
                <div>
                  <span style={{ fontFamily: "'Space Mono',monospace",
                    fontSize: 13, fontWeight: 700, color, display: "block" }}>
                    {t.turno}
                  </span>
                  <span style={{ fontFamily: "'Space Mono',monospace",
                    fontSize: 10, color: C.muted }}>
                    {t.n_registros} registros
                  </span>
                </div>
              </div>

              {/* Métricas */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <MetricRow icon={Activity} label="Efic." unit="%"
                  value={t.eficiencia_media} max={maxEf} color={
                    t.eficiencia_media >= 85 ? C.green
                    : t.eficiencia_media >= 70 ? C.yellow : C.red
                  }
                  rank={t.ranking_eficiencia} />
                <MetricRow icon={BarChart2} label="Ton/turno" unit=""
                  value={t.toneladas_media} max={maxTon} color={color}
                  rank={t.ranking_produccion} />
                <MetricRow icon={Zap} label="kWh/ton" unit=""
                  value={t.consumo_media} max={maxCon} color={
                    t.consumo_media < 20 ? C.green : C.yellow
                  } />
                <MetricRow icon={Clock} label="Hrs op." unit="h"
                  value={t.tiempo_media} max={maxTiempo} color={color} />
              </div>

              {/* Incidencias */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {t.n_anomalias > 0 && (
                  <span style={{
                    fontFamily: "'Space Mono',monospace", fontSize: 10,
                    padding: "3px 8px", borderRadius: 6,
                    background: "rgba(248,113,113,0.12)",
                    color: C.red, border: "1px solid rgba(248,113,113,0.2)",
                  }}>
                    {t.n_anomalias} anomalía{t.n_anomalias > 1 ? "s" : ""}
                  </span>
                )}
                {t.n_anomalias === 0 && (
                  <span style={{
                    fontFamily: "'Space Mono',monospace", fontSize: 10,
                    padding: "3px 8px", borderRadius: 6,
                    background: "rgba(52,211,153,0.10)",
                    color: C.green, border: "1px solid rgba(52,211,153,0.2)",
                  }}>
                    Sin anomalías
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparativa horizontal de eficiencia */}
      <div style={{ paddingTop: 16, borderTop: `1px solid ${C.dim}` }}>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10,
          color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase",
          display: "block", marginBottom: 12 }}>
          Comparativa de eficiencia promedio histórica
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...turnos].sort((a, b) => b.eficiencia_media - a.eficiencia_media)
            .map(t => {
              const color = TURNO_COLOR[t.turno] ?? C.accent;
              const pct = (t.eficiencia_media / 100) * 100;
              const metaPct = 85;
              return (
                <div key={t.turno} style={{ display: "flex",
                  alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "'Space Mono',monospace",
                    fontSize: 11, color, minWidth: 88 }}>
                    {t.turno}
                  </span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4,
                    background: "rgba(255,255,255,0.04)",
                    position: "relative", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4,
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${color}55, ${color})`,
                      transition: "width 1s ease",
                    }} />
                    {/* Línea de meta */}
                    <div style={{
                      position: "absolute", top: 0, bottom: 0,
                      left: `${metaPct}%`, width: 2,
                      background: "rgba(255,255,255,0.2)",
                    }} />
                  </div>
                  <span style={{ fontFamily: "'Space Mono',monospace",
                    fontSize: 12, color, minWidth: 48, textAlign: "right" }}>
                    {t.eficiencia_media}%
                  </span>
                </div>
              );
            })}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <span style={{ fontFamily: "'Space Mono',monospace",
            fontSize: 9, color: C.dim }}>
            | línea vertical = meta 85%
          </span>
        </div>
      </div>
    </div>
  );
}