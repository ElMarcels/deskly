import { create } from "zustand";
import type { PomodoroMode, PomodoroSettings, GradeEntry } from "@/types";

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

  activeWidget: string | null;
  setActiveWidget: (widget: string | null) => void;

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

export const useStore = create<DesklyState>((set) => ({
  zenMode: false,
  toggleZenMode: () => set((state) => ({ zenMode: !state.zenMode })),

  pomodoroMode: "study",
  setPomodoroMode: (mode) => set({ pomodoroMode: mode }),
  pomodoroSettings: {
    studyDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
  },
  setPomodoroSettings: (settings) =>
    set((state) => ({
      pomodoroSettings: { ...state.pomodoroSettings, ...settings },
    })),
  sessionsToday: 0,
  incrementSessions: () =>
    set((state) => ({ sessionsToday: state.sessionsToday + 1 })),
  resetSessions: () => set({ sessionsToday: 0 }),

  activeWidget: null,
  setActiveWidget: (widget) => set({ activeWidget: widget }),

  grades: [],
  addGrade: (grade) =>
    set((state) => ({ grades: [...state.grades, grade] })),
  removeGrade: (id) =>
    set((state) => ({ grades: state.grades.filter((g) => g.id !== id) })),
  updateGrade: (id, updates) =>
    set((state) => ({
      grades: state.grades.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  ambientSound: null,
  ambientVolume: 0.3,
  setAmbientSound: (sound) => set({ ambientSound: sound }),
  setAmbientVolume: (volume) => set({ ambientVolume: volume }),

  currentSubjectFilter: null,
  setCurrentSubjectFilter: (id) => set({ currentSubjectFilter: id }),
}));
