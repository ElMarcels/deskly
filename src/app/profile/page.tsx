"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { User, Trophy, Flame, Clock, Edit3, Save, Target, X, Camera } from "lucide-react";
import NeonButton from "@/components/ui/NeonButton";
import { supabase } from "@/lib/supabase/client";

const BADGES_LIST = [
  { id: "first_pomodoro", name: "Primer Pomodoro", icon: "🍅" },
  { id: "streak_7", name: "Racha de 7", icon: "🔥" },
  { id: "streak_30", name: "Racha de 30", icon: "💪" },
  { id: "pomodoros_100", name: "100 Pomodoros", icon: "🎯" },
  { id: "hours_50", name: "50 Horas", icon: "⏰" },
  { id: "tasks_50", name: "50 Tareas", icon: "✅" },
  { id: "early_bird", name: "Madrugador", icon: "🌅" },
  { id: "night_owl", name: "Búho Nocturno", icon: "🦉" },
];

const EMOJIS = ["📚", "🎓", "🧠", "💻", "🔬", "📐", "✍️", "🎯", "⚡", "🌟", "🔥", "💪", "🦉", "🐱", "🎮", "🎨"];

const STORAGE_KEY = "deskly-profile";

interface ProfileData {
  display_name: string; bio: string; username: string;
  status: string; status_emoji: string; banner_color: string;
  pomodoros_total: number; hours_total: number; streak_days: number; longest_streak: number;
}

const DEFAULT_PROFILE: ProfileData = {
  display_name: "", bio: "", username: "",
  status: "Estudiando", status_emoji: "📚", banner_color: "from-[#a855f7] via-[#ec4899] to-[#06b6d4]",
  pomodoros_total: 0, hours_total: 0, streak_days: 0, longest_streak: 0,
};

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [userEmail, setUserEmail] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [earnedBadges] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const email = data.user.email || "";
        setUserEmail(email);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setProfile({ ...DEFAULT_PROFILE, ...parsed });
        } else {
          setProfile(p => ({
            ...p,
            display_name: data.user.user_metadata?.full_name || email.split("@")[0],
            username: email.split("@")[0],
          }));
        }
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (profile.display_name) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updateField = (field: keyof ProfileData, value: string | number) => {
    setProfile(p => ({ ...p, [field]: value }));
  };

  const weekData = [0, 0, 0, 0, 0, 0, 0];
  const maxH = Math.max(...weekData, 1);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass-card p-0 overflow-hidden">
          <div className={`h-32 bg-gradient-to-r ${profile.banner_color} relative`}>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0wLTRWMjRoLTJ2MmgzeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          </div>
          <div className="px-6 pb-6 relative">
            <div className="flex items-end gap-4 -mt-12">
              <div className="relative">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-24 h-24 rounded-2xl bg-[#12122a] border-4 border-[#0a0a1a] flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer hover:border-[#a855f7]/50 transition-colors">
                  {profile.status_emoji}
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 p-3 rounded-xl bg-[#12122a] border border-[rgba(168,85,247,0.3)] shadow-xl z-10 grid grid-cols-8 gap-1 animate-slide-up">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => { updateField("status_emoji", e); setShowEmojiPicker(false); }}
                        className="w-8 h-8 rounded-lg hover:bg-[#1a1a3e] flex items-center justify-center text-lg cursor-pointer transition-colors">
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 pb-1">
                {editing ? (
                  <div className="space-y-2">
                    <input type="text" value={profile.display_name} onChange={e => updateField("display_name", e.target.value)}
                      placeholder="Tu nombre" className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-1.5 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7]" />
                    <input type="text" value={profile.username} onChange={e => updateField("username", e.target.value)}
                      placeholder="username" className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7]" />
                    <textarea value={profile.bio} onChange={e => updateField("bio", e.target.value)} rows={2}
                      placeholder="Cuéntanos sobre ti..." className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] resize-none" />
                    <div>
                      <label className="text-[10px] text-[#e0e0ff]/40 block mb-1">Estado</label>
                      <input type="text" value={profile.status} onChange={e => updateField("status", e.target.value)}
                        placeholder="¿Qué estás haciendo?" className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7]" />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-[#e0e0ff]">{profile.display_name || "Sin nombre"}</h1>
                    <p className="text-xs text-[#e0e0ff]/40">@{profile.username || "username"} · {userEmail}</p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <NeonButton onClick={() => setEditing(false)} variant="primary" size="sm"><Save size={14} /> Guardar</NeonButton>
                ) : (
                  <NeonButton onClick={() => setEditing(true)} variant="secondary" size="sm"><Edit3 size={14} /> Editar</NeonButton>
                )}
              </div>
            </div>
            {!editing && <p className="mt-3 text-sm text-[#e0e0ff]/60">{profile.bio || "Sin biografía"}</p>}

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
                  <div className="w-full rounded-lg bg-gradient-to-t from-[#a855f7] to-[#ec4899] relative" style={{ height: `${Math.max((hours / maxH) * 100, 4)}%`, minHeight: "4px" }} />
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
