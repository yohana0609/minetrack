import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  unit: string;
  variacion: number;
  meta?: string;
  icon: LucideIcon;
  color: string;
  glowClass: string;
  delay: string;
  invertVariacion?: boolean;
}

export default function KPICard({
  title, value, unit, variacion, meta, icon: Icon,
  color, glowClass, delay, invertVariacion = false
}: KPICardProps) {
  const isPositive = invertVariacion ? variacion <= 0 : variacion >= 0;
  const varDisplay = Math.abs(variacion);

  return (
    <div className={`glass ${glowClass} fade-up ${delay} p-6 flex flex-col gap-4 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20"
        style={{ background: color, transform: 'translate(30%, -30%)' }} />

      {/* Top row */}
      <div className="flex items-start justify-between relative z-10">
        <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {title}
        </p>
        <div className="p-2 rounded-lg" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>

      {/* Value */}
      <div className="relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight mono" style={{ color: "var(--text)" }}>
            {value}
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{unit}</span>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold mono px-2 py-1 rounded"
            style={{
              background: isPositive ? "var(--green-glow)" : "var(--red-glow)",
              color: isPositive ? "var(--green)" : "var(--red)",
              border: `1px solid ${isPositive ? "var(--green)" : "var(--red)"}33`
            }}>
            {isPositive ? "▲" : "▼"} {varDisplay}%
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>vs ayer</span>
        </div>
        {meta && (
          <span className="text-xs mono" style={{ color: "var(--text-dim)" }}>
            meta {meta}
          </span>
        )}
      </div>

      {/* Progress bar toward meta */}
      {meta && (
        <div className="relative z-10 h-0.5 rounded-full" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(isPositive ? 85 : 60, 100)}%`,
              background: `linear-gradient(90deg, ${color}, ${color}88)`
            }} />
        </div>
      )}
    </div>
  );
}