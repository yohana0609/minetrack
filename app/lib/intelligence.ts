import type { Anomalia } from "./analytics";

export interface AlertaInteligente {
  nivel: "critico" | "advertencia";
  mensaje: string;
  turno: string;
  fecha: string;
  causa_probable: string;
  recomendacion: string;
  categoria: "eficiencia" | "produccion" | "energia" | "tiempo";
  prioridad: number; // 1 = más urgente
}

// ── BASE DE CONOCIMIENTO ─────────────────────────────────────────────────
const CAUSAS: Record<string, {
  causas: string[];
  recomendaciones: string[];
}> = {
  eficiencia_critica_nocturno: {
    causas: [
      "Fatiga acumulada en operadores — turno nocturno de alto riesgo",
      "Iluminación insuficiente en zona de extracción",
      "Reducción de supervisión en horario nocturno",
    ],
    recomendaciones: [
      "Revisar rotación de personal y descansos obligatorios",
      "Verificar sistemas de iluminación en pit y zonas de carga",
      "Aumentar frecuencia de supervisión entre 00:00 – 04:00 h",
    ],
  },
  eficiencia_critica_general: {
    causas: [
      "Falla mecánica o desgaste acelerado en equipo de extracción",
      "Condiciones geológicas adversas en frente de trabajo actual",
      "Desabasto de insumos (combustible, explosivos, agua industrial)",
    ],
    recomendaciones: [
      "Detener operación y realizar inspección de maquinaria pesada",
      "Solicitar evaluación geológica del frente activo",
      "Verificar inventario de insumos críticos con logística",
    ],
  },
  eficiencia_baja: {
    causas: [
      "Ciclos de acarreo subóptimos por congestionamiento en vías",
      "Variabilidad en calidad del mineral en zona actual",
      "Mantenimiento preventivo no ejecutado en tiempo",
    ],
    recomendaciones: [
      "Revisar rutas de acarreo y optimizar tiempos de ciclo",
      "Evaluar cambio de frente de trabajo si la calidad es consistentemente baja",
      "Programar mantenimiento preventivo en próxima ventana disponible",
    ],
  },
  consumo_alto: {
    causas: [
      "Equipos operando fuera de parámetros eficientes (sobrecargas)",
      "Pérdidas en sistema de distribución eléctrica",
      "Condiciones de terreno que incrementan demanda energética",
    ],
    recomendaciones: [
      "Auditar consumo por equipo — identificar unidades fuera de norma",
      "Revisar estado de subestaciones y cables de alta tensión",
      "Evaluar condiciones de caminos y pendientes en rutas activas",
    ],
  },
  tiempo_bajo: {
    causas: [
      "Paros no programados por falla de equipo",
      "Demoras en relevo de turnos o ausencias de personal",
      "Interrupciones por condiciones climáticas o de seguridad",
    ],
    recomendaciones: [
      "Revisar bitácora de paros y clasificar por tipo de causa raíz",
      "Reforzar protocolo de relevo para minimizar tiempo muerto",
      "Evaluar condiciones de seguridad antes de reanudar operación",
    ],
  },
};

function elegirCausa(causas: string[]): string {
  // Siempre la primera — determinista para datos sintéticos
  return causas[0];
}
function elegirRecomendacion(recs: string[]): string {
  return recs[0];
}

// ── ENRIQUECEDOR DE ALERTAS ──────────────────────────────────────────────
export function enriquecerAlertas(alertas: Array<{
  nivel: "critico" | "advertencia";
  mensaje: string;
  turno: string;
  fecha: string;
}>): AlertaInteligente[] {
  return alertas.map((a, i) => {
    const msg = a.mensaje.toLowerCase();
    const esNocturno = a.turno === "Nocturno";

    let base = CAUSAS.eficiencia_baja;
    let categoria: AlertaInteligente["categoria"] = "eficiencia";

    if (msg.includes("crítica") || msg.includes("critica")) {
      base = esNocturno
        ? CAUSAS.eficiencia_critica_nocturno
        : CAUSAS.eficiencia_critica_general;
      categoria = "eficiencia";
    } else if (msg.includes("baja")) {
      base = CAUSAS.eficiencia_baja;
      categoria = "eficiencia";
    } else if (msg.includes("consumo") || msg.includes("energético")) {
      base = CAUSAS.consumo_alto;
      categoria = "energia";
    } else if (msg.includes("tiempo")) {
      base = CAUSAS.tiempo_bajo;
      categoria = "tiempo";
    }

    return {
      ...a,
      causa_probable:  elegirCausa(base.causas),
      recomendacion:   elegirRecomendacion(base.recomendaciones),
      categoria,
      prioridad: a.nivel === "critico" ? 1 : i + 2,
    };
  }).sort((a, b) => a.prioridad - b.prioridad);
}

// ── INTELIGENCIA PARA ANOMALÍAS ──────────────────────────────────────────
export function explicarAnomalia(a: Anomalia): string {
  const metrica = a.metrica.toLowerCase();
  const dir = a.direccion === "bajo" ? "inusualmente baja" : "inusualmente alta";

  if (metrica.includes("eficiencia")) {
    return a.direccion === "bajo"
      ? `Rendimiento ${dir} (${a.valor}% vs media ${a.mediaHistorica}%). Posible falla operativa o condición geológica adversa.`
      : `Eficiencia pico detectada (${a.valor}%). Verificar si es sostenible o resultado de medición atípica.`;
  }
  if (metrica.includes("toneladas")) {
    return a.direccion === "bajo"
      ? `Producción ${dir} (${a.valor} ton vs media ${a.mediaHistorica} ton). Revisar disponibilidad de equipo y frente de trabajo.`
      : `Producción pico (${a.valor} ton). Documentar condiciones para replicar.`;
  }
  if (metrica.includes("consumo")) {
    return `Consumo energético ${dir} (${a.valor} kWh/ton vs media ${a.mediaHistorica}). Posible sobrecarga en equipos eléctricos.`;
  }
  if (metrica.includes("tiempo")) {
    return `Tiempo operativo ${dir} (${a.valor} h vs media ${a.mediaHistorica} h). Verificar paros no registrados en bitácora.`;
  }
  return `Valor ${dir} (${a.valor} vs media ${a.mediaHistorica}). Requiere revisión.`;
}