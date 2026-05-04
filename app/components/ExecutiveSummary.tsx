"use client";
import { TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, XCircle } from "lucide-react";
import type { ResumenEjecutivo } from "../lib/analytics";

const C = {
  bg:     "#060d1a",
  glass:  "rgba(11,22,40,0.8)",
  border: "rgba(56,165,255,0.12)",
  accent: "#38a5ff",
  green:  "#34d399",
  yellow: "#fbbf24",
  red:    "#f87171",
  muted:  "#4d7099",
  dim:    "#1e3350",
  text:   "#e8f4ff",
};

const ESTADO_CONFIG = {
  nominal: {
    color:    C.green,
    bg:       "rgba(52,211,153,0.08)",
    border:   "rgba(52,211,153,0.2)",
    icon:     Shield,
    label:    "OPERACIÓN NOMINAL",
  },
  advertencia: {
    color:    C.yellow,
    bg:       "rgba(251,191,36,0.08)",
    border:   "rgba(251,191,36,0.2)",
    icon:     AlertTriangle,
    label:    "ATENCIÓN REQUERIDA",
  },
  critico: {
    color:    C.red,
    bg:       "rgba(248,113,113,0.08)",
    border:   "rgba(248,113,113,0.2)",
    icon:     XCircle,
    label:    "ESTADO CRÍTICO",
  },
};

function StatBox({ label, value, unit, color = C.text, sub }: {
  label: string; value: string | number; unit?: string; color?: string; sub?: string;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6,
      padding: "16px 20px", borderRadius: 14,
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${C.dim}`,
      flex: 1, minWidth: 120,
    }}>
      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10,
        letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 26,
          fontWeight: 700, color, lineHeight: 1 }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 12, color: C.muted }}>{unit}</span>
        )}
      </div>
      {sub && (
        <span style={{ fontSize: 11, color: C.muted }}>{sub}</span>
      )}
    </div>
  );
}

export default function ExecutiveSummary({ resumen }: { resumen: ResumenEjecutivo }) {
  const cfg = ESTADO_CONFIG[resumen.estado];
  const Icon = cfg.icon;

  const TendIcon = resumen.tendencia_7d === "subiendo" ? TrendingUp
    : resumen.tendencia_7d === "bajando" ? TrendingDown : Minus;
  const tendColor = resumen.tendencia_7d === "subiendo" ? C.green
    : resumen.tendencia_7d === "bajando" ? C.red : C.muted;

  const efColor = resumen.eficiencia_global >= 85 ? C.green
    : resumen.eficiencia_global >= 70 ? C.yellow : C.red;

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 20,
      padding: "24px 28px",
      backdropFilter: "blur(20px)",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      boxShadow: `0 0 60px ${cfg.color}08`,
      marginBottom: 24,
    }}>

      {/* ── Top: estado + frase ── */}
      <div style={{ display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `${cfg.color}18`,
            border: `1px solid ${cfg.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon size={20} color={cfg.color} />
          </div>
          <div>
            <span style={{
              fontFamily: "'Space Mono',monospace", fontSize: 11,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: cfg.color, display: "block", marginBottom: 4,
            }}>
              {cfg.label}
            </span>
            <p style={{ fontSize: 13, color: C.text, margin: 0,
              lineHeight: 1.5, maxWidth: 520 }}>
              {resumen.frase_estado}
            </p>
          </div>
        </div>

        {/* Tendencia badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 16px", borderRadius: 12,
          background: `${tendColor}12`,
          border: `1px solid ${tendColor}30`,
          flexShrink: 0,
        }}>
          <TendIcon size={16} color={tendColor} />
          <div>
            <span style={{ fontFamily: "'Space Mono',monospace",
              fontSize: 10, color: C.muted, display: "block" }}>
              Tendencia 7d
            </span>
            <span style={{ fontFamily: "'Space Mono',monospace",
              fontSize: 13, fontWeight: 700, color: tendColor }}>
              {resumen.tendencia_7d === "subiendo" ? "▲" : resumen.tendencia_7d === "bajando" ? "▼" : "→"}{" "}
              {Math.abs(resumen.variacion_7d)}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Métricas ejecutivas ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatBox
          label="Eficiencia global hoy"
          value={resumen.eficiencia_global}
          unit="%"
          color={efColor}
          sub={resumen.eficiencia_global >= 85 ? "✓ Por encima de meta" : "✗ Por debajo de meta (85%)"}
        />
        <StatBox
          label="Producción total hoy"
          value={resumen.produccion_total_hoy.toLocaleString()}
          unit="ton"
          color={C.accent}
          sub={`Meta: 7,200 ton`}
        />
        <StatBox
          label="Mejor turno"
          value={resumen.mejor_turno}
          color={C.green}
          sub="Mayor score operativo"
        />
        <StatBox
          label="Turno con más riesgo"
          value={resumen.peor_turno}
          color={resumen.n_anomalias > 0 ? C.red : C.muted}
          sub="Menor score operativo"
        />
        <StatBox
          label="Anomalías detectadas"
          value={resumen.n_anomalias}
          color={resumen.n_anomalias === 0 ? C.green : resumen.n_anomalias < 3 ? C.yellow : C.red}
          sub={resumen.n_anomalias === 0 ? "Sin eventos atípicos" : "Últimas 48 h · Z > 2.3σ"}
        />
      </div>

      {/* ── Barra de salud operativa ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between",
          marginBottom: 8 }}>
          <span style={{ fontFamily: "'Space Mono',monospace",
            fontSize: 10, color: C.muted, letterSpacing: "0.1em",
            textTransform: "uppercase" }}>
            Índice de salud operativa
          </span>
          <span style={{ fontFamily: "'Space Mono',monospace",
            fontSize: 10, color: cfg.color }}>
            {resumen.estado === "nominal" ? "ÓPTIMO"
              : resumen.estado === "advertencia" ? "MODERADO" : "CRÍTICO"}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 3,
          background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            width: `${resumen.eficiencia_global}%`,
            background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
            transition: "width 1.2s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between",
          marginTop: 4 }}>
          <span style={{ fontFamily: "'Space Mono',monospace",
            fontSize: 9, color: C.dim }}>0%</span>
          <span style={{ fontFamily: "'Space Mono',monospace",
            fontSize: 9, color: C.dim }}>Meta 85%</span>
          <span style={{ fontFamily: "'Space Mono',monospace",
            fontSize: 9, color: C.dim }}>100%</span>
        </div>
      </div>
    </div>
  );
}