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
      predicciones: data.predicciones,
    });
  } catch {
    return NextResponse.json(
      { error: "Error cargando predicciones" },
      { status: 500 }
    );
  }
}