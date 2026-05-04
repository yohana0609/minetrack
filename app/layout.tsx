import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MineTrack — Dashboard Operativo",
  description: "Análisis de producción minera en tiempo real",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}