import { create } from "zustand";
import type { PomodoroMode, PomodoroSettings, GradeEntry, Task } from "@/types";

interface DesklyState {
  zenMode: boolean;
  toggleZenMode: () => void;

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

  ambientSound: string | null;
  ambientVolume: number;
  setAmbientSound: (sound: string | null) => void;
  setAmbientVolume: (volume: number) => void;

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
  zenMode: loadFromStorage("deskly-zen-mode", false),
  toggleZenMode: () => {
    const next = !get().zenMode;
    saveToStorage("deskly-zen-mode", next);
    set({ zenMode: next });
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

  ambientSound: null,
  ambientVolume: 0.3,
  setAmbientSound: (sound) => set({ ambientSound: sound }),
  setAmbientVolume: (volume) => set({ ambientVolume: volume }),

  currentSubjectFilter: null,
  setCurrentSubjectFilter: (id) => set({ currentSubjectFilter: id }),
}));
