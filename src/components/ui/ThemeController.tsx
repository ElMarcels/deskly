"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store/useStore";
import { accentRgb } from "@/lib/theme";

export default function ThemeController() {
  const theme = useStore((s) => s.theme);
  const accent = useStore((s) => s.accent);
  const preset = useStore((s) => s.preset);

  useEffect(() => {
    const root = document.documentElement;
    const { r, g, b } = accentRgb(accent.color);
    const colors = preset[theme];

    root.dataset.theme = theme;
    root.dataset.preset = preset.id;

    root.style.setProperty("--accent", accent.color);
    root.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
    root.style.setProperty("--accent-2", accent.color);

    if (colors) {
      root.style.setProperty("--bg", colors.bg);
      root.style.setProperty("--surface", colors.surface);
      root.style.setProperty("--surface-solid", colors.surfaceSolid);
      root.style.setProperty("--surface-light", colors.surfaceLight);
      root.style.setProperty("--text", colors.text);
      root.style.setProperty("--text-dim", colors.textDim);
      root.style.setProperty("--border", colors.border);
    }
  }, [theme, accent, preset]);

  return null;
}
