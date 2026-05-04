import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

function getData() {
  const filePath = path.join(process.cwd(), "app/api/_data/datos.json");
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

export async function GET() {
  try {
    const data = getData();
    return NextResponse.json({
      kpis: data.kpis_hoy,
      alertas: data.alertas,
    });
  } catch {
    return NextResponse.json({ error: "Error cargando KPIs" }, { status: 500 });
  }
}