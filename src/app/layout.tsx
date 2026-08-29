import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import ThemeController from "@/components/ui/ThemeController";
import PWA from "@/components/ui/PWA";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deskly — Dashboard de Estudio",
  description: "Dashboard de estudio personalizable para estudiantes. Pomodoro, tareas, notas y estadísticas con estilo cyberpunk.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Deskly", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a1a] text-[#e0e0ff] font-[family-name:var(--font-inter)]" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <ThemeController />
        <PWA />
        {children}
      </body>
    </html>
  );
}
