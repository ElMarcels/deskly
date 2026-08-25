"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Calendar, Plus, Clock, GripVertical, Trash2, Play, Pause, ChevronDown } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

interface RoutineItem { id: string; label: string; startTime: string; duration: number; color: string; }

interface Routine { id: string; name: string; active: boolean; items: RoutineItem[]; }

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const COLORS = ["#a855f7", "#ec4899", "#06b6d4", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

const STORAGE = "deskly-routines";

const DEFAULT_ROUTINES: Routine[] = [
  { id: "1", name: "Rutina de Semana", active: true, items: [
    { id: "i1", label: "Cálculo Integral", startTime: "08:00", duration: 90, color: "#a855f7" },
    { id: "i2", label: "Física Cuántica", startTime: "10:00", duration: 60, color: "#06b6d4" },
    { id: "i3", label: "Programación", startTime: "14:00", duration: 120, color: "#ec4899" },
    { id: "i4", label: "Inglés", startTime: "17:00", duration: 45, color: "#f59e0b" },
  ]},
  { id: "2", name: "Rutina de Fin de Semana", active: false, items: [
    { id: "i5", label: "Repaso General", startTime: "10:00", duration: 120, color: "#3b82f6" },
    { id: "i6", label: "Proyecto Personal", startTime: "14:00", duration: 180, color: "#10b981" },
  ]},
];

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const [newDuration, setNewDuration] = useState(60);
  const [newColor, setNewColor] = useState("#a855f7");
  const [editingRoutine, setEditingRoutine] = useState<string | null>(null);
  const [activeTimer, setActiveTimer] = useState<{ routineId: string; itemId: string; seconds: number } | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => { try { const s = localStorage.getItem(STORAGE); setRoutines(s ? JSON.parse(s) : DEFAULT_ROUTINES); } catch { setRoutines(DEFAULT_ROUTINES); } }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(routines)); } catch {} }, [routines]);

  const addItem = (routineId: string) => {
    if (!newLabel.trim()) return;
    const item: RoutineItem = { id: Date.now().toString(), label: newLabel, startTime: newTime, duration: newDuration, color: newColor };
    setRoutines(routines.map(r => r.id === routineId ? { ...r, items: [...r.items, item] } : r));
    setNewLabel(""); setShowForm(false);
  };

  const deleteItem = (routineId: string, itemId: string) => {
    setRoutines(routines.map(r => r.id === routineId ? { ...r, items: r.items.filter(i => i.id !== itemId) } : r));
  };

  const addRoutine = () => {
    if (!newName.trim()) return;
    setRoutines([...routines, { id: Date.now().toString(), name: newName, active: false, items: [] }]);
    setNewName("");
  };

  const toggleTimer = (routineId: string, itemId: string) => {
    if (activeTimer?.routineId === routineId && activeTimer?.itemId === itemId) {
      if (timerInterval) clearInterval(timerInterval);
      setActiveTimer(null);
      setTimerInterval(null);
      return;
    }
    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setActiveTimer(prev => prev ? { ...prev, seconds: prev.seconds + 1 } : null);
    }, 1000);
    setActiveTimer({ routineId, itemId, seconds: 0 });
    setTimerInterval(interval);
  };

  const formatTimer = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-neon">Rutinas de Estudio</h1>
          <div className="flex gap-2">
            <input type="text" placeholder="Nueva rutina..." value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addRoutine()}
              className="bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
            <NeonButton onClick={addRoutine} variant="primary" size="sm"><Plus size={14} /> Rutina</NeonButton>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {routines.map(r => (
            <button key={r.id} onClick={() => setEditingRoutine(editingRoutine === r.id ? null : r.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${editingRoutine === r.id ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7] border border-[rgba(168,85,247,0.3)]" : "bg-[#12122a] text-[#e0e0ff]/50 border border-[rgba(168,85,247,0.1)] hover:border-[rgba(168,85,247,0.3)]"}`}>
              {r.name}
            </button>
          ))}
        </div>

        {routines.map(routine => editingRoutine !== routine.id ? null : (
          <GlassCard key={routine.id} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#e0e0ff]">{routine.name}</h3>
              <NeonButton onClick={() => { setEditingRoutine(routine.id); setShowForm(true); }} variant="secondary" size="sm"><Plus size={12} /> Bloque</NeonButton>
            </div>

            {showForm && editingRoutine === routine.id && (
              <div className="mb-4 p-3 rounded-xl bg-[#12122a]/50 border border-[rgba(168,85,247,0.2)] animate-slide-up">
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <input type="text" placeholder="Asignatura" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1.5 text-xs text-[#e0e0ff] outline-none" />
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1.5 text-xs text-[#e0e0ff] outline-none" />
                  <div className="flex items-center gap-1">
                    <input type="number" min={15} step={15} value={newDuration} onChange={e => setNewDuration(parseInt(e.target.value) || 60)} className="w-full bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1.5 text-xs text-[#e0e0ff] outline-none" />
                    <span className="text-[10px] text-[#e0e0ff]/30">min</span>
                  </div>
                  <NeonButton onClick={() => addItem(routine.id)} variant="primary" size="sm">Agregar</NeonButton>
                </div>
                <div className="flex gap-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)} className={`w-6 h-6 rounded-full cursor-pointer transition-all ${newColor === c ? "ring-2 ring-white scale-110" : ""}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {routine.items.length === 0 ? (
                <p className="text-center text-[#e0e0ff]/20 text-xs py-6">No hay bloques. Agrega uno para empezar.</p>
              ) : routine.items.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(item => {
                const isActive = activeTimer?.routineId === routine.id && activeTimer?.itemId === item.id;
                return (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive ? "bg-[rgba(168,85,247,0.1)] border-[rgba(168,85,247,0.3)]" : "bg-[#12122a]/50 border-[rgba(168,85,247,0.1)]"}`}>
                    <div className="w-1 h-10 rounded-full" style={{ background: item.color }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#e0e0ff]">{item.label}</p>
                      <p className="text-[10px] text-[#e0e0ff]/40 flex items-center gap-1">
                        <Clock size={10} /> {item.startTime} · {item.duration} min
                      </p>
                    </div>
                    {isActive && <span className="text-sm font-mono font-bold neon-text">{formatTimer(activeTimer.seconds)}</span>}
                    <button onClick={() => toggleTimer(routine.id, item.id)}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${isActive ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7]" : "hover:bg-[#1a1a3e] text-[#e0e0ff]/30"}`}>
                      {isActive ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => deleteItem(routine.id, item.id)} className="p-1 rounded hover:bg-red-500/20 text-[#e0e0ff]/20 hover:text-red-400 cursor-pointer"><Trash2 size={12} /></button>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        ))}

        {!editingRoutine && (
          <GlassCard className="p-12 text-center">
            <Calendar size={48} className="mx-auto text-[#e0e0ff]/10 mb-4" />
            <p className="text-sm text-[#e0e0ff]/40">Selecciona una rutina para ver sus bloques</p>
            <p className="text-[10px] text-[#e0e0ff]/20 mt-1">Crea bloques de tiempo con asignaturas específicas</p>
          </GlassCard>
        )}
      </div>
    </AppLayout>
  );
}
