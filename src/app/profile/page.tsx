"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { User, Trophy, Flame, Clock, Edit3, Save, Target } from "lucide-react";
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
  { id: "night_owl", name: "Buho Nocturno", icon: "🦉" },
];

const EMOJIS = ["📚", "🎓", "🧠", "💻", "🔬", "📐", "✍️", "🎯", "⚡", "🌟", "🔥", "💪", "🦉", "🐱", "🎮", "🎨"];

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("Estudiando");
  const [statusEmoji, setStatusEmoji] = useState("📚");
  const [userEmail, setUserEmail] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [pomodorosTotal, setPomodorosTotal] = useState(0);
  const [hoursTotal, setHoursTotal] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const uid = data.user.id;
      setUserId(uid);
      setUserEmail(data.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, username, bio, status, status_emoji, pomodoros_total, hours_total, streak_days, longest_streak")
        .eq("id", uid)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "");
        setUsername(profile.username || data.user.email?.split("@")[0] || "");
        setBio(profile.bio || "");
        setStatus(profile.status || "Estudiando");
        setStatusEmoji(profile.status_emoji || "📚");
        setPomodorosTotal(profile.pomodoros_total || 0);
        setHoursTotal(profile.hours_total || 0);
        setStreakDays(profile.streak_days || 0);
        setLongestStreak(profile.longest_streak || 0);
      } else {
        const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "";
        setDisplayName(name);
        setUsername(data.user.email?.split("@")[0] || "");
        await supabase.from("profiles").upsert({
          id: uid,
          display_name: name,
          username: data.user.email?.split("@")[0] || "",
          bio: "",
          status: "Estudiando",
          status_emoji: "📚",
        });
      }
    };
    load();
  }, []);

  const saveProfile = async () => {
    if (!userId) return;
    if (!displayName.trim() || !username.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: displayName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      status: status.trim(),
      status_emoji: statusEmoji,
    });
    if (!error) {
      setEditing(false);
    }
    setSaving(false);
  };

  const weekData = [0, 0, 0, 0, 0, 0, 0];
  const maxH = Math.max(...weekData, 1);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="glass-card p-0 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#06b6d4] relative">
            <div className="absolute inset-0 opacity-30" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
          </div>
          <div className="px-6 pb-6 relative">
            <div className="flex items-end gap-4 -mt-12">
              <div className="relative">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-24 h-24 rounded-2xl bg-[#12122a] border-4 border-[#0a0a1a] flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer hover:border-[#a855f7]/50 transition-colors">
                  {statusEmoji}
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 p-3 rounded-xl bg-[#12122a] border border-[rgba(168,85,247,0.3)] shadow-xl z-10 grid grid-cols-8 gap-1 animate-slide-up">
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => { setStatusEmoji(e); setShowEmojiPicker(false); }}
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
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                      placeholder="Tu nombre" className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-1.5 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7]" />
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                      placeholder="username" className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7]" />
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
                      placeholder="Cuentanos sobre ti..." className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] resize-none" />
                    <div>
                      <label className="text-[10px] text-[#e0e0ff]/40 block mb-1">Estado</label>
                      <input type="text" value={status} onChange={e => setStatus(e.target.value)}
                        placeholder="Que estas haciendo?" className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7]" />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-[#e0e0ff]">{displayName || "Sin nombre"}</h1>
                    <p className="text-xs text-[#e0e0ff]/40">@{username || "username"} · {userEmail}</p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <NeonButton onClick={saveProfile} variant="primary" size="sm" disabled={saving || !displayName.trim() || !username.trim()}>
                      <Save size={14} /> {saving ? "Guardando..." : "Guardar"}
                    </NeonButton>
                    <NeonButton onClick={() => setEditing(false)} variant="ghost" size="sm" disabled={saving}>
                      Cancelar
                    </NeonButton>
                  </>
                ) : (
                  <NeonButton onClick={() => setEditing(true)} variant="secondary" size="sm"><Edit3 size={14} /> Editar</NeonButton>
                )}
              </div>
            </div>
            {!editing && <p className="mt-3 text-sm text-[#e0e0ff]/60">{bio || "Sin biografia"}</p>}

            <div className="grid grid-cols-4 gap-3 mt-5">
              {[
                { label: "Pomodoros", value: pomodorosTotal, icon: Target, color: "#a855f7" },
                { label: "Horas", value: hoursTotal.toFixed(1), icon: Clock, color: "#06b6d4" },
                { label: "Racha actual", value: `${streakDays}d`, icon: Flame, color: "#ec4899" },
                { label: "Mejor racha", value: `${longestStreak}d`, icon: Trophy, color: "#f59e0b" },
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
              {BADGES_LIST.map(badge => (
                <div key={badge.id} className="text-center p-3 rounded-xl border bg-[#12122a]/30 border-[rgba(168,85,247,0.05)] opacity-30">
                  <span className="text-2xl block mb-1">{badge.icon}</span>
                  <p className="text-[9px] text-[#e0e0ff]/60 leading-tight">{badge.name}</p>
                </div>
              ))}
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
