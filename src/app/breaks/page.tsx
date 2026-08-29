"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import GlassCard from "@/components/ui/GlassCard";
import { Timer, Wind, Coffee, Play, Pause, RotateCcw, Bell, BellOff } from "lucide-react";
import NeonButton from "@/components/ui/NeonButton";

const BREATH_PHASES = [
  { name: "Inhala", secs: 4, color: "#a855f7", scale: 1 },
  { name: "Sostén", secs: 4, color: "#06b6d4", scale: 1 },
  { name: "Exhala", secs: 6, color: "#ec4899", scale: 0.6 },
];

export default function BreaksPage() {
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderEvery, setReminderEvery] = useState(50);
  const [secondsLeft, setSecondsLeft] = useState(50 * 60);
  const [breathing, setBreathing] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseLeft, setPhaseLeft] = useState(BREATH_PHASES[0].secs);

  const notify = (title: string, body: string) => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try { new Notification(title, { body }); } catch {}
    }
  };

  useEffect(() => {
    if (!reminderOn) return;
    if (secondsLeft <= 0) {
      notify("Deskly · Descanso", "Tómate una pausa ahora. Mueve el cuerpo o respira.");
      setSecondsLeft(reminderEvery * 60);
      return;
    }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [reminderOn, secondsLeft, reminderEvery]);

  useEffect(() => {
    if (!breathing) return;
    if (phaseLeft <= 0) {
      const next = (phaseIdx + 1) % BREATH_PHASES.length;
      setPhaseIdx(next);
      setPhaseLeft(BREATH_PHASES[next].secs);
      return;
    }
    const t = setTimeout(() => setPhaseLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [breathing, phaseLeft, phaseIdx]);

  const toggleReminder = () => {
    if (!reminderOn && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setReminderOn(!reminderOn);
  };

  const phase = BREATH_PHASES[phaseIdx];
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-neon flex items-center gap-2"><Wind size={24} /> Pausas guiadas</h1>
          <p className="text-xs text-[#e0e0ff]/40 mt-1">Recordatorios de descanso y micro-pausas con respiración.</p>
        </div>

        <GlassCard className="p-6">
          <h3 className="text-sm font-bold gradient-neon mb-4 flex items-center gap-2"><Timer size={16} /> Recordatorio de descanso</h3>
          <p className="text-xs text-[#e0e0ff]/50 mb-4">Recibe una notificación cada cierto tiempo para tomar una pausa.</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#e0e0ff]/50">Cada</span>
              <input type="number" min={5} max={180} value={reminderEvery}
                onChange={e => setReminderEvery(Math.max(5, parseInt(e.target.value) || 50))}
                className="w-20 text-center bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1.5 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7]" />
              <span className="text-xs text-[#e0e0ff]/50">min</span>
            </div>
            <NeonButton onClick={toggleReminder} variant={reminderOn ? "primary" : "secondary"} size="sm">
              {reminderOn ? <BellOff size={14} /> : <Bell size={14} />}
              {reminderOn ? `Activo · ${formatTime(secondsLeft)}` : "Activar recordatorio"}
            </NeonButton>
            {reminderOn && (
              <NeonButton onClick={() => { setReminderOn(false); setSecondsLeft(reminderEvery * 60); }} variant="ghost" size="sm"><RotateCcw size={14} /></NeonButton>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6 text-center" glow>
          <h3 className="text-sm font-bold gradient-neon mb-2 flex items-center justify-center gap-2"><Coffee size={16} /> Respiración guiada</h3>
          <p className="text-xs text-[#e0e0ff]/50 mb-6">Sigue el ritmo de la esfera: inhala, sostén y exhala.</p>

          <div className="relative w-48 h-48 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-[#0a0a1a] border border-[rgba(168,85,247,0.2)] flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border border-[rgba(168,85,247,0.3)]"
                style={{
                  transform: `scale(${phase.scale})`,
                  background: `radial-gradient(circle, ${phase.color}33, transparent 70%)`,
                  boxShadow: breathing ? `0 0 40px ${phase.color}66` : "none",
                  transition: `transform ${phase.secs}s ease-in-out, background 1s, box-shadow 1s`,
                }} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-bold" style={{ color: phase.color }}>{phase.name}</span>
              <span className="text-xs text-[#e0e0ff]/50">{breathing ? phaseLeft : "—"}</span>
            </div>
          </div>

          <NeonButton onClick={() => {
            if (!breathing) { setPhaseIdx(0); setPhaseLeft(BREATH_PHASES[0].secs); }
            setBreathing(!breathing);
          }} variant="primary" size="md">
            {breathing ? <Pause size={18} /> : <Play size={18} />}
            {breathing ? "Pausar" : "Comenzar"}
          </NeonButton>
          {breathing && (
            <NeonButton onClick={() => { setBreathing(false); setPhaseIdx(0); setPhaseLeft(BREATH_PHASES[0].secs); }} variant="ghost" size="md" className="ml-2">
              <RotateCcw size={16} />
            </NeonButton>
          )}
        </GlassCard>
      </div>
    </AppLayout>
  );
}
