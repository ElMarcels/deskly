"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Settings, Coffee, BookOpen, Moon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { useStore } from "@/lib/store/useStore";
import type { PomodoroMode } from "@/types";

const MODES: Record<PomodoroMode, { label: string; icon: typeof BookOpen; color: string }> = {
  study: { label: "Estudio", icon: BookOpen, color: "#a855f7" },
  short_break: { label: "Descanso Corto", icon: Coffee, color: "#06b6d4" },
  long_break: { label: "Descanso Largo", icon: Moon, color: "#ec4899" },
};

export default function PomodoroWidget() {
  const { pomodoroMode, setPomodoroMode, pomodoroSettings, incrementSessions, sessionsToday } =
    useStore();

  const [timeLeft, setTimeLeft] = useState(pomodoroSettings.studyDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [totalTime, setTotalTime] = useState(pomodoroSettings.studyDuration * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentMode = MODES[pomodoroMode];
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const playAlarm = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch {
      // Silently fail if audio context not available
    }
  }, []);

  const switchMode = useCallback(
    (mode: PomodoroMode) => {
      setPomodoroMode(mode);
      const duration = pomodoroSettings[mode === "study" ? "studyDuration" : mode === "short_break" ? "shortBreakDuration" : "longBreakDuration"];
      setTimeLeft(duration * 60);
      setTotalTime(duration * 60);
      setIsRunning(false);
    },
    [pomodoroMode, pomodoroSettings, setPomodoroMode]
  );

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      playAlarm();
      if (Notification.permission === "granted") {
        new Notification("Deskly Pomodoro", {
          body: pomodoroMode === "study" ? "¡Tiempo de descanso!" : "¡Hora de estudiar!",
          icon: "/favicon.ico",
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
  }, [isRunning, timeLeft, pomodoroMode, playAlarm, switchMode, incrementSessions, pomodoroSettings.sessionsBeforeLongBreak]);

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
          <span className="text-xs text-foreground/50">
            {sessionsToday} sesiones hoy
          </span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg hover:bg-surface-light transition-colors text-foreground/50 hover:text-foreground cursor-pointer"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-4 p-3 rounded-xl bg-surface/50 border border-glass-border animate-slide-up">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <label className="text-[10px] text-foreground/50 block mb-1">Estudio</label>
              <input
                type="number"
                min={1}
                max={60}
                value={pomodoroSettings.studyDuration}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 25);
                  useStore.getState().setPomodoroSettings({ studyDuration: val });
                  if (pomodoroMode === "study") {
                    setTimeLeft(val * 60);
                    setTotalTime(val * 60);
                  }
                }}
                className="w-full text-center bg-surface-light border border-glass-border rounded-lg px-2 py-1 text-sm text-foreground outline-none focus:border-neon-purple"
              />
            </div>
            <div>
              <label className="text-[10px] text-foreground/50 block mb-1">Desc. Corto</label>
              <input
                type="number"
                min={1}
                max={30}
                value={pomodoroSettings.shortBreakDuration}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 5);
                  useStore.getState().setPomodoroSettings({ shortBreakDuration: val });
                  if (pomodoroMode === "short_break") {
                    setTimeLeft(val * 60);
                    setTotalTime(val * 60);
                  }
                }}
                className="w-full text-center bg-surface-light border border-glass-border rounded-lg px-2 py-1 text-sm text-foreground outline-none focus:border-neon-purple"
              />
            </div>
            <div>
              <label className="text-[10px] text-foreground/50 block mb-1">Desc. Largo</label>
              <input
                type="number"
                min={1}
                max={60}
                value={pomodoroSettings.longBreakDuration}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 15);
                  useStore.getState().setPomodoroSettings({ longBreakDuration: val });
                  if (pomodoroMode === "long_break") {
                    setTimeLeft(val * 60);
                    setTotalTime(val * 60);
                  }
                }}
                className="w-full text-center bg-surface-light border border-glass-border rounded-lg px-2 py-1 text-sm text-foreground outline-none focus:border-neon-purple"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center mb-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(168, 85, 247, 0.1)"
              strokeWidth="6"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="url(#pomodoroGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
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
            <span className="text-3xl font-mono font-bold neon-text">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-foreground/50 mt-1">{currentMode.label}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-4">
        {(Object.keys(MODES) as PomodoroMode[]).map((mode) => {
          const ModeIcon = MODES[mode].icon;
          return (
            <button
              key={mode}
              onClick={() => switchMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                pomodoroMode === mode
                  ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                  : "text-foreground/50 hover:text-foreground hover:bg-surface-light"
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
          onClick={() => {
            setIsRunning(!isRunning);
            requestNotificationPermission();
          }}
          variant="primary"
          size="md"
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? "Pausar" : "Iniciar"}
        </NeonButton>
        <NeonButton
          onClick={() => {
            setIsRunning(false);
            switchMode(pomodoroMode);
          }}
          variant="ghost"
          size="md"
        >
          <RotateCcw size={16} />
        </NeonButton>
      </div>
    </GlassCard>
  );
}
