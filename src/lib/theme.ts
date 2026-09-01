import type { Accent, ThemePreset } from "@/lib/store/useStore";

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

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceSolid: string;
  surfaceLight: string;
  text: string;
  textDim: string;
  border: string;
}

export const PRESETS: ThemePreset[] = [
  {
    id: "neon-dark",
    name: "Neon Dark",
    description: "Morado y rosa sobre negro espacial (por defecto)",
    icon: "🌌",
    dark: {
      bg: "#0a0a1a",
      surface: "rgba(18, 18, 42, 0.6)",
      surfaceSolid: "#12122a",
      surfaceLight: "#1a1a3e",
      text: "#e0e0ff",
      textDim: "rgba(224, 224, 255, 0.5)",
      border: "rgba(168, 85, 247, 0.2)",
    },
    light: {
      bg: "#f4f4fb",
      surface: "rgba(255, 255, 255, 0.75)",
      surfaceSolid: "#ffffff",
      surfaceLight: "#eeeeff",
      text: "#1a1a2e",
      textDim: "rgba(26, 26, 46, 0.55)",
      border: "rgba(120, 80, 220, 0.25)",
    },
  },
  {
    id: "ocean",
    name: "Océano",
    description: "Azules profundos y cian calmado",
    icon: "🌊",
    dark: {
      bg: "#071420",
      surface: "rgba(12, 34, 54, 0.6)",
      surfaceSolid: "#0b2238",
      surfaceLight: "#123456",
      text: "#d7f0ff",
      textDim: "rgba(215, 240, 255, 0.5)",
      border: "rgba(6, 182, 212, 0.25)",
    },
    light: {
      bg: "#eaf4fb",
      surface: "rgba(255, 255, 255, 0.75)",
      surfaceSolid: "#ffffff",
      surfaceLight: "#e3f1fb",
      text: "#0f2c44",
      textDim: "rgba(15, 44, 68, 0.55)",
      border: "rgba(3, 105, 161, 0.25)",
    },
  },
  {
    id: "forest",
    name: "Bosque",
    description: "Verdes naturales relajantes",
    icon: "🌲",
    dark: {
      bg: "#0a1a12",
      surface: "rgba(14, 34, 24, 0.6)",
      surfaceSolid: "#0e241a",
      surfaceLight: "#143522",
      text: "#d7ffee",
      textDim: "rgba(215, 255, 238, 0.5)",
      border: "rgba(34, 197, 94, 0.25)",
    },
    light: {
      bg: "#edf7f1",
      surface: "rgba(255, 255, 255, 0.75)",
      surfaceSolid: "#ffffff",
      surfaceLight: "#e2f3e9",
      text: "#123b24",
      textDim: "rgba(18, 59, 36, 0.55)",
      border: "rgba(22, 101, 52, 0.25)",
    },
  },
  {
    id: "sunset",
    name: "Atardecer",
    description: "Naranjas y rosados cálidos",
    icon: "🌅",
    dark: {
      bg: "#1c0f0a",
      surface: "rgba(40, 20, 12, 0.6)",
      surfaceSolid: "#2a140c",
      surfaceLight: "#3d1f14",
      text: "#ffe9de",
      textDim: "rgba(255, 233, 222, 0.5)",
      border: "rgba(249, 115, 22, 0.25)",
    },
    light: {
      bg: "#fdf6f0",
      surface: "rgba(255, 255, 255, 0.78)",
      surfaceSolid: "#ffffff",
      surfaceLight: "#faeadd",
      text: "#4a2514",
      textDim: "rgba(74, 37, 20, 0.55)",
      border: "rgba(194, 65, 12, 0.25)",
    },
  },
  {
    id: "rose",
    name: "Rosa",
    description: "Rosados suaves y románticos",
    icon: "🌷",
    dark: {
      bg: "#1a0f1a",
      surface: "rgba(38, 16, 36, 0.6)",
      surfaceSolid: "#261024",
      surfaceLight: "#3a1a36",
      text: "#ffe4f3",
      textDim: "rgba(255, 228, 243, 0.5)",
      border: "rgba(236, 72, 153, 0.25)",
    },
    light: {
      bg: "#fdf1f7",
      surface: "rgba(255, 255, 255, 0.78)",
      surfaceSolid: "#ffffff",
      surfaceLight: "#fde7f1",
      text: "#4a1230",
      textDim: "rgba(74, 18, 48, 0.55)",
      border: "rgba(190, 24, 93, 0.25)",
    },
  },
  {
    id: "mono",
    name: "Monocromo",
    description: "Blancos y negros minimalistas",
    icon: "⚪",
    dark: {
      bg: "#0d0d0d",
      surface: "rgba(26, 26, 26, 0.6)",
      surfaceSolid: "#1a1a1a",
      surfaceLight: "#2a2a2a",
      text: "#f0f0f0",
      textDim: "rgba(240, 240, 240, 0.5)",
      border: "rgba(255, 255, 255, 0.15)",
    },
    light: {
      bg: "#f5f5f5",
      surface: "rgba(255, 255, 255, 0.8)",
      surfaceSolid: "#ffffff",
      surfaceLight: "#e8e8e8",
      text: "#1a1a1a",
      textDim: "rgba(26, 26, 26, 0.55)",
      border: "rgba(0, 0, 0, 0.15)",
    },
  },
];

export function getPreset(id: string): ThemePreset {
  return PRESETS.find(p => p.id === id) || PRESETS[0];
}

export function accentRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}
