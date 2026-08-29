"use client";

import { useState } from "react";
import { useStore } from "@/lib/store/useStore";
import DashboardHeader from "./DashboardHeader";
import PomodoroWidget from "@/components/widgets/PomodoroWidget";
import SpotifyWidget from "@/components/widgets/SpotifyWidget";
import TaskList from "@/components/widgets/TaskList";
import QuickNotes from "@/components/widgets/QuickNotes";
import StudyAnalytics from "@/components/widgets/StudyAnalytics";
import GradeCalculator from "@/components/widgets/GradeCalculator";
import AmbientSounds from "@/components/widgets/AmbientSounds";
import DailyQuote from "@/components/widgets/DailyQuote";
import { GripVertical, Eye, EyeOff, Settings, X, ArrowBigUp, ArrowBigDown } from "lucide-react";
import NeonButton from "@/components/ui/NeonButton";

const WIDGETS: Record<string, { label: string; render: () => React.ReactNode }> = {
  pomodoro: { label: "Pomodoro", render: () => <PomodoroWidget /> },
  tasks: { label: "Tareas", render: () => <TaskList /> },
  notes: { label: "Notas rápidas", render: () => <QuickNotes /> },
  analytics: { label: "Análisis", render: () => <StudyAnalytics /> },
  grades: { label: "Notas académicas", render: () => <GradeCalculator /> },
  ambient: { label: "Sonidos", render: () => <AmbientSounds /> },
  quote: { label: "Cita diaria", render: () => <DailyQuote /> },
  spotify: { label: "Spotify", render: () => <SpotifyWidget /> },
};

export default function Dashboard() {
  const { zenMode } = useStore();
  const widgetLayout = useStore((s) => s.widgetLayout);
  const setWidgetLayout = useStore((s) => s.setWidgetLayout);
  const widgetVisible = useStore((s) => s.widgetVisible);
  const setWidgetVisible = useStore((s) => s.setWidgetVisible);
  const widgetSize = useStore((s) => s.widgetSize);
  const setWidgetSize = useStore((s) => s.setWidgetSize);
  const [customize, setCustomize] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const visibleLayout = widgetLayout.filter((id) => widgetVisible[id] !== false);

  const handleHeaderDrop = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!dragId || dragId === overId) { setDragId(null); return; }
    const from = widgetLayout.indexOf(dragId);
    const to = widgetLayout.indexOf(overId);
    if (from < 0 || to < 0) return;
    const next = [...widgetLayout];
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    setWidgetLayout(next);
    setDragId(null);
  };

  const move = (id: string, dir: -1 | 1) => {
    const from = widgetLayout.indexOf(id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= widgetLayout.length) return;
    const next = [...widgetLayout];
    [next[from], next[to]] = [next[to], next[from]];
    setWidgetLayout(next);
  };

  const gridSize = (id: string) => {
    const size = widgetSize[id];
    if (zenMode) return "lg:col-span-6";
    return size === "large" ? "lg:col-span-6" : id === "spotify" ? "lg:col-span-3" : "lg:col-span-4";
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <DashboardHeader />

      {zenMode ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-73px)] p-6">
          <div className="flex flex-col lg:flex-row items-center gap-8 max-w-4xl w-full">
            <div className="w-full max-w-md"><PomodoroWidget /></div>
            <div className="w-full max-w-md"><SpotifyWidget /></div>
          </div>
        </div>
      ) : (
        <main className="p-6 max-w-[1400px] mx-auto">
          <div className="flex items-center justify-end mb-4">
            <NeonButton variant={customize ? "secondary" : "ghost"} size="sm" onClick={() => setCustomize(!customize)}>
              {customize ? <><X size={14} /> Hecho</> : <><Settings size={14} /> Personalizar</>}
            </NeonButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {visibleLayout.map((id) => (
              <div key={id} className={`${gridSize(id)} ${customize ? "relative border-2 border-dashed border-[rgba(168,85,247,0.4)] rounded-2xl p-1 animate-slide-up" : ""}`}
                draggable={customize}
                onDragStart={() => setDragId(id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleHeaderDrop(e, id)}>
                {customize && (
                  <div className="absolute -top-3 -right-2 z-20 flex items-center gap-1 rounded-lg bg-[#12122a] border border-[rgba(168,85,247,0.4)] px-1.5 py-1 shadow-lg">
                    <button onClick={() => move(id, -1)} className="p-1 rounded hover:bg-[#1a1a3e] text-[#e0e0ff]/60 hover:text-[#e0e0ff] cursor-pointer"><ArrowBigUp size={13} /></button>
                    <button onClick={() => move(id, 1)} className="p-1 rounded hover:bg-[#1a1a3e] text-[#e0e0ff]/60 hover:text-[#e0e0ff] cursor-pointer"><ArrowBigDown size={13} /></button>
                    <button onClick={() => setWidgetSize(id, widgetSize[id] === "large" ? "normal" : "large")} className="p-1 rounded hover:bg-[#1a1a3e] text-[#e0e0ff]/60 hover:text-[#e0e0ff] cursor-pointer" title="Redimensionar"><GripVertical size={13} /></button>
                    <button onClick={() => setWidgetVisible(id, false)} className="p-1 rounded hover:bg-red-500/20 text-[#e0e0ff]/60 hover:text-red-400 cursor-pointer" title="Ocultar"><EyeOff size={13} /></button>
                  </div>
                )}
                {WIDGETS[id].render()}
              </div>
            ))}
          </div>

          {customize && (
            <div className="mt-6 p-4 rounded-2xl bg-[var(--surface)] border border-[rgba(168,85,247,0.3)]">
              <p className="text-xs font-bold text-[#e0e0ff]/70 mb-3">Widgets ocultos</p>
              <div className="flex flex-wrap gap-2">
                {widgetLayout.filter(id => widgetVisible[id] === false).map(id => (
                  <button key={id} onClick={() => setWidgetVisible(id, true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a3e] text-[#e0e0ff]/50 hover:text-[#e0e0ff] text-xs cursor-pointer">
                    <Eye size={12} /> {WIDGETS[id]?.label || id}
                  </button>
                ))}
                {widgetLayout.every(id => widgetVisible[id] !== false) && (
                  <p className="text-xs text-[#e0e0ff]/40">No hay widgets ocultos</p>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-purple/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-magenta/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-cyan/3 rounded-full blur-[150px]" />
      </div>
    </div>
  );
}
