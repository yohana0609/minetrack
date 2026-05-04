"use client";
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

interface Prediccion {
  fecha: string;
  prediccion: number;
  limite_inferior: number;
  limite_superior: number;
  es_fin_semana: boolean;
  es_mantenimiento: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: "rgba(6,13,26,0.95)", border: "1px solid var(--border-accent)",
      borderRadius: 12, padding: "12px 16px", backdropFilter: "blur(16px)"
    }}>
      <p className="mono text-xs mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="mono font-bold text-sm" style={{ color: "var(--accent)" }}>
        {d?.prediccion?.toLocaleString()} ton
      </p>
      <p className="mono text-xs mt-1" style={{ color: "var(--text-muted)" }}>
        IC 90%: {d?.limite_inferior?.toLocaleString()} – {d?.limite_superior?.toLocaleString()}
      </p>
      {d?.es_mantenimiento && (
        <p className="text-xs mt-1" style={{ color: "var(--yellow)" }}>🔧 Día de mantenimiento</p>
      )}
      {d?.es_fin_semana && (
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>FDS — producción reducida</p>
      )}
    </div>
  );
};

export default function GraficaPredicciones({ datos }: { datos: Prediccion[] }) {
  const formateados = datos.map(d => ({ ...d, fecha: d.fecha.slice(5) }));

  return (
    <div className="glass fade-up delay-4 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs mono uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
            Modelo Predictivo · Regresión Lineal
          </p>
          <p className="text-lg font-bold">Próximos 7 días</p>
        </div>
        <span className="text-xs mono px-2 py-1 rounded"
          style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid var(--border-accent)" }}>
          IC 90%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={formateados} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPred" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#38a5ff" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#38a5ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="fecha" tick={{ fill: "#4d7099", fontSize: 10, fontFamily: "Space Mono" }}
            tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#4d7099", fontSize: 10, fontFamily: "Space Mono" }}
            tickLine={false} axisLine={false} width={58} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="limite_superior"
            stroke="transparent" fill="url(#gradPred)" />
          <Area type="monotone" dataKey="limite_inferior"
            stroke="transparent" fill="var(--bg)" />
          <Line type="monotone" dataKey="prediccion" name="Predicción"
            stroke="#38a5ff" strokeWidth={2.5}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const color = payload.es_mantenimiento ? "#fbbf24" : payload.es_fin_semana ? "#4d7099" : "#38a5ff";
              return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={5} fill={color} stroke="var(--bg)" strokeWidth={2} />;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Leyenda de dots */}
      <div className="flex gap-4 text-xs mono">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2" style={{ background: "#38a5ff", borderColor: "var(--bg)" }} />
          <span style={{ color: "var(--text-muted)" }}>Normal</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2" style={{ background: "#fbbf24", borderColor: "var(--bg)" }} />
          <span style={{ color: "var(--text-muted)" }}>Mantenimiento</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2" style={{ background: "#4d7099", borderColor: "var(--bg)" }} />
          <span style={{ color: "var(--text-muted)" }}>Fin de semana</span>
        </span>
      </div>
    </div>
  );
}