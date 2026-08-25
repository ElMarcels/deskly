"use client";

import GlassCard from "@/components/ui/GlassCard";
import { TrendingUp, Flame } from "lucide-react";

const MOCK_HOURS = [
  { day: "Lun", hours: 3.5 }, { day: "Mar", hours: 2.0 }, { day: "Mié", hours: 4.2 },
  { day: "Jue", hours: 1.5 }, { day: "Vie", hours: 3.8 }, { day: "Sáb", hours: 5.0 }, { day: "Dom", hours: 2.8 },
];

const MAX_HOURS = Math.max(...MOCK_HOURS.map(d => d.hours));
const totalHours = MOCK_HOURS.reduce((sum, d) => sum + d.hours, 0);

export default function StudyAnalytics() {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp size={16} className="text-[#06b6d4]" />
        <h2 className="text-lg font-bold gradient-neon">Estadísticas</h2>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#12122a]/50 rounded-xl p-3 border border-[rgba(168,85,247,0.1)] text-center">
          <p className="text-2xl font-bold neon-text">{totalHours.toFixed(1)}</p>
          <p className="text-[10px] text-[#e0e0ff]/50 mt-1">Horas esta semana</p>
        </div>
        <div className="bg-[#12122a]/50 rounded-xl p-3 border border-[rgba(168,85,247,0.1)] text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame size={18} className="text-orange-400" />
            <p className="text-2xl font-bold text-orange-400">5</p>
          </div>
          <p className="text-[10px] text-[#e0e0ff]/50 mt-1">Racha días</p>
        </div>
        <div className="bg-[#12122a]/50 rounded-xl p-3 border border-[rgba(168,85,247,0.1)] text-center">
          <p className="text-2xl font-bold text-[#a855f7]">8/12</p>
          <p className="text-[10px] text-[#e0e0ff]/50 mt-1">Tareas hechas</p>
        </div>
      </div>
      <p className="text-[10px] text-[#e0e0ff]/40 mb-3 uppercase tracking-wider">Horas esta semana</p>
      <div className="flex items-end gap-2 h-32">
        {MOCK_HOURS.map(day => (
          <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-[#e0e0ff]/40">{day.hours}h</span>
            <div className="w-full relative" style={{ height: `${(day.hours / MAX_HOURS) * 100}%` }}>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-[#a855f7] to-[#ec4899]" style={{ opacity: 0.8, minHeight: "8px" }} />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-[#a855f7] to-[#ec4899] animate-pulse-neon" style={{ filter: "blur(8px)", opacity: 0.3 }} />
            </div>
            <span className="text-[10px] text-[#e0e0ff]/50">{day.day}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
