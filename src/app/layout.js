import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CEI Mundo de los niños - Asistencia",
  description: "Registro de asistencias.",
  manifest: "/manifest.json", // <-- AÑADIMOS ESTA LÍNEA
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#8B5CF6" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}