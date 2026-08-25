"use client";

import { useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Settings, Coffee, BookOpen, Moon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { useStore } from "@/lib/store/useStore";
import { useState } from "react";
import type { PomodoroMode } from "@/types";

const MODES: Record<PomodoroMode, { label: string; icon: typeof BookOpen; color: string }> = {
  study: { label: "Estudio", icon: BookOpen, color: "#a855f7" },
  short_break: { label: "Descanso Corto", icon: Coffee, color: "#06b6d4" },
  long_break: { label: "Descanso Largo", icon: Moon, color: "#ec4899" },
};

export default function PomodoroWidget() {
  const {
    pomodoroMode, setPomodoroMode, pomodoroSettings, incrementSessions, sessionsToday,
    pomodoroTimeLeft, setPomodoroTimeLeft, pomodoroTotalTime, setPomodoroTotalTime,
    pomodoroRunning, setPomodoroRunning,
  } = useStore();

  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentMode = MODES[pomodoroMode];
  const progress = pomodoroTotalTime > 0 ? ((pomodoroTotalTime - pomodoroTimeLeft) / pomodoroTotalTime) * 100 : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const playAlarm = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1);
    } catch {}
  }, []);

  const switchMode = useCallback(
    (mode: PomodoroMode) => {
      setPomodoroMode(mode);
      const key = mode === "study" ? "studyDuration" : mode === "short_break" ? "shortBreakDuration" : "longBreakDuration";
      const duration = pomodoroSettings[key];
      setPomodoroTimeLeft(duration * 60);
      setPomodoroTotalTime(duration * 60);
      setPomodoroRunning(false);
    },
    [pomodoroSettings, setPomodoroMode, setPomodoroTimeLeft, setPomodoroTotalTime, setPomodoroRunning]
  );

  useEffect(() => {
    if (pomodoroRunning && pomodoroTimeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setPomodoroTimeLeft(pomodoroTimeLeft - 1);
      }, 1000);
    } else if (pomodoroTimeLeft === 0 && pomodoroRunning) {
      playAlarm();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Deskly Pomodoro", {
          body: pomodoroMode === "study" ? "¡Tiempo de descanso!" : "¡Hora de estudiar!",
        });
      }
      if (pomodoroMode === "study") {
        incrementSessions();
        const completedSessions = useStore.getState().sessionsToday;
        if (completedSessions % pomodoroSettings.sessionsBeforeLongBreak === 0) {
          switchMode("long_break");
        } else {
          switchMode("short_break");
        }
      } else {
        switchMode("study");
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pomodoroRunning, pomodoroTimeLeft, pomodoroMode, playAlarm, switchMode, incrementSessions, pomodoroSettings.sessionsBeforeLongBreak, setPomodoroTimeLeft]);

  const requestNotificationPermission = () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  return (
    <GlassCard className="p-6" glow>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold gradient-neon">Pomodoro</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#e0e0ff]/50">{sessionsToday} sesiones hoy</span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg hover:bg-[#1a1a3e] transition-colors text-[#e0e0ff]/50 hover:text-[#e0e0ff] cursor-pointer"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-4 p-3 rounded-xl bg-[#12122a]/50 border border-[rgba(168,85,247,0.2)] animate-slide-up">
          <div className="grid grid-cols-3 gap-2 text-center">
            {(["studyDuration", "shortBreakDuration", "longBreakDuration"] as const).map((key, i) => (
              <div key={key}>
                <label className="text-[10px] text-[#e0e0ff]/50 block mb-1">
                  {["Estudio", "Desc. Corto", "Desc. Largo"][i]}
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={pomodoroSettings[key]}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    useStore.getState().setPomodoroSettings({ [key]: val });
                    if (!pomodoroRunning) {
                      const modeKey = key === "studyDuration" ? "study" : key === "shortBreakDuration" ? "short_break" : "long_break";
                      if (pomodoroMode === modeKey) {
                        setPomodoroTimeLeft(val * 60);
                        setPomodoroTotalTime(val * 60);
                      }
                    }
                  }}
                  className="w-full text-center bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center mb-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(168,85,247,0.1)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54" fill="none" stroke="url(#pomodoroGradient)"
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              className="pomodoro-ring"
            />
            <defs>
              <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-mono font-bold neon-text">{formatTime(pomodoroTimeLeft)}</span>
            <span className="text-xs text-[#e0e0ff]/50 mt-1">{currentMode.label}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-4">
        {(Object.keys(MODES) as PomodoroMode[]).map((mode) => {
          const ModeIcon = MODES[mode].icon;
          return (
            <button
              key={mode}
              onClick={() => { if (!pomodoroRunning) switchMode(mode); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                pomodoroMode === mode
                  ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7] border border-[rgba(168,85,247,0.3)]"
                  : "text-[#e0e0ff]/50 hover:text-[#e0e0ff] hover:bg-[#1a1a3e]"
              }`}
            >
              <ModeIcon size={14} />
              {MODES[mode].label}
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-3">
        <NeonButton
          onClick={() => { setPomodoroRunning(!pomodoroRunning); requestNotificationPermission(); }}
          variant="primary" size="md"
        >
          {pomodoroRunning ? <Pause size={18} /> : <Play size={18} />}
          {pomodoroRunning ? "Pausar" : "Iniciar"}
        </NeonButton>
        <NeonButton
          onClick={() => { setPomodoroRunning(false); switchMode(pomodoroMode); }}
          variant="ghost" size="md"
        >
          <RotateCcw size={16} />
        </NeonButton>
      </div>
    </GlassCard>
  );
}
