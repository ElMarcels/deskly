"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store/useStore";
import { accentRgb } from "@/lib/theme";

export default function ThemeController() {
  const theme = useStore((s) => s.theme);
  const accent = useStore((s) => s.accent);

  useEffect(() => {
    const root = document.documentElement;
    const { r, g, b } = accentRgb(accent.color);
    root.dataset.theme = theme;
    root.style.setProperty("--accent", accent.color);
    root.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
    root.style.setProperty("--accent-2", accent.color);
  }, [theme, accent]);

  return null;
}
