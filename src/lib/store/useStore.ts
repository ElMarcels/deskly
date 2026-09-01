import { create } from "zustand";
import type { PomodoroMode, PomodoroSettings, GradeEntry, Task } from "@/types";

export type Theme = "dark" | "light";
export interface Accent {
  name: string;
  color: string;
}
export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceSolid: string;
  surfaceLight: string;
  text: string;
  textDim: string;
  border: string;
}
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  dark: ThemeColors;
  light: ThemeColors;
}

interface DesklyState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
  preset: ThemePreset;
  setPreset: (p: ThemePreset) => void;

  widgetLayout: string[];
  setWidgetLayout: (order: string[]) => void;
  widgetVisible: Record<string, boolean>;
  setWidgetVisible: (id: string, visible: boolean) => void;
  widgetSize: Record<string, "normal" | "large">;
  setWidgetSize: (id: string, size: "normal" | "large") => void;

  zenMode: boolean;
  toggleZenMode: () => void;

  musicPlaying: boolean;
  setMusicPlaying: (playing: boolean) => void;
  focusPlaylistId: string;
  setFocusPlaylistId: (id: string) => void;

  pomodoroMode: PomodoroMode;
  setPomodoroMode: (mode: PomodoroMode) => void;
  pomodoroSettings: PomodoroSettings;
  setPomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
  sessionsToday: number;
  incrementSessions: () => void;
  resetSessions: () => void;

  pomodoroTimeLeft: number;
  setPomodoroTimeLeft: (t: number) => void;
  pomodoroTotalTime: number;
  setPomodoroTotalTime: (t: number) => void;
  pomodoroRunning: boolean;
  setPomodoroRunning: (r: boolean) => void;

  grades: GradeEntry[];
  addGrade: (grade: GradeEntry) => void;
  removeGrade: (id: string) => void;
  updateGrade: (id: string, updates: Partial<GradeEntry>) => void;

  currentSubjectFilter: string | null;
  setCurrentSubjectFilter: (id: string | null) => void;
}

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export const useStore = create<DesklyState>((set, get) => ({
  theme: loadFromStorage("deskly-theme", "dark" as Theme),
  setTheme: (t) => {
    saveToStorage("deskly-theme", t);
    set({ theme: t });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    saveToStorage("deskly-theme", next);
    set({ theme: next });
  },
  accent: loadFromStorage("deskly-accent", { name: "Violeta", color: "#a855f7" } as Accent),
  setAccent: (a) => {
    saveToStorage("deskly-accent", a);
    set({ accent: a });
  },
  preset: loadFromStorage("deskly-preset", {
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
  } as ThemePreset),
  setPreset: (p) => {
    saveToStorage("deskly-preset", p);
    set({ preset: p });
  },

  widgetLayout: loadFromStorage("deskly-widget-layout", ["pomodoro", "tasks", "notes", "analytics", "grades", "quote", "spotify"]),
  setWidgetLayout: (order) => {
    saveToStorage("deskly-widget-layout", order);
    set({ widgetLayout: order });
  },
  widgetVisible: loadFromStorage("deskly-widget-visible", {
    pomodoro: true, tasks: true, notes: true, analytics: true, grades: true, quote: true, spotify: true,
  }),
  setWidgetVisible: (id, visible) => {
    const next = { ...get().widgetVisible, [id]: visible };
    saveToStorage("deskly-widget-visible", next);
    set({ widgetVisible: next });
  },
  widgetSize: loadFromStorage("deskly-widget-size", {}),
  setWidgetSize: (id, size) => {
    const next = { ...get().widgetSize, [id]: size };
    saveToStorage("deskly-widget-size", next);
    set({ widgetSize: next });
  },

  zenMode: loadFromStorage("deskly-zen-mode", false),
  toggleZenMode: () => {
    const next = !get().zenMode;
    saveToStorage("deskly-zen-mode", next);
    set({ zenMode: next });
  },

  musicPlaying: loadFromStorage("deskly-music-playing", false),
  setMusicPlaying: (playing) => {
    saveToStorage("deskly-music-playing", playing);
    set({ musicPlaying: playing });
  },
  focusPlaylistId: loadFromStorage("deskly-focus-playlist", "lofi"),
  setFocusPlaylistId: (id) => {
    saveToStorage("deskly-focus-playlist", id);
    set({ focusPlaylistId: id });
  },

  pomodoroMode: loadFromStorage("deskly-pomodoro-mode", "study" as PomodoroMode),
  setPomodoroMode: (mode) => {
    saveToStorage("deskly-pomodoro-mode", mode);
    set({ pomodoroMode: mode });
  },
  pomodoroSettings: loadFromStorage("deskly-pomodoro-settings", {
    studyDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
  } as PomodoroSettings),
  setPomodoroSettings: (settings) => {
    const current = get().pomodoroSettings;
    const next = { ...current, ...settings };
    saveToStorage("deskly-pomodoro-settings", next);
    set({ pomodoroSettings: next });
  },
  sessionsToday: loadFromStorage("deskly-sessions-" + new Date().toDateString(), 0),
  incrementSessions: () => {
    const next = get().sessionsToday + 1;
    saveToStorage("deskly-sessions-" + new Date().toDateString(), next);
    set({ sessionsToday: next });
  },
  resetSessions: () => set({ sessionsToday: 0 }),

  pomodoroTimeLeft: loadFromStorage("deskly-pomodoro-timeleft", 25 * 60),
  setPomodoroTimeLeft: (t) => {
    saveToStorage("deskly-pomodoro-timeleft", t);
    set({ pomodoroTimeLeft: t });
  },
  pomodoroTotalTime: loadFromStorage("deskly-pomodoro-total", 25 * 60),
  setPomodoroTotalTime: (t) => {
    saveToStorage("deskly-pomodoro-total", t);
    set({ pomodoroTotalTime: t });
  },
  pomodoroRunning: loadFromStorage("deskly-pomodoro-running", false),
  setPomodoroRunning: (r) => {
    saveToStorage("deskly-pomodoro-running", r);
    set({ pomodoroRunning: r });
  },

  grades: loadFromStorage("deskly-grades", []),
  addGrade: (grade) => {
    const next = [...get().grades, grade];
    saveToStorage("deskly-grades", next);
    set({ grades: next });
  },
  removeGrade: (id) => {
    const next = get().grades.filter((g) => g.id !== id);
    saveToStorage("deskly-grades", next);
    set({ grades: next });
  },
  updateGrade: (id, updates) => {
    const next = get().grades.map((g) => (g.id === id ? { ...g, ...updates } : g));
    saveToStorage("deskly-grades", next);
    set({ grades: next });
  },

  currentSubjectFilter: null,
  setCurrentSubjectFilter: (id) => set({ currentSubjectFilter: id }),
}));
