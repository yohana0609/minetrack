// ── TIPOS EXPORTADOS ──────────────────────────────────────────────────────
export interface RegistroRaw {
  fecha: string;
  turno: string;
  toneladas: number;
  eficiencia: number;
  tiempo_operativo_h: number;
  consumo_kwh_ton: number;
  dia_num: number;
}

export interface EstadisticasMetrica {
  media: number;
  std: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
}

export interface Anomalia {
  fecha: string;
  turno: string;
  metrica: string;
  valor: number;
  zScore: number;
  direccion: "alto" | "bajo";
  mediaHistorica: number;
  desviaciones: number;
}

export interface EstadisticosTurno {
  turno: string;
  toneladas_media: number;
  toneladas_total: number;
  eficiencia_media: number;
  tiempo_media: number;
  consumo_media: number;
  n_registros: number;
  n_alertas: number;
  n_anomalias: number;
  ranking_eficiencia: number;
  ranking_produccion: number;
  score_general: number; // 0–100
}

export interface ResumenEjecutivo {
  estado: "nominal" | "advertencia" | "critico";
  eficiencia_global: number;
  produccion_total_hoy: number;
  mejor_turno: string;
  peor_turno: string;
  tendencia_7d: "subiendo" | "estable" | "bajando";
  variacion_7d: number;
  n_anomalias: number;
  frase_estado: string;
}

// ── HELPERS ESTADÍSTICOS ─────────────────────────────────────────────────
function percentil(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function estadisticas(valores: number[]): EstadisticasMetrica {
  const n = valores.length;
  const media = valores.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(valores.reduce((a, b) => a + (b - media) ** 2, 0) / n);
  return {
    media: +media.toFixed(2),
    std:   +std.toFixed(2),
    min:   +Math.min(...valores).toFixed(2),
    max:   +Math.max(...valores).toFixed(2),
    p25:   +percentil(valores, 25).toFixed(2),
    p75:   +percentil(valores, 75).toFixed(2),
  };
}

// ── DETECCIÓN DE ANOMALÍAS (Z-SCORE) ────────────────────────────────────
export function detectarAnomalias(
  registros: RegistroRaw[],
  umbralZ = 2.3
): Anomalia[] {
  const metricas: Array<{ key: keyof RegistroRaw; label: string; direccionMala: "alto" | "bajo" | "ambos" }> = [
    { key: "eficiencia",        label: "Eficiencia (%)",       direccionMala: "bajo" },
    { key: "toneladas",         label: "Toneladas",            direccionMala: "bajo" },
    { key: "consumo_kwh_ton",   label: "Consumo (kWh/ton)",    direccionMala: "alto" },
    { key: "tiempo_operativo_h",label: "Tiempo operativo (h)", direccionMala: "bajo" },
  ];

  const anomalias: Anomalia[] = [];

  for (const m of metricas) {
    const valores = registros.map(r => r[m.key] as number);
    const { media, std } = estadisticas(valores);
    if (std === 0) continue;

    // Solo últimos 6 registros (2 días) para no saturar
    const recientes = registros.slice(-6);
    for (const r of recientes) {
      const val = r[m.key] as number;
      const z = (val - media) / std;
      const absZ = Math.abs(z);
      if (absZ < umbralZ) continue;

      const direccion: "alto" | "bajo" = z > 0 ? "alto" : "bajo";
      // Filtrar por dirección relevante
      if (m.direccionMala !== "ambos" && direccion !== m.direccionMala) continue;

      anomalias.push({
        fecha:           r.fecha,
        turno:           r.turno,
        metrica:         m.label,
        valor:           +val.toFixed(2),
        zScore:          +absZ.toFixed(2),
        direccion,
        mediaHistorica:  +media.toFixed(2),
        desviaciones:    +absZ.toFixed(1),
      });
    }
  }

  // Ordenar por Z-score descendente, máximo 8
  return anomalias
    .sort((a, b) => b.zScore - a.zScore)
    .slice(0, 8);
}

// ── ANÁLISIS POR TURNO ───────────────────────────────────────────────────
export function analizarPorTurno(
  registros: RegistroRaw[],
  anomalias: Anomalia[]
): EstadisticosTurno[] {
  const turnos = ["Matutino", "Vespertino", "Nocturno"];

  const stats = turnos.map(turno => {
    const filas = registros.filter(r => r.turno === turno);
    if (!filas.length) return null;

    const ef = filas.map(r => r.eficiencia);
    const ton = filas.map(r => r.toneladas);
    const tiempo = filas.map(r => r.tiempo_operativo_h);
    const consumo = filas.map(r => r.consumo_kwh_ton);

    const media = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const efMedia  = +media(ef).toFixed(2);
    const tonMedia = +media(ton).toFixed(1);
    const tonTotal = +ton.reduce((a, b) => a + b, 0).toFixed(0);
    const tMedia   = +media(tiempo).toFixed(2);
    const cMedia   = +media(consumo).toFixed(2);

    const nAnomalias = anomalias.filter(a => a.turno === turno).length;

    // Score 0–100 compuesto
    const scoreEf  = Math.min(efMedia / 85, 1) * 40;
    const scoreTon = Math.min(tonMedia / 2400, 1) * 35;
    const scoreCon = Math.max(0, (1 - (cMedia - 15) / 15)) * 25;
    const score    = +(scoreEf + scoreTon + scoreCon).toFixed(1);

    return {
      turno,
      toneladas_media: tonMedia,
      toneladas_total: tonTotal,
      eficiencia_media: efMedia,
      tiempo_media: tMedia,
      consumo_media: cMedia,
      n_registros: filas.length,
      n_alertas: 0,   // se rellena abajo
      n_anomalias: nAnomalias,
      ranking_eficiencia: 0,
      ranking_produccion: 0,
      score_general: score,
    } as EstadisticosTurno;
  }).filter(Boolean) as EstadisticosTurno[];

  // Rankings
  const byEf  = [...stats].sort((a, b) => b.eficiencia_media - a.eficiencia_media);
  const byTon = [...stats].sort((a, b) => b.toneladas_media - a.toneladas_media);
  stats.forEach(s => {
    s.ranking_eficiencia = byEf.findIndex(x => x.turno === s.turno) + 1;
    s.ranking_produccion = byTon.findIndex(x => x.turno === s.turno) + 1;
  });

  return stats;
}

// ── RESUMEN EJECUTIVO ────────────────────────────────────────────────────
export function calcularResumenEjecutivo(
  registros: RegistroRaw[],
  turnosStats: EstadisticosTurno[],
  anomalias: Anomalia[]
): ResumenEjecutivo {
  // Últimos 3 registros = hoy
  const hoy = registros.slice(-3);
  const semana = registros.slice(-21); // 7 días × 3 turnos
  const semanaAnterior = registros.slice(-42, -21);

  const media = (arr: RegistroRaw[], key: keyof RegistroRaw) =>
    (arr.map(r => r[key] as number).reduce((a, b) => a + b, 0) / arr.length);

  const efHoy    = +media(hoy, "eficiencia").toFixed(2);
  const tonHoy   = +hoy.reduce((a, b) => a + b.toneladas, 0).toFixed(0);
  const efSem    = media(semana, "eficiencia");
  const efSemAnt = semanaAnterior.length ? media(semanaAnterior, "eficiencia") : efSem;
  const varSem   = +(((efSem - efSemAnt) / efSemAnt) * 100).toFixed(1);

  const tendencia: "subiendo" | "estable" | "bajando" =
    varSem > 2 ? "subiendo" : varSem < -2 ? "bajando" : "estable";

  const mejor = [...turnosStats].sort((a, b) => b.score_general - a.score_general)[0];
  const peor  = [...turnosStats].sort((a, b) => a.score_general - b.score_general)[0];

  const estado: "nominal" | "advertencia" | "critico" =
    anomalias.length > 3 || efHoy < 70 ? "critico"
    : anomalias.length > 1 || efHoy < 82 ? "advertencia"
    : "nominal";

  const frases: Record<typeof estado, string> = {
    nominal:     `Operación estable. Eficiencia global en ${efHoy}% — dentro de parámetros óptimos.`,
    advertencia: `Atención requerida. ${anomalias.length} anomalía(s) detectada(s). Eficiencia en ${efHoy}%, por debajo de meta (85%).`,
    critico:     `Estado crítico. ${anomalias.length} anomalía(s) activas. Eficiencia de ${efHoy}% requiere intervención inmediata.`,
  };

  return {
    estado,
    eficiencia_global: efHoy,
    produccion_total_hoy: tonHoy,
    mejor_turno: mejor?.turno ?? "—",
    peor_turno:  peor?.turno  ?? "—",
    tendencia_7d: tendencia,
    variacion_7d: varSem,
    n_anomalias: anomalias.length,
    frase_estado: frases[estado],
  };
}