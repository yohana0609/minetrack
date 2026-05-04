"use client";
import { AlertTriangle, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { AlertaInteligente } from "../lib/intelligence";

const C = {
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

const CAT_COLOR: Record<string, string> = {
  eficiencia: "#38a5ff",
  energia:    "#fbbf24",
  produccion: "#34d399",
  tiempo:     "#a78bfa",
};

function AlertaCard({ a }: { a: AlertaInteligente }) {
  const [expanded, setExpanded] = useState(false);
  const color = a.nivel === "critico" ? C.red : C.yellow;
  const catColor = CAT_COLOR[a.categoria] ?? C.accent;

  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      border: `1px solid ${color}28`,
      borderLeft: `3px solid ${color}`,
      transition: "box-shadow 0.2s",
    }}>
      {/* Row principal */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto",
          gap: 12, alignItems: "center",
          padding: "14px 16px",
          background: `${color}08`,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Nivel icon */}
        <div style={{ width: 28, height: 28, borderRadius: 8,
          background: `${color}18`, display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AlertTriangle size={13} color={color} />
        </div>

        {/* Mensaje */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3,
          minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8,
            flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Space Mono',monospace",
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color }}>
              {a.nivel}
            </span>
            <span style={{ fontFamily: "'Space Mono',monospace",
              fontSize: 10, padding: "1px 6px", borderRadius: 5,
              background: `${catColor}18`, color: catColor,
              border: `1px solid ${catColor}30` }}>
              {a.categoria}
            </span>
          </div>
          <span style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>
            {a.mensaje}
          </span>
          <span style={{ fontFamily: "'Space Mono',monospace",
            fontSize: 10, color: C.muted }}>
            {a.turno} · {a.fecha}
          </span>
        </div>

        {/* Prioridad */}
        <span style={{ fontFamily: "'Space Mono',monospace",
          fontSize: 10, color: C.muted, whiteSpace: "nowrap" }}>
          P{a.prioridad}
        </span>

        {/* Expand toggle */}
        <div style={{ color: C.muted }}>
          {expanded
            ? <ChevronUp size={14} />
            : <ChevronDown size={14} />}
        </div>
      </div>

      {/* Panel expandible */}
      {expanded && (
        <div style={{
          padding: "16px", display: "flex", flexDirection: "column", gap: 12,
          background: "rgba(0,0,0,0.2)",
          borderTop: `1px solid ${C.dim}`,
        }}>
          {/* Causa probable */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6,
              background: `${color}15`, display: "flex", flexShrink: 0,
              alignItems: "center", justifyContent: "center", marginTop: 1 }}>
              <AlertTriangle size={11} color={color} />
            </div>
            <div>
              <span style={{ fontFamily: "'Space Mono',monospace",
                fontSize: 10, color: C.muted, textTransform: "uppercase",
                letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>
                Causa probable
              </span>
              <p style={{ fontSize: 13, color: C.text, margin: 0,
                lineHeight: 1.6 }}>
                {a.causa_probable}
              </p>
            </div>
          </div>

          {/* Recomendación */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6,
              background: "rgba(52,211,153,0.12)", display: "flex", flexShrink: 0,
              alignItems: "center", justifyContent: "center", marginTop: 1 }}>
              <Lightbulb size={11} color={C.green} />
            </div>
            <div>
              <span style={{ fontFamily: "'Space Mono',monospace",
                fontSize: 10, color: C.muted, textTransform: "uppercase",
                letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>
                Acción recomendada
              </span>
              <p style={{ fontSize: 13, color: C.green, margin: 0,
                lineHeight: 1.6 }}>
                {a.recomendacion}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertasBadge({ alertas }: { alertas: AlertaInteligente[] }) {
  const criticas    = alertas.filter(a => a.nivel === "critico");
  const advertencias = alertas.filter(a => a.nivel === "advertencia");

  if (!alertas.length) {
    return (
      <div style={{
        background: C.glass, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "20px 24px",
        backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%",
          background: C.green, display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontSize: 14, color: C.muted }}>
          Sin alertas activas — todos los sistemas operando dentro de parámetros normales.
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: C.glass,
      border: `1px solid rgba(248,113,113,0.2)`,
      borderRadius: 20, padding: "24px",
      backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column", gap: 20,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between", paddingBottom: 16,
        borderBottom: `1px solid ${C.dim}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10,
            background: "rgba(248,113,113,0.12)",
            border: "1px solid rgba(248,113,113,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={15} color={C.red} />
          </div>
          <div>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: C.muted, display: "block" }}>
              Alertas Operativas Inteligentes
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>
              Haz clic en cada alerta para ver causa y recomendación
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {criticas.length > 0 && (
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11,
              padding: "4px 10px", borderRadius: 8,
              background: "rgba(248,113,113,0.12)", color: C.red,
              border: "1px solid rgba(248,113,113,0.25)" }}>
              {criticas.length} crítica{criticas.length > 1 ? "s" : ""}
            </span>
          )}
          {advertencias.length > 0 && (
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11,
              padding: "4px 10px", borderRadius: 8,
              background: "rgba(251,191,36,0.12)", color: C.yellow,
              border: "1px solid rgba(251,191,36,0.25)" }}>
              {advertencias.length} advertencia{advertencias.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {alertas.map((a, i) => <AlertaCard key={i} a={a} />)}
      </div>
    </div>
  );
}