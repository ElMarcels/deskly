"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import GlassCard from "@/components/ui/GlassCard";
import { Target, Clock, Flame, Trophy, ArrowLeft, Award, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface PubProfile {
  username: string;
  display_name: string;
  bio: string;
  status: string;
  status_emoji: string;
  pomodoros_total: number;
  hours_total: number;
  streak_days: number;
  longest_streak: number;
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PubProfile | null>(null);
  const [badges, setBadges] = useState<{ badge_name: string; badge_icon: string; badge_description: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [projectedHours, setProjectedHours] = useState(0);

  const username = Array.isArray(params.username) ? params.username[0] : params.username;

  useEffect(() => {
    if (!username) return;
    (async () => {
      setLoading(true);
      const { data: row, error } = await supabase
        .from("profiles")
        .select("username, display_name, bio, status, status_emoji, pomodoros_total, hours_total, streak_days, longest_streak, created_at, banned, suspension_until")
        .eq("username", username)
        .maybeSingle();

      if (error || !row) { setNotFound(true); setLoading(false); return; }

      const expired = row.suspension_until && new Date(row.suspension_until).getTime() < Date.now();
      if (row.banned && !expired) { setNotFound(true); setLoading(false); return; }

      const uidReq = await supabase.from("profiles").select("id").eq("username", username).single();
      setProfile({
        username: row.username,
        display_name: row.display_name || row.username,
        bio: row.bio || "",
        status: row.status || "",
        status_emoji: row.status_emoji || "📚",
        pomodoros_total: row.pomodoros_total || 0,
        hours_total: row.hours_total || 0,
        streak_days: row.streak_days || 0,
        longest_streak: row.longest_streak || 0,
        created_at: row.created_at,
      });

      if (uidReq.error) { setLoading(false); return; }
      const { data: b } = await supabase
        .from("badges")
        .select("badge_name, badge_icon, badge_description")
        .order("earned_at", { ascending: false });
      setBadges(b || []);

      const { data: agg } = await supabase
        .from("study_sessions")
        .select("duration_minutes")
        .eq("user_id", (uidReq.data as { id: string }).id);
      setProjectedHours(agg ? agg.reduce((s, r) => s + (r.duration_minutes || 0), 0) / 60 : row.hours_total || (row.pomodoros_total || 0) * 25 / 60);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <p className="text-sm text-[#e0e0ff]/40">Cargando perfil...</p>
        </div>
      </AppLayout>
    );
  }

  if (notFound || !profile) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto pt-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold gradient-neon mb-2">Usuario no encontrado</h1>
          <p className="text-sm text-[#e0e0ff]/50 mb-6">El perfil no existe o no está disponible.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#a855f7] hover:underline"><ArrowLeft size={14} /> Volver al dashboard</Link>
        </div>
      </AppLayout>
    );
  }

  const stats = [
    { label: "Pomodoros", value: profile.pomodoros_total, icon: Target, color: "#a855f7" },
    { label: "Horas", value: (profile.hours_total || projectedHours).toFixed(1), icon: Clock, color: "#06b6d4" },
    { label: "Racha actual", value: `${profile.streak_days}d`, icon: Flame, color: "#ec4899" },
    { label: "Mejor racha", value: `${profile.longest_streak}d`, icon: Trophy, color: "#f59e0b" },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-[#e0e0ff]/50 hover:text-[#a855f7] transition-colors"><ArrowLeft size={14} /> Volver</Link>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#e0e0ff]/40 uppercase tracking-wider"><Sparkles size={12} className="text-[#a855f7]" /> Perfil público</span>
        </div>

        <GlassCard className="p-0 overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#06b6d4]" />
          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-[#12122a] border-4 border-[#0a0a1a] flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                {profile.status_emoji}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-[#e0e0ff]">{profile.display_name}</h1>
                <p className="text-xs text-[#e0e0ff]/40">@{profile.username}</p>
              </div>
            </div>
            {profile.status && <p className="mt-3 text-xs text-[#a855f7]/80">{profile.status}</p>}
            <p className="mt-1 text-sm text-[#e0e0ff]/60">{profile.bio || "Sin biografía"}</p>

            <div className="grid grid-cols-4 gap-3 mt-5">
              {stats.map(stat => (
                <div key={stat.label} className="text-center p-3 rounded-xl bg-[#12122a]/60 border border-[rgba(168,85,247,0.1)]">
                  <stat.icon size={18} className="mx-auto mb-1" style={{ color: stat.color }} />
                  <p className="text-lg font-bold neon-text">{stat.value}</p>
                  <p className="text-[10px] text-[#e0e0ff]/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} className="text-[#f59e0b]" />
            <h3 className="text-sm font-bold gradient-neon">Logros</h3>
          </div>
          {badges.length === 0 ? (
            <p className="text-xs text-[#e0e0ff]/40">Aún no tiene logros.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map(b => (
                <div key={b.badge_name} className="text-center p-3 rounded-xl border bg-[#12122a]/30 border-[rgba(168,85,247,0.1)]">
                  <span className="text-2xl block mb-1">{b.badge_icon}</span>
                  <p className="text-[10px] text-[#e0e0ff]/70 font-medium leading-tight">{b.badge_name}</p>
                  {b.badge_description && <p className="text-[9px] text-[#e0e0ff]/40 mt-1 leading-tight">{b.badge_description}</p>}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </AppLayout>
  );
}
