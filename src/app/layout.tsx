import type { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import "./globals.css";

export const metadata = {
  title: "Nexo Inmobiliario — Factibilidad Financiera",
  description: "Análisis de factibilidad financiera de proyectos inmobiliarios",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <LogoutButton />
        {children}
      </body>
    </html>
  );
}
