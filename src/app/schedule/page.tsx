"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Clock, Plus, Trash2, Edit3 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

interface Slot { id: string; day: number; start: string; end: string; label: string; color: string; }

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const COLORS = ["#a855f7", "#ec4899", "#06b6d4", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#f472b6"];
const STORAGE = "deskly-schedule";

const DEFAULT_SLOTS: Slot[] = [
  { id: "1", day: 0, start: "08:00", end: "09:30", label: "Cálculo", color: "#a855f7" },
  { id: "2", day: 0, start: "10:00", end: "11:00", label: "Física", color: "#06b6d4" },
  { id: "3", day: 1, start: "08:00", end: "10:00", label: "Programación", color: "#ec4899" },
  { id: "4", day: 2, start: "14:00", end: "15:00", label: "Inglés", color: "#f59e0b" },
  { id: "5", day: 3, start: "08:00", end: "09:30", label: "Cálculo", color: "#a855f7" },
  { id: "6", day: 4, start: "10:00", end: "12:00", label: "Proyecto", color: "#10b981" },
];

export default function SchedulePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formDay, setFormDay] = useState(0);
  const [formStart, setFormStart] = useState("08:00");
  const [formEnd, setFormEnd] = useState("09:00");
  const [formLabel, setFormLabel] = useState("");
  const [formColor, setFormColor] = useState("#a855f7");

  useEffect(() => { try { const s = localStorage.getItem(STORAGE); setSlots(s ? JSON.parse(s) : DEFAULT_SLOTS); } catch { setSlots(DEFAULT_SLOTS); } }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(slots)); } catch {} }, [slots]);

  const addSlot = () => {
    if (!formLabel.trim()) return;
    setSlots([...slots, { id: Date.now().toString(), day: formDay, start: formStart, end: formEnd, label: formLabel, color: formColor }]);
    setFormLabel(""); setShowForm(false);
  };

  const deleteSlot = (id: string) => setSlots(slots.filter(s => s.id !== id));

  const getSlotsForDay = (day: number) => slots.filter(s => s.day === day).sort((a, b) => a.start.localeCompare(b.start));

  const getSlotPosition = (start: string, end: string) => {
    const startH = parseInt(start.split(":")[0]) + parseInt(start.split(":")[1]) / 60;
    const endH = parseInt(end.split(":")[0]) + parseInt(end.split(":")[1]) / 60;
    const top = ((startH - 6) / 16) * 100;
    const height = ((endH - startH) / 16) * 100;
    return { top: `${top}%`, height: `${Math.max(height, 3)}%` };
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-neon">Horario Semanal</h1>
          <NeonButton onClick={() => setShowForm(true)} variant="primary" size="sm"><Plus size={14} /> Bloque</NeonButton>
        </div>

        {showForm && (
          <GlassCard className="p-4 animate-slide-up">
            <div className="flex gap-3 items-end flex-wrap">
              <div>
                <label className="text-[10px] text-[#e0e0ff]/40 block mb-1">Día</label>
                <select value={formDay} onChange={e => setFormDay(parseInt(e.target.value))} className="bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-xs text-[#e0e0ff] outline-none">
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#e0e0ff]/40 block mb-1">Inicio</label>
                <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} className="bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-xs text-[#e0e0ff] outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-[#e0e0ff]/40 block mb-1">Fin</label>
                <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-xs text-[#e0e0ff] outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-[#e0e0ff]/40 block mb-1">Asignatura</label>
                <input type="text" placeholder="Nombre" value={formLabel} onChange={e => setFormLabel(e.target.value)} className="bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-xs text-[#e0e0ff] outline-none placeholder:text-[#e0e0ff]/20" />
              </div>
              <div>
                <label className="text-[10px] text-[#e0e0ff]/40 block mb-1">Color</label>
                <div className="flex gap-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setFormColor(c)} className={`w-7 h-7 rounded-lg cursor-pointer transition-all ${formColor === c ? "ring-2 ring-white scale-110" : ""}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
              <NeonButton onClick={addSlot} variant="primary" size="sm">Agregar</NeonButton>
            </div>
          </GlassCard>
        )}

        <GlassCard className="p-4 overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-0">
              <div></div>
              {DAYS.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-[#e0e0ff]/40 py-2 border-b border-[rgba(168,85,247,0.1)]">{d}</div>
              ))}

              <div className="relative">
                {HOURS.map(h => (
                  <div key={h} className="h-16 border-b border-[rgba(168,85,247,0.05)] flex items-start pr-2">
                    <span className="text-[9px] text-[#e0e0ff]/20 -mt-2">{h}:00</span>
                  </div>
                ))}
              </div>

              {DAYS.map((_, dayIdx) => (
                <div key={dayIdx} className="relative border-l border-[rgba(168,85,247,0.05)]">
                  {HOURS.map(h => (
                    <div key={h} className="h-16 border-b border-[rgba(168,85,247,0.05)]" />
                  ))}
                  {getSlotsForDay(dayIdx).map(slot => {
                    const pos = getSlotPosition(slot.start, slot.end);
                    return (
                      <div key={slot.id} className="absolute left-1 right-1 rounded-lg px-2 py-1.5 overflow-hidden group cursor-pointer border transition-all hover:brightness-110"
                        style={{ top: pos.top, height: pos.height, background: `${slot.color}20`, borderColor: `${slot.color}40` }}>
                        <p className="text-[10px] font-bold truncate" style={{ color: slot.color }}>{slot.label}</p>
                        <p className="text-[9px] text-[#e0e0ff]/40">{slot.start}-{slot.end}</p>
                        <button onClick={() => deleteSlot(slot.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-red-400 cursor-pointer"><Trash2 size={10} /></button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
