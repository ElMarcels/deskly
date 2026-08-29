"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { User, Trophy, Flame, Clock, Edit3, Save, Target, BarChart3, Globe } from "lucide-react";
import NeonButton from "@/components/ui/NeonButton";
import { supabase } from "@/lib/supabase/client";

type RangeKey = "day" | "week" | "month";

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
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [pomodorosTotal, setPomodorosTotal] = useState(0);
  const [hoursTotal, setHoursTotal] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sessionLog, setSessionLog] = useState<{ started_at: string; duration_minutes: number }[]>([]);
  const [histRange, setHistRange] = useState<RangeKey>("week");

  useEffect(() => {
    const load = async () => {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Auth error:", authError);
        return;
      }
      if (!data.user) {
        console.error("No user session");
        return;
      }

      const uid = data.user.id;
      setUserId(uid);
      setUserEmail(data.user.email || "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, username, bio, status, status_emoji, pomodoros_total, hours_total, streak_days, longest_streak")
        .eq("id", uid)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile load error:", profileError);
        setProfileLoaded(true);
        return;
      }

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
        const { error: upsertError } = await supabase.from("profiles").upsert({
          id: uid,
          display_name: name,
          username: data.user.email?.split("@")[0] || "",
          bio: "",
          status: "Estudiando",
          status_emoji: "📚",
        });
        if (upsertError) {
          console.error("Profile auto-create error:", upsertError);
        }
      }
      setProfileLoaded(true);
    };
    load();
  }, []);

  const saveProfile = async () => {
    if (!userId) {
      setSaveError("No hay sesión de usuario activa. Cierra sesión y vuelve a entrar.");
      return;
    }
    if (!displayName.trim() || !username.trim()) {
      setSaveError("El nombre y el username no pueden estar vacíos.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: displayName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      status: status.trim(),
      status_emoji: statusEmoji,
    });
    if (error) {
      console.error("Save profile error:", error);
      setSaveError(error.message);
    } else {
      setEditing(false);
    }
    setSaving(false);
  };

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const { data } = await supabase
        .from("study_sessions")
        .select("started_at, duration_minutes")
        .gte("started_at", since.toISOString())
        .order("started_at", { ascending: true });
      if (active && data) setSessionLog(data);
    })();
    return () => { active = false; };
  }, [userId]);

  const buildHistogram = () => {
    if (histRange === "day") {
      const buckets: Record<number, number> = {};
      sessionLog.forEach(s => {
        const h = new Date(s.started_at).getHours();
        buckets[h] = (buckets[h] || 0) + (s.duration_minutes / 60);
      });
      const data = Array.from({ length: 24 }, (_, h) => ({ label: `${h}h`, value: buckets[h] || 0 }));
      const max = Math.max(...data.map(d => d.value), 0.1);
      return { labels: data.map(d => d.label), values: data.map(d => d.value), max };
    }
    if (histRange === "month") {
      const buckets: Record<number, number> = {};
      sessionLog.forEach(s => {
        const d = new Date(s.started_at); d.setDate(1);
        buckets[d.getTime()] = (buckets[d.getTime()] || 0) + (s.duration_minutes / 60);
      });
      const today = new Date();
      const data: { label: string; value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        if (!(buckets[d.getTime()] > 0) && i !== 0) { data.push({ label: d.toLocaleDateString("es-ES", { month: "short" }), value: 0 }); continue; }
        data.push({ label: d.toLocaleDateString("es-ES", { month: "short" }), value: buckets[d.getTime()] || 0 });
      }
      const max = Math.max(...data.map(d => d.value), 0.1);
      return { labels: data.map(d => d.label), values: data.map(d => d.value), max };
    }
    const buckets: Record<number, number> = {};
    sessionLog.forEach(s => {
      const d = new Date(s.started_at); d.setHours(0, 0, 0, 0);
      buckets[d.getTime()] = (buckets[d.getTime()] || 0) + (s.duration_minutes / 60);
    });
    const today = new Date();
    const data: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i); d.setHours(0, 0, 0, 0);
      data.push({ label: ["L", "M", "X", "J", "V", "S", "D"][d.getDay() === 0 ? 6 : d.getDay() - 1], value: buckets[d.getTime()] || 0 });
    }
    const max = Math.max(...data.map(d => d.value), 0.1);
    return { labels: data.map(d => d.label), values: data.map(d => d.value), max };
  };

  const hist = buildHistogram();
  const histTotal = hist.values.reduce((a, b) => a + b, 0);

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
                    <NeonButton onClick={saveProfile} variant="primary" size="sm">
                      <Save size={14} /> {saving ? "Guardando..." : "Guardar"}
                    </NeonButton>
                    <NeonButton onClick={() => setEditing(false)} variant="ghost" size="sm" disabled={saving}>
                      Cancelar
                    </NeonButton>
                  </>
                ) : (
                  <>
                    <NeonButton onClick={() => setEditing(true)} variant="secondary" size="sm"><Edit3 size={14} /> Editar</NeonButton>
                    {username && (
                      <Link href={`/user/${encodeURIComponent(username)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#e0e0ff]/60 hover:text-[#a855f7] border border-transparent hover:border-[rgba(168,85,247,0.3)] transition-all">
                        <Globe size={14} /> Perfil público
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
            {saveError && editing && (
              <p className="mt-3 text-xs text-red-400">{saveError}</p>
            )}
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold gradient-neon">Historial de Sesiones</h3>
              <div className="flex gap-1 rounded-lg bg-[#12122a]/60 border border-[rgba(168,85,247,0.15)] p-0.5">
                {(["day", "week", "month"] as RangeKey[]).map(r => (
                  <button key={r} onClick={() => setHistRange(r)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${histRange === r ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7]" : "text-[#e0e0ff]/40 hover:text-[#e0e0ff]/70"}`}>
                    {{ day: "Día", week: "Semana", month: "Mes" }[r]}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-[#e0e0ff]/40 mb-3">
              {histTotal.toFixed(1)}h en este periodo · <BarChart3 size={10} className="inline -mt-0.5 text-[#a855f7]" />
            </p>
            <div className="flex items-end gap-1.5 h-32 overflow-x-auto pb-1">
              {hist.values.map((hours, i) => (
                <div key={i} className="flex-1 min-w-[14px] flex flex-col items-center gap-1">
                  <span className="text-[9px] text-[#e0e0ff]/40">{hours > 0 ? `${hours.toFixed(1)}` : ""}</span>
                  <div className="w-full rounded-lg bg-gradient-to-t from-[#a855f7] to-[#ec4899] relative" style={{ height: `${Math.max((hours / hist.max) * 100, 4)}%`, minHeight: "4px", opacity: hours > 0 ? 1 : 0.2 }} />
                  <span className="text-[9px] text-[#e0e0ff]/50">{hist.labels[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
