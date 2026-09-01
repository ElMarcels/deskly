"use client";

import { useState } from "react";
import {
  Palette, Sun, Moon, Timer, CheckSquare, Music, LayoutDashboard,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { useStore } from "@/lib/store/useStore";
import { ACCENTS, PRESETS } from "@/lib/theme";

const FOCUS_PLAYLISTS = [
  { id: "lofi", name: "Lo-Fi Relajante", color: "#a855f7" },
  { id: "academia", name: "Dark Academia", color: "#ec4899" },
];

const WIDGET_LABELS: Record<string, string> = {
  pomodoro: "Pomodoro",
  tasks: "Tareas",
  notes: "Notas rápidas",
  analytics: "Análisis",
  grades: "Notas académicas",
  quote: "Cita diaria",
  spotify: "Spotify",
};

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-sm font-bold gradient-neon">{title}</h2>
      </div>
      {children}
    </GlassCard>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${on ? "bg-[var(--accent)]" : "bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)]"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function AjustesPage() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const accent = useStore((s) => s.accent);
  const setAccent = useStore((s) => s.setAccent);
  const preset = useStore((s) => s.preset);
  const setPreset = useStore((s) => s.setPreset);

  const zenMode = useStore((s) => s.zenMode);
  const toggleZenMode = useStore((s) => s.toggleZenMode);

  const pomodoroSettings = useStore((s) => s.pomodoroSettings);
  const setPomodoroSettings = useStore((s) => s.setPomodoroSettings);

  const widgetVisible = useStore((s) => s.widgetVisible);
  const setWidgetVisible = useStore((s) => s.setWidgetVisible);
  const widgetLayout = useStore((s) => s.widgetLayout);

  const [focusPlaylist, setFocusPlaylist] = useState<string>(() => {
    if (typeof window === "undefined") return "lofi";
    return localStorage.getItem("deskly-focus-playlist") || "lofi";
  });

  const selectPlaylist = (id: string) => {
    setFocusPlaylist(id);
    try { localStorage.setItem("deskly-focus-playlist", id); } catch {}
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-neon flex items-center gap-2"><Palette size={24} /> Ajustes</h1>
          <p className="text-xs text-[#e0e0ff]/40 mt-1">Personaliza tu experiencia en Deskly</p>
        </div>

        {/* Apariencia */}
        <SectionCard icon={<Palette size={16} className="text-[#a855f7]" />} title="Apariencia">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-[#e0e0ff]">Modo de color</p>
              <p className="text-[10px] text-[#e0e0ff]/40">Elige entre tema claro u oscuro</p>
            </div>
            <div className="flex gap-2">
              <NeonButton variant={theme === "light" ? "primary" : "secondary"} size="sm" onClick={() => setTheme("light")}><Sun size={14} /> Claro</NeonButton>
              <NeonButton variant={theme === "dark" ? "primary" : "secondary"} size="sm" onClick={() => setTheme("dark")}><Moon size={14} /> Oscuro</NeonButton>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs font-medium text-[#e0e0ff] mb-2">Presets de color</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESETS.map(p => {
                const active = preset.id === p.id;
                const colors = p[theme];
                return (
                  <button key={p.id} onClick={() => setPreset(p)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-left ${
                      active ? "border-[var(--accent)] bg-[rgba(var(--accent-rgb),0.12)]" : "border-[rgba(168,85,247,0.15)] hover:border-[rgba(168,85,247,0.4)]"
                    }`}>
                    <span className="text-xl">{p.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#e0e0ff] truncate">{p.name}</p>
                      <p className="text-[9px] text-[#e0e0ff]/40 truncate">{p.description}</p>
                    </div>
                    <span className="ml-auto flex gap-0.5 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ background: colors.bg }} />
                      <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ background: accent.color }} />
                      <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ background: colors.surfaceSolid }} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-[#e0e0ff] mb-2">Color de acento</p>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map(a => (
                <button key={a.name} onClick={() => setAccent(a)} title={a.name}
                  className={`w-9 h-9 rounded-full cursor-pointer transition-transform hover:scale-110 ${accent.name === a.name ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[#12122a]" : ""}`}
                  style={{ background: a.color }} />
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Modo Zen */}
        <SectionCard icon={<Moon size={16} className="text-[#8b5cf6]" />} title="Modo Zen">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#e0e0ff]">Modo Zen</p>
              <p className="text-[10px] text-[#e0e0ff]/40">Oculta el sidebar y muestra solo el Pomodoro en el dashboard</p>
            </div>
            <Toggle on={zenMode} onClick={toggleZenMode} />
          </div>
        </SectionCard>

        {/* Pomodoro */}
        <SectionCard icon={<Timer size={16} className="text-[#ec4899]" />} title="Pomodoro">
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "studyDuration", label: "Duración de estudio (min)" },
              { key: "shortBreakDuration", label: "Descanso corto (min)" },
              { key: "longBreakDuration", label: "Descanso largo (min)" },
              { key: "sessionsBeforeLongBreak", label: "Sesiones antes del largo" },
            ] as const).map(field => (
              <label key={field.key} className="block">
                <span className="text-[10px] text-[#e0e0ff]/50 block mb-1">{field.label}</span>
                <input
                  type="number" min={1} max={120}
                  value={pomodoroSettings[field.key]}
                  onChange={e => setPomodoroSettings({ [field.key]: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full text-center bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7]" />
              </label>
            ))}
          </div>
        </SectionCard>

        {/* Widgets del dashboard */}
        <SectionCard icon={<LayoutDashboard size={16} className="text-[#06b6d4]" />} title="Widgets del dashboard">
          <div className="space-y-2">
            {widgetLayout.map(id => (
              <div key={id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#12122a]/50 border border-[rgba(168,85,247,0.1)]">
                <div className="flex items-center gap-2">
                  <CheckSquare size={14} className="text-[#e0e0ff]/40" />
                  <span className="text-xs text-[#e0e0ff]">{WIDGET_LABELS[id] || id}</span>
                </div>
                <Toggle on={widgetVisible[id] !== false} onClick={() => setWidgetVisible(id, widgetVisible[id] !== false ? false : true)} />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#e0e0ff]/30 mt-2">Oculta o muestra los widgets que aparecen en tu dashboard.</p>
        </SectionCard>

        {/* Focus Music */}
        <SectionCard icon={<Music size={16} className="text-[#1db954]" />} title="Focus Music">
          <div className="space-y-2">
            {FOCUS_PLAYLISTS.map(p => (
              <button key={p.id} onClick={() => selectPlaylist(p.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all text-left ${
                  focusPlaylist === p.id
                    ? `border-[${p.color}]/50 bg-[${p.color}]/10`
                    : "border-[rgba(168,85,247,0.15)] hover:border-[rgba(168,85,247,0.4)]"
                }`}
                style={focusPlaylist === p.id ? { borderColor: p.color + "80", background: p.color + "22" } : undefined}>
                <span className="text-sm font-semibold" style={{ color: focusPlaylist === p.id ? p.color : "#e0e0ff" }}>{p.name}</span>
                <span className="text-[10px] text-[#e0e0ff]/40">Activa este playlist en el reproductor {focusPlaylist === p.id ? "✓" : ""}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        <p className="text-center text-[10px] text-[#e0e0ff]/25">
          Tus ajustes se guardan automáticamente en este dispositivo.
        </p>
      </div>
    </AppLayout>
  );
}
