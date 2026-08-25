"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { User, Trophy, Flame, BookOpen, Clock, Star, Edit3, Save, Award, Target, Zap, TrendingUp } from "lucide-react";

const BADGES_LIST = [
  { id: "first_pomodoro", name: "Primer Pomodoro", icon: "🍅", description: "Completó su primer pomodoro" },
  { id: "streak_7", name: "Racha de 7", icon: "🔥", description: "7 días consecutivos estudiando" },
  { id: "streak_30", name: "Racha de 30", icon: "💪", description: "30 días consecutivos estudiando" },
  { id: "pomodoros_100", name: "100 Pomodoros", icon: "🎯", description: "Completó 100 pomodoros" },
  { id: "hours_50", name: "50 Horas", icon: "⏰", description: "50 horas totales de estudio" },
  { id: "tasks_50", name: "50 Tareas", icon: "✅", description: "Completó 50 tareas" },
  { id: "early_bird", name: "Madrugador", icon: "🌅", description: "Estudió antes de las 7am" },
  { id: "night_owl", name: "Búho Nocturno", icon: "🦉", description: "Estudió después de las 11pm" },
];

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "Estudiante",
    bio: "Aprendiz eterno de código y ciencias",
    username: "estudiante",
    status: "Estudiando",
    status_emoji: "📚",
    pomodoros_total: 127,
    hours_total: 42.5,
    streak_days: 12,
    longest_streak: 21,
  });
  const [earnedBadges] = useState(["first_pomodoro", "streak_7", "pomodoros_100"]);

  const weekData = [3.2, 1.5, 4.1, 2.8, 3.5, 5.0, 2.1];
  const maxH = Math.max(...weekData);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass-card p-0 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#06b6d4] relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0wLTRWMjRoLTJ2MmgzeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          </div>
          <div className="px-6 pb-6 relative">
            <div className="flex items-end gap-4 -mt-12">
              <div className="w-24 h-24 rounded-2xl bg-[#12122a] border-4 border-[#0a0a1a] flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                {profile.status_emoji}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#e0e0ff]">{profile.display_name}</h1>
                  <button onClick={() => setEditing(!editing)} className="text-[#e0e0ff]/30 hover:text-[#a855f7] cursor-pointer">
                    <Edit3 size={14} />
                  </button>
                </div>
                <p className="text-xs text-[#e0e0ff]/40">@{profile.username}</p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.3)] text-xs text-[#a855f7]">
                {profile.status_emoji} {profile.status}
              </div>
            </div>
            <p className="mt-3 text-sm text-[#e0e0ff]/60">{profile.bio}</p>

            <div className="grid grid-cols-4 gap-3 mt-5">
              {[
                { label: "Pomodoros", value: profile.pomodoros_total, icon: Target, color: "#a855f7" },
                { label: "Horas", value: profile.hours_total.toFixed(1), icon: Clock, color: "#06b6d4" },
                { label: "Racha actual", value: `${profile.streak_days}d`, icon: Flame, color: "#ec4899" },
                { label: "Mejor racha", value: `${profile.longest_streak}d`, icon: Trophy, color: "#f59e0b" },
              ].map(stat => (
                <div key={stat.label} className="text-center p-3 rounded-xl bg-[#12122a]/60 border border-[rgba(168,85,247,0.1)]">
                  <stat.icon size={18} className="mx-auto mb-1" style={{ color: stat.color }} />
                  <p className="text-lg font-bold neon-text">{stat.value}</p>
                  <p className="text-[10px] text-[#e0e0ff]/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold gradient-neon mb-4">Badges</h3>
            <div className="grid grid-cols-4 gap-3">
              {BADGES_LIST.map(badge => {
                const earned = earnedBadges.includes(badge.id);
                return (
                  <div key={badge.id} className={`text-center p-3 rounded-xl border transition-all ${earned ? "bg-[rgba(168,85,247,0.1)] border-[rgba(168,85,247,0.3)] shadow-[0_0_15px_rgba(168,85,247,0.1)]" : "bg-[#12122a]/30 border-[rgba(168,85,247,0.05)] opacity-30"}`}>
                    <span className="text-2xl block mb-1">{badge.icon}</span>
                    <p className="text-[9px] text-[#e0e0ff]/60 leading-tight">{badge.name}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-bold gradient-neon mb-4">Historial Semanal</h3>
            <div className="flex items-end gap-2 h-32">
              {weekData.map((hours, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[#e0e0ff]/40">{hours}h</span>
                  <div className="w-full rounded-lg bg-gradient-to-t from-[#a855f7] to-[#ec4899] relative" style={{ height: `${(hours / maxH) * 100}%`, minHeight: "8px" }}>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-[#a855f7] to-[#ec4899] animate-pulse-neon" style={{ filter: "blur(8px)", opacity: 0.3 }} />
                  </div>
                  <span className="text-[10px] text-[#e0e0ff]/50">{["L", "M", "X", "J", "V", "S", "D"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
