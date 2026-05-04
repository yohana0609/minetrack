import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

function getData() {
  const filePath = path.join(process.cwd(), "app/api/_data/datos.json");
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turno = searchParams.get("turno");

    const data = getData();
    let historico = data.historico;

    if (turno && turno !== "todos") {
      historico = historico.filter(
        (r: { turno: string }) => r.turno === turno
      );
    }

    // Agrupar por fecha sumando/promediando turnos
    const porFecha: Record<string, { toneladas: number; eficiencia: number[]; fecha: string }> = {};
    for (const r of historico) {
      if (!porFecha[r.fecha]) {
        porFecha[r.fecha] = { toneladas: 0, eficiencia: [], fecha: r.fecha };
      }
      porFecha[r.fecha].toneladas += r.toneladas;
      porFecha[r.fecha].eficiencia.push(r.eficiencia);
    }

    const tendencia = Object.values(porFecha)
      .map((d) => ({
        fecha: d.fecha,
        toneladas: Math.round(d.toneladas),
        eficiencia: Math.round(
          (d.eficiencia.reduce((a, b) => a + b, 0) / d.eficiencia.length) * 10
        ) / 10,
        meta_toneladas: turno && turno !== "todos" ? 2400 : 7200,
        meta_eficiencia: 85,
      }))
      .slice(-30);

    return NextResponse.json({ tendencia });
  } catch {
    return NextResponse.json({ error: "Error cargando tendencia" }, { status: 500 });
  }
}