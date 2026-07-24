import type { ReactNode } from "react";

export const metadata = {
  title: "Nexo Inmobiliario — Factibilidad Financiera",
  description: "Análisis de factibilidad financiera de proyectos inmobiliarios",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
