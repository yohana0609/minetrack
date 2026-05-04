"use client";
import { Zap, TrendingDown, TrendingUp } from "lucide-react";
import type { Anomalia } from "../lib/analytics";
import { explicarAnomalia } from "../lib/intelligence";

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

function zColor(z: number): string {
  if (z >= 3.5) return C.red;
  if (z >= 2.8) return C.yellow;
  return C.accent;
}

function ZBar({ z, max = 4 }: { z: number; max?: number }) {
  const pct = Math.min((z / max) * 100, 100);
  const color = zColor(z);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2,
        background: "rgba(255,255,255,0.06)" }}>
        <div style={{
          height: "100%", borderRadius: 2, width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          transition: "width 0.8s ease",
        }} />
      </div>
      <span style={{ fontFamily: "'Space Mono',monospace",
        fontSize: 11, color, minWidth: 32, textAlign: "right" }}>
        {z}σ
      </span>
    </div>
  );
}

export default function AnomalyBadge({ anomalias }: { anomalias: Anomalia[] }) {
  if (!anomalias.length) return null;

  return (
    <div style={{
      background: C.glass,
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      padding: "24px",
      backdropFilter: "blur(20px)",
      display: "flex",
      flexDirection: "column",
      gap: 20,
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
            <Zap size={15} color={C.red} />
          </div>
          <div>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11,
              letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted,
              display: "block" }}>
              Detección de Anomalías
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>
              Método Z-score · umbral 2.3σ · últimas 48 h
            </span>
          </div>
        </div>
        <span style={{
          fontFamily: "'Space Mono',monospace", fontSize: 11,
          padding: "4px 10px", borderRadius: 8,
          background: "rgba(248,113,113,0.12)",
          color: C.red, border: "1px solid rgba(248,113,113,0.25)",
        }}>
          {anomalias.length} evento{anomalias.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {anomalias.map((a, i) => {
          const color = zColor(a.zScore);
          const DirIcon = a.direccion === "bajo" ? TrendingDown : TrendingUp;
          const explicacion = explicarAnomalia(a);

          return (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 16, alignItems: "start",
              padding: "14px 16px", borderRadius: 14,
              background: `${color}08`,
              border: `1px solid ${color}25`,
              borderLeft: `3px solid ${color}`,
            }}>
              {/* Icono + turno */}
              <div style={{ display: "flex", flexDirection: "column",
                alignItems: "center", gap: 6, paddingTop: 2 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8,
                  background: `${color}18`, display: "flex",
                  alignItems: "center", justifyContent: "center" }}>
                  <DirIcon size={14} color={color} />
                </div>
                <span style={{ fontFamily: "'Space Mono',monospace",
                  fontSize: 9, color: C.muted, textAlign: "center",
                  textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {a.turno.slice(0, 3)}
                </span>
              </div>

              {/* Contenido */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'Space Mono',monospace",
                    fontSize: 11, fontWeight: 700, color }}>
                    {a.metrica}
                  </span>
                  <span style={{ fontFamily: "'Space Mono',monospace",
                    fontSize: 10, color: C.muted }}>
                    {a.fecha}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: C.text, margin: 0,
                  lineHeight: 1.6 }}>
                  {explicacion}
                </p>
                <ZBar z={a.zScore} />
              </div>

              {/* Valor */}
              <div style={{ display: "flex", flexDirection: "column",
                alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontFamily: "'Space Mono',monospace",
                  fontSize: 20, fontWeight: 700, color }}>
                  {a.valor}
                </span>
                <span style={{ fontFamily: "'Space Mono',monospace",
                  fontSize: 10, color: C.muted }}>
                  media: {a.mediaHistorica}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nota metodológica */}
      <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 10,
        color: C.dim, margin: 0, paddingTop: 8,
        borderTop: `1px solid ${C.dim}` }}>
        Una anomalía se define como cualquier valor que se desvía más de 2.3 desviaciones
        estándar (σ) de la media histórica del indicador en ese mismo turno.
        Los eventos con Z &gt; 3.5σ se consideran de alta severidad.
      </p>
    </div>
  );
}