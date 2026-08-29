"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { CheckSquare, Plus, Flame, TrendingUp, Trash2, X, Bell, BellRing } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { ensurePermission, scheduleLocalNotification, cancelLocalNotification } from "@/lib/notifications";

interface Habit { id: string; name: string; icon: string; color: string; logs: Record<string, boolean>; }

const HABIT_STORAGE = "deskly-habits";

const DEFAULT_HABITS: Habit[] = [
  { id: "1", name: "Dormir 8 horas", icon: "😴", color: "#a855f7", logs: {} },
  { id: "2", name: "Ejercicio", icon: "💪", color: "#ec4899", logs: {} },
  { id: "3", name: "Leer 30 min", icon: "📖", color: "#06b6d4", logs: {} },
  { id: "4", name: "Beber 2L agua", icon: "💧", color: "#3b82f6", logs: {} },
  { id: "5", name: "Meditar", icon: "🧘", color: "#8b5cf6", logs: {} },
];

const ICONS = ["✓", "📚", "💪", "😴", "💧", "🧘", "📖", "🎯", "🏃", "🥗", "💊", "🌙", "☀️", "🧹", "💰"];

function getToday() { return new Date().toISOString().split("T")[0]; }
function getDaysArray() { return Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split("T")[0]; }); }
function formatDay(d: string) { return new Date(d).toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }); }

function getStreak(logs: Record<string, boolean>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (logs[key]) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("✓");
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const days = getDaysArray();

  useEffect(() => {
    try { setReminderOn(localStorage.getItem("deskly-habit-reminder-on") === "true"); } catch {}
    try { const t = localStorage.getItem("deskly-habit-reminder-time"); if (t) setReminderTime(t); } catch {}
  }, []);

  useEffect(() => {
    cancelLocalNotification("habit-daily");
    if (!reminderOn) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") ensurePermission();
    const [h, m] = reminderTime.split(":").map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    scheduleLocalNotification("habit-daily", "Deskly · Hábitos", `Revisa tus hábitos de hoy y marca tu progreso.`, target);
  }, [reminderOn, reminderTime]);

  useEffect(() => {
    try { const s = localStorage.getItem(HABIT_STORAGE); setHabits(s ? JSON.parse(s) : DEFAULT_HABITS); } catch { setHabits(DEFAULT_HABITS); }
  }, []);

  useEffect(() => { try { localStorage.setItem(HABIT_STORAGE, JSON.stringify(habits)); } catch {} }, [habits]);

  const toggleDay = (habitId: string, date: string) => {
    setHabits(habits.map(h => {
      if (h.id !== habitId) return h;
      const logs = { ...h.logs };
      logs[date] = !logs[date];
      return { ...h, logs };
    }));
  };

  const addHabit = () => {
    if (!newName.trim()) return;
    setHabits([...habits, { id: Date.now().toString(), name: newName, icon: newIcon, color: "#a855f7", logs: {} }]);
    setNewName(""); setShowForm(false);
  };

  const deleteHabit = (id: string) => setHabits(habits.filter(h => h.id !== id));

  const todayDone = habits.filter(h => h.logs[getToday()]).length;
  const totalStreaks = habits.reduce((sum, h) => sum + getStreak(h.logs), 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-neon">Hábitos</h1>
            <p className="text-xs text-[#e0e0ff]/40 mt-1">Rastrea tus hábitos diarios</p>
          </div>
          <NeonButton onClick={() => setShowForm(true)} variant="primary" size="sm"><Plus size={14} /> Nuevo</NeonButton>
        </div>

        <GlassCard className="p-4 flex items-center gap-3">
          {reminderOn ? <BellRing size={18} className="text-[#a855f7]" /> : <Bell size={18} className="text-[#e0e0ff]/30" />}
          <div className="flex-1">
            <p className="text-xs font-bold text-[#e0e0ff]/80">Recordatorio diario de hábitos</p>
            <p className="text-[10px] text-[#e0e0ff]/40">Se te notificará cada día a la hora elegida (mientras la app esté abierta).</p>
          </div>
          <input type="time" value={reminderTime} onChange={e => { setReminderTime(e.target.value); localStorage.setItem("deskly-habit-reminder-time", e.target.value); }}
            className="bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1.5 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7]" />
          <button onClick={() => {
            const next = !reminderOn;
            setReminderOn(next);
            localStorage.setItem("deskly-habit-reminder-on", String(next));
          }}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${reminderOn ? "bg-[#a855f7]" : "bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)]"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${reminderOn ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </GlassCard>

        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold neon-text">{todayDone}/{habits.length}</p>
            <p className="text-[10px] text-[#e0e0ff]/40 mt-1">Completados hoy</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame size={18} className="text-orange-400" />
              <p className="text-2xl font-bold text-orange-400">{totalStreaks}</p>
            </div>
            <p className="text-[10px] text-[#e0e0ff]/40 mt-1">Racha total</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-[#06b6d4]">{Math.round((todayDone / Math.max(habits.length, 1)) * 100)}%</p>
            <p className="text-[10px] text-[#e0e0ff]/40 mt-1">Progreso hoy</p>
          </GlassCard>
        </div>

        {showForm && (
          <GlassCard className="p-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="flex gap-1 flex-wrap">
                {ICONS.map(icon => (
                  <button key={icon} onClick={() => setNewIcon(icon)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm cursor-pointer transition-all ${newIcon === icon ? "bg-[rgba(168,85,247,0.2)] border border-[#a855f7] scale-110" : "bg-[#1a1a3e] border border-transparent hover:border-[rgba(168,85,247,0.2)]"}`}>
                    {icon}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Nombre del hábito" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addHabit()}
                className="flex-1 bg-transparent border-b border-[rgba(168,85,247,0.15)] pb-1 text-sm text-[#e0e0ff] outline-none placeholder:text-[#e0e0ff]/20" autoFocus />
              <NeonButton onClick={addHabit} variant="primary" size="sm">Crear</NeonButton>
              <NeonButton onClick={() => setShowForm(false)} variant="ghost" size="sm"><X size={14} /></NeonButton>
            </div>
          </GlassCard>
        )}

        <GlassCard className="p-5 overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr>
                <th className="text-left text-[10px] text-[#e0e0ff]/40 font-medium pb-3 pr-4">Hábito</th>
                <th className="text-left text-[10px] text-[#e0e0ff]/40 font-medium pb-3">Racha</th>
                {days.map(d => (
                  <th key={d} className={`text-center text-[10px] font-medium pb-3 px-1 ${d === getToday() ? "text-[#a855f7]" : "text-[#e0e0ff]/40"}`}>
                    {formatDay(d)}
                  </th>
                ))}
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {habits.map(habit => {
                const streak = getStreak(habit.logs);
                return (
                  <tr key={habit.id} className="border-t border-[rgba(168,85,247,0.05)]">
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2 text-sm text-[#e0e0ff]">
                        <span>{habit.icon}</span> {habit.name}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1 text-xs">
                        {streak > 0 && <Flame size={12} className="text-orange-400" />}
                        <span className={streak > 0 ? "text-orange-400 font-bold" : "text-[#e0e0ff]/30"}>{streak}d</span>
                      </span>
                    </td>
                    {days.map(d => {
                      const done = habit.logs[d];
                      const isToday = d === getToday();
                      return (
                        <td key={d} className="text-center py-3 px-1">
                          <button onClick={() => toggleDay(habit.id, d)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto cursor-pointer transition-all ${done ? "bg-[rgba(168,85,247,0.3)] border border-[#a855f7] text-[#a855f7] shadow-[0_0_10px_rgba(168,85,247,0.3)]" : isToday ? "bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] hover:border-[#a855f7]/50 text-[#e0e0ff]/20" : "bg-transparent border border-transparent text-[#e0e0ff]/10"}`}>
                            {done ? "✓" : ""}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-3">
                      <button onClick={() => deleteHabit(habit.id)} className="p-1 rounded hover:bg-red-500/20 text-[#e0e0ff]/20 hover:text-red-400 cursor-pointer"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
