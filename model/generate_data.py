import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

np.random.seed(42)

TURNOS = ["Matutino", "Vespertino", "Nocturno"]
META_EFICIENCIA = 85.0
META_TONELADAS = 2400

def generar_datos(dias=90):
    registros = []
    fecha_inicio = datetime.now() - timedelta(days=dias)

    for dia in range(dias):
        fecha = fecha_inicio + timedelta(days=dia)
        es_fin_semana = fecha.weekday() >= 5
        es_mantenimiento = (dia % 15 == 0)  # mantenimiento cada 15 días

        for i, turno in enumerate(TURNOS):
            # Factores base por turno
            factor_turno = [1.0, 0.95, 0.88][i]

            # Reducción por fin de semana y mantenimiento
            factor_dia = 0.75 if es_fin_semana else 1.0
            factor_mant = 0.40 if es_mantenimiento else 1.0

            # Anomalía ocasional (5% de probabilidad)
            anomalia = np.random.random() < 0.05
            factor_anomalia = np.random.uniform(0.5, 0.65) if anomalia else 1.0

            # Toneladas procesadas
            toneladas = (
                META_TONELADAS
                * factor_turno
                * factor_dia
                * factor_mant
                * factor_anomalia
                * np.random.uniform(0.92, 1.08)
            )

            # Eficiencia de extracción (%)
            eficiencia = (
                META_EFICIENCIA
                * factor_turno
                * factor_dia
                * factor_mant
                * factor_anomalia
                * np.random.uniform(0.93, 1.07)
            )
            eficiencia = min(eficiencia, 99.5)

            # Tiempo operativo (horas de 8 posibles)
            tiempo_operativo = (
                8 * factor_mant * factor_anomalia
                * np.random.uniform(0.88, 1.0)
            )
            tiempo_operativo = min(tiempo_operativo, 8.0)

            # Consumo energético kWh/ton (sube cuando hay problemas)
            base_energia = 18.5
            factor_energia = (1 / max(eficiencia / META_EFICIENCIA, 0.4))
            consumo_energia = base_energia * factor_energia * np.random.uniform(0.95, 1.05)

            registros.append({
                "fecha": fecha.strftime("%Y-%m-%d"),
                "dia_num": dia,
                "turno": turno,
                "toneladas": round(toneladas, 1),
                "eficiencia": round(eficiencia, 2),
                "tiempo_operativo_h": round(tiempo_operativo, 2),
                "consumo_kwh_ton": round(consumo_energia, 2),
                "es_mantenimiento": es_mantenimiento,
                "anomalia": anomalia,
                "dia_semana": fecha.strftime("%A"),
                "es_fin_semana": es_fin_semana,
            })

    return pd.DataFrame(registros)


def calcular_kpis_hoy(df):
    hoy = df[df["dia_num"] == df["dia_num"].max()]
    ayer = df[df["dia_num"] == df["dia_num"].max() - 1]

    def agg(d):
        return {
            "toneladas_total": round(d["toneladas"].sum(), 1),
            "eficiencia_promedio": round(d["eficiencia"].mean(), 2),
            "tiempo_operativo_promedio": round(d["tiempo_operativo_h"].mean(), 2),
            "consumo_promedio": round(d["consumo_kwh_ton"].mean(), 2),
        }

    kpis_hoy = agg(hoy)
    kpis_ayer = agg(ayer)

    # Variación porcentual vs ayer
    variaciones = {}
    for key in kpis_hoy:
        if kpis_ayer[key] != 0:
            variaciones[key + "_var"] = round(
                ((kpis_hoy[key] - kpis_ayer[key]) / kpis_ayer[key]) * 100, 1
            )
        else:
            variaciones[key + "_var"] = 0.0

    return {**kpis_hoy, **variaciones}


def calcular_alertas(df):
    recientes = df[df["dia_num"] >= df["dia_num"].max() - 2]
    alertas = []

    for _, row in recientes.iterrows():
        if row["eficiencia"] < 70:
            nivel = "critico"
            msg = f"Eficiencia crítica ({row['eficiencia']}%) — Turno {row['turno']} del {row['fecha']}"
        elif row["eficiencia"] < 80:
            nivel = "advertencia"
            msg = f"Eficiencia baja ({row['eficiencia']}%) — Turno {row['turno']} del {row['fecha']}"
        elif row["consumo_kwh_ton"] > 26:
            nivel = "advertencia"
            msg = f"Consumo energético elevado ({row['consumo_kwh_ton']} kWh/ton) — {row['turno']} del {row['fecha']}"
        else:
            continue
        alertas.append({"nivel": nivel, "mensaje": msg, "turno": row["turno"], "fecha": row["fecha"]})

    return alertas


if __name__ == "__main__":
    df = generar_datos(90)

    os.makedirs("model/output", exist_ok=True)

    # Guardar CSV completo
    df.to_csv("model/output/produccion.csv", index=False)

    # Guardar JSON para la API
    payload = {
        "historico": df[["fecha", "turno", "toneladas", "eficiencia",
                          "tiempo_operativo_h", "consumo_kwh_ton", "dia_num"]].to_dict(orient="records"),
        "kpis_hoy": calcular_kpis_hoy(df),
        "alertas": calcular_alertas(df),
    }

    with open("model/output/datos.json", "w") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"✅ {len(df)} registros generados")
    print(f"📊 KPIs hoy: {payload['kpis_hoy']}")
    print(f"🚨 Alertas activas: {len(payload['alertas'])}") 