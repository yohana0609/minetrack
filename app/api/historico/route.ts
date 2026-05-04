import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "app/api/_data/datos.json");
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    return NextResponse.json({ registros: data.historico });
  } catch {
    return NextResponse.json({ registros: [] }, { status: 500 });
  }
}