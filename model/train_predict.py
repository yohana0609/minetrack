import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import json
import os

def cargar_datos():
    df = pd.read_csv("model/output/produccion.csv")
    # Agregar por día (suma de los 3 turnos)
    diario = df.groupby(["fecha", "dia_num", "es_fin_semana", "es_mantenimiento"]).agg(
        toneladas_dia=("toneladas", "sum"),
        eficiencia_dia=("eficiencia", "mean"),
        consumo_dia=("consumo_kwh_ton", "mean"),
        tiempo_dia=("tiempo_operativo_h", "mean"),
    ).reset_index()
    return diario

def crear_features(df):
    df = df.copy()
    # Features de ventana temporal
    df["ton_lag1"] = df["toneladas_dia"].shift(1)
    df["ton_lag2"] = df["toneladas_dia"].shift(2)
    df["ton_lag3"] = df["toneladas_dia"].shift(3)
    df["ton_rolling7"] = df["toneladas_dia"].rolling(7).mean()
    df["efic_lag1"] = df["eficiencia_dia"].shift(1)
    df["efic_rolling7"] = df["eficiencia_dia"].rolling(7).mean()
    df["es_fin_semana"] = df["es_fin_semana"].astype(int)
    df["es_mantenimiento"] = df["es_mantenimiento"].astype(int)
    # Día de la semana numérico
    df["dia_semana_num"] = pd.to_datetime(df["fecha"]).dt.dayofweek
    return df.dropna()

def entrenar_modelo(df):
    features = [
        "ton_lag1", "ton_lag2", "ton_lag3",
        "ton_rolling7", "efic_lag1", "efic_rolling7",
        "es_fin_semana", "es_mantenimiento", "dia_semana_num"
    ]
    X = df[features]
    y = df["toneladas_dia"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc = scaler.transform(X_test)

    model = LinearRegression()
    model.fit(X_train_sc, y_train)

    y_pred = model.predict(X_test_sc)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    # Residuales para intervalo de confianza
    residuales = y_test.values - y_pred
    std_residual = np.std(residuales)

    print(f"📈 MAE: {mae:.1f} toneladas  |  R²: {r2:.3f}")
    return model, scaler, features, std_residual

def predecir_proximos_dias(df, model, scaler, features, std_residual, dias=7):
    from datetime import datetime, timedelta

    ultimo = df.iloc[-1].copy()
    historial = df.copy()
    predicciones = []

    for i in range(1, dias + 1):
        fecha_pred = (
            pd.to_datetime(ultimo["fecha"]) + timedelta(days=i)
        ).strftime("%Y-%m-%d")

        dia_semana = (pd.to_datetime(fecha_pred).dayofweek)
        es_fin = 1 if dia_semana >= 5 else 0
        # Mantenimiento cada 15 días desde el inicio
        dia_num = int(ultimo["dia_num"]) + i
        es_mant = 1 if dia_num % 15 == 0 else 0

        fila = {
            "ton_lag1": historial["toneladas_dia"].iloc[-1],
            "ton_lag2": historial["toneladas_dia"].iloc[-2],
            "ton_lag3": historial["toneladas_dia"].iloc[-3],
            "ton_rolling7": historial["toneladas_dia"].iloc[-7:].mean(),
            "efic_lag1": historial["eficiencia_dia"].iloc[-1],
            "efic_rolling7": historial["eficiencia_dia"].iloc[-7:].mean(),
            "es_fin_semana": es_fin,
            "es_mantenimiento": es_mant,
            "dia_semana_num": dia_semana,
        }

        X_pred = scaler.transform([list(fila.values())])
        pred = model.predict(X_pred)[0]

        # Intervalo de confianza 90%
        margen = 1.645 * std_residual
        predicciones.append({
            "fecha": fecha_pred,
            "prediccion": round(pred, 1),
            "limite_inferior": round(max(pred - margen, 0), 1),
            "limite_superior": round(pred + margen, 1),
            "es_fin_semana": bool(es_fin),
            "es_mantenimiento": bool(es_mant),
        })

        # Agregar la predicción al historial para el siguiente paso
        nueva_fila = pd.DataFrame([{
            "fecha": fecha_pred,
            "dia_num": dia_num,
            "toneladas_dia": pred,
            "eficiencia_dia": historial["eficiencia_dia"].iloc[-1],
            "es_fin_semana": es_fin,
            "es_mantenimiento": es_mant,
        }])
        historial = pd.concat([historial, nueva_fila], ignore_index=True)

    return predicciones

def generar_tendencia_30d(df):
    """Últimos 30 días agregados por día para la gráfica de tendencia."""
    ultimos = df.tail(30).copy()
    return [
        {
            "fecha": row["fecha"],
            "toneladas": round(row["toneladas_dia"], 1),
            "eficiencia": round(row["eficiencia_dia"], 2),
            "meta_toneladas": 7200,   # 3 turnos × 2400
            "meta_eficiencia": 85.0,
        }
        for _, row in ultimos.iterrows()
    ]

if __name__ == "__main__":
    print("🔄 Cargando datos...")
    df = cargar_datos()
    df = crear_features(df)

    print("🧠 Entrenando modelo...")
    model, scaler, features, std_residual = entrenar_modelo(df)

    print("🔮 Generando predicciones (7 días)...")
    predicciones = predecir_proximos_dias(df, model, scaler, features, std_residual)

    tendencia = generar_tendencia_30d(df)

    # Cargar datos.json existente y agregar predicciones
    with open("model/output/datos.json", "r") as f:
        payload = json.load(f)

    payload["predicciones"] = predicciones
    payload["tendencia_30d"] = tendencia

    with open("model/output/datos.json", "w") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print("✅ Predicciones guardadas en model/output/datos.json")
    for p in predicciones:
        mant = " 🔧 MANT." if p["es_mantenimiento"] else ""
        fin = " 🏖️ FDS" if p["es_fin_semana"] else ""
        print(f"  {p['fecha']}: {p['prediccion']} ton  [{p['limite_inferior']} – {p['limite_superior']}]{mant}{fin}")