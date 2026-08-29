import type { Accent } from "@/lib/store/useStore";

export const ACCENTS: Accent[] = [
  { name: "Violeta", color: "#a855f7" },
  { name: "Magenta", color: "#ec4899" },
  { name: "Cian", color: "#06b6d4" },
  { name: "Azul", color: "#3b82f6" },
  { name: "Verde", color: "#22c55e" },
  { name: "Naranja", color: "#f97316" },
  { name: "Rojo", color: "#ef4444" },
  { name: "Amarillo", color: "#eab308" },
];

export function accentRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}
