"use client";
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine
} from "recharts";

interface Punto {
  fecha: string;
  toneladas: number;
  eficiencia: number;
  meta_toneladas: number;
  meta_eficiencia: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(6,13,26,0.95)", border: "1px solid var(--border-accent)",
      borderRadius: 12, padding: "12px 16px", backdropFilter: "blur(16px)"
    }}>
      <p className="mono text-xs mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "var(--text-muted)" }}>{p.name}:</span>
          <span className="mono font-bold" style={{ color: p.color }}>
            {p.value?.toLocaleString()}{p.name === "Eficiencia %" ? "%" : " ton"}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function GraficaTendencia({ datos }: { datos: Punto[] }) {
  const formateados = datos.map(d => ({ ...d, fecha: d.fecha.slice(5) }));

  return (
    <div className="glass fade-up delay-3 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs mono uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
            Tendencia de Producción
          </p>
          <p className="text-lg font-bold">Últimos 30 días</p>
        </div>
        <div className="flex gap-4 text-xs mono">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded" style={{ background: "var(--accent)", display: "inline-block" }} />
            <span style={{ color: "var(--text-muted)" }}>Toneladas</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded" style={{ background: "var(--green)", display: "inline-block" }} />
            <span style={{ color: "var(--text-muted)" }}>Eficiencia</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={formateados} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradTon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#38a5ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38a5ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEfic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#34d399" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="fecha" tick={{ fill: "#4d7099", fontSize: 10, fontFamily: "Space Mono" }}
            tickLine={false} axisLine={false} interval={4} />
          <YAxis yAxisId="ton" tick={{ fill: "#4d7099", fontSize: 10, fontFamily: "Space Mono" }}
            tickLine={false} axisLine={false} width={52} />
          <YAxis yAxisId="efic" orientation="right" domain={[40, 100]}
            tick={{ fill: "#4d7099", fontSize: 10, fontFamily: "Space Mono" }}
            tickLine={false} axisLine={false} width={36} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine yAxisId="ton" y={formateados[0]?.meta_toneladas}
            stroke="#38a5ff" strokeDasharray="4 4" strokeOpacity={0.4} />
          <ReferenceLine yAxisId="efic" y={85}
            stroke="#34d399" strokeDasharray="4 4" strokeOpacity={0.4} />
          <Area yAxisId="ton" type="monotone" dataKey="toneladas" name="Toneladas"
            stroke="#38a5ff" strokeWidth={2} fill="url(#gradTon)" dot={false} />
          <Line yAxisId="efic" type="monotone" dataKey="eficiencia" name="Eficiencia %"
            stroke="#34d399" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}