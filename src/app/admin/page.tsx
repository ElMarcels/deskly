"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  ShieldCheck, Users, Trash2, Lock, Unlock,
  Activity, MessageSquare, Radio, Megaphone, LifeBuoy, Wrench,
  Eye, Search, Ban, ArrowLeft, RefreshCw, Clock,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { supabase } from "@/lib/supabase/client";

const ADMIN_EMAIL = "mnartves@gmail.com";

type Tab = "usuarios" | "actividad" | "mensajes" | "salas" | "anuncios" | "tickets" | "mantenimiento";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "actividad", label: "Actividad", icon: Activity },
  { id: "mensajes", label: "Mensajes", icon: MessageSquare },
  { id: "salas", label: "Salas", icon: Radio },
  { id: "anuncios", label: "Anuncios", icon: Megaphone },
  { id: "tickets", label: "Soporte", icon: LifeBuoy },
  { id: "mantenimiento", label: "Mantenimiento", icon: Wrench },
];

interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  daily_study_goal: number;
  created_at: string;
  banned?: boolean;
  last_active?: string;
  pomodoros_total?: number;
  hours_total?: number;
  streak_days?: number;
  longest_streak?: number;
  bio?: string;
  username?: string;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [tab, setTab] = useState<Tab>("usuarios");

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAdmin((data.user?.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase());
      setLoadingAuth(false);
    };
    checkAdmin();
  }, []);

  if (loadingAuth) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-20 text-[#e0e0ff]/40 text-sm">Cargando...</div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <GlassCard className="p-8 text-center">
            <ShieldCheck size={40} className="mx-auto mb-3 text-red-400/60" />
            <h1 className="text-xl font-bold text-[#e0e0ff]">Acceso denegado</h1>
            <p className="text-xs text-[#e0e0ff]/40 mt-2">No tienes permisos para acceder a este panel.</p>
          </GlassCard>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-neon flex items-center gap-2">
            <ShieldCheck size={24} /> Panel de Administración
          </h1>
          <p className="text-xs text-[#e0e0ff]/40 mt-1">Acceso exclusivo · {ADMIN_EMAIL}</p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${active ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7] border border-[rgba(168,85,247,0.4)] shadow-[0_0_15px_rgba(168,85,247,0.15)]" : "bg-[#12122a]/60 text-[#e0e0ff]/50 border border-transparent hover:bg-[#1a1a3e] hover:text-[#e0e0ff]/80"}`}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "usuarios" && <UsersTab />}
        {tab === "actividad" && <ActivityTab />}
        {tab === "mensajes" && <MessagesTab />}
        {tab === "salas" && <RoomsTab />}
        {tab === "anuncios" && <AnnouncementsTab />}
        {tab === "tickets" && <TicketsTab />}
        {tab === "mantenimiento" && <MaintenanceTab />}
      </div>
    </AppLayout>
  );
}

/* ================= USUARIOS ================= */

function UsersTab() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<AppUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, avatar_url, daily_study_goal, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setMsg("Error: " + error.message);
    } else {
      const ids = (data || []).map(u => u.id);
      let profileMap: Record<string, Partial<AppUser>> = {};
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, banned, last_active, bio, pomodoros_total, hours_total, streak_days, longest_streak")
          .in("id", ids);
        (profiles || []).forEach(p => { profileMap[p.id] = p; });
      }
      setUsers((data || []).map(u => ({ ...u, ...(profileMap[u.id] || {}) })));
      setMsg("");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleBan = async (u: AppUser) => {
    setBusyId(u.id);
    const next = !u.banned;
    const { error } = await supabase
      .from("profiles")
      .update({ banned: next })
      .eq("id", u.id);
    if (error) setMsg("Error: " + error.message);
    else {
      setUsers(users.map(x => x.id === u.id ? { ...x, banned: next } : x));
      if (detail?.id === u.id) setDetail({ ...detail, banned: next });
    }
    setBusyId(null);
  };

  const deleteUser = async (u: AppUser) => {
    if (!confirm(`¿Eliminar a ${u.email} y todos sus datos? Esta acción no se puede deshacer.`)) return;
    setBusyId(u.id);
    const tables = ["messages", "study_room_messages", "friendships", "reactions", "tickets", "habit_logs", "study_room_participants"];
    for (const t of tables) {
      try { await supabase.from(t as any).delete().eq("user_id", u.id); } catch {}
    }
    try { await supabase.from("study_sessions").delete().eq("user_id", u.id); } catch {}
    try { await supabase.from("notes").delete().eq("user_id", u.id); } catch {}
    try { await supabase.from("subtasks").delete().eq("user_id", u.id); } catch {}
    try { await supabase.from("tasks").delete().eq("user_id", u.id); } catch {}
    try { await supabase.from("subjects").delete().eq("user_id", u.id); } catch {}
    try { await supabase.from("study_rooms").delete().eq("host_id", u.id); } catch {}
    try { await supabase.from("message_group_members").delete().eq("user_id", u.id); } catch {}
    try { await supabase.from("profiles").delete().eq("id", u.id); } catch {}
    try { await supabase.from("users").delete().eq("id", u.id); } catch {}
    setUsers(users.filter(x => x.id !== u.id));
    setDetail(null);
    setMsg("Usuario eliminado. (Nota: la cuenta en auth de Supabase debe borrarse en el dashboard para que no pueda re registrarse.)");
    setBusyId(null);
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (detail) {
    return (
      <div className="space-y-6">
        <NeonButton onClick={() => setDetail(null)} variant="ghost" size="sm"><ArrowLeft size={14} /> Volver</NeonButton>
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#12122a] border border-[rgba(168,85,247,0.3)] flex items-center justify-center text-2xl text-[#a855f7] font-bold">
              {(detail.full_name || detail.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#e0e0ff]">{detail.full_name || "Sin nombre"}</h2>
              <p className="text-sm text-[#e0e0ff]/50">@{detail.username || "user"} · {detail.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {detail.banned ? (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">SUSPENDIDO</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">ACTIVO</span>
                )}
                <span className="text-[10px] text-[#e0e0ff]/40">Registrado: {new Date(detail.created_at).toLocaleDateString("es-ES")}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <NeonButton onClick={() => toggleBan(detail)} variant={detail.banned ? "secondary" : "danger"} size="sm" disabled={busyId === detail.id}>
                {detail.banned ? <><Unlock size={14} /> Reactivar</> : <><Ban size={14} /> Suspender</>}
              </NeonButton>
              <NeonButton onClick={() => deleteUser(detail)} variant="danger" size="sm" disabled={busyId === detail.id}>
                <Trash2 size={14} /> Eliminar
              </NeonButton>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Pomodoros", value: detail.pomodoros_total || 0, color: "#a855f7" },
            { label: "Horas", value: (detail.hours_total || 0).toFixed(1), color: "#06b6d4" },
            { label: "Racha", value: `${detail.streak_days || 0}d`, color: "#ec4899" },
            { label: "Mejor racha", value: `${detail.longest_streak || 0}d`, color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} className="text-center p-4 rounded-xl bg-[#12122a]/60 border border-[rgba(168,85,247,0.1)]">
              <p className="text-lg font-bold neon-text">{s.value}</p>
              <p className="text-[10px] text-[#e0e0ff]/40">{s.label}</p>
            </div>
          ))}
        </div>

        <GlassCard className="p-5">
          <h3 className="text-sm font-bold gradient-neon mb-3">Biografía</h3>
          <p className="text-sm text-[#e0e0ff]/60">{detail.bio || "Sin biografía"}</p>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-sm font-bold gradient-neon mb-3">Ruta de actividad</h3>
          <p className="text-xs text-[#e0e0ff]/40">Última conexión: {detail.last_active ? new Date(detail.last_active).toLocaleString("es-ES") : "Desconocida"}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#e0e0ff]">{users.length} usuarios</h3>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e0e0ff]/30" />
            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-56 bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
          </div>
          <NeonButton onClick={load} variant="ghost" size="sm"><RefreshCw size={14} /></NeonButton>
        </div>
      </div>

      {msg && <div className="mb-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs">{msg}</div>}

      {loading ? (
        <p className="text-center py-8 text-[#e0e0ff]/40 text-sm">Cargando usuarios...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left text-[10px] text-[#e0e0ff]/40 font-medium pb-3 pr-4">Usuario</th>
                <th className="text-left text-[10px] text-[#e0e0ff]/40 font-medium pb-3 pr-4">Email</th>
                <th className="text-left text-[10px] text-[#e0e0ff]/40 font-medium pb-3 pr-4">Estado</th>
                <th className="text-left text-[10px] text-[#e0e0ff]/40 font-medium pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-t border-[rgba(168,85,247,0.05)]">
                  <td className="py-3 pr-4">
                    <button onClick={() => setDetail(u)} className="flex items-center gap-2 cursor-pointer hover:text-[#a855f7] transition-colors text-left">
                      <div className="w-8 h-8 rounded-full bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] flex items-center justify-center text-[#a855f7] text-xs font-bold">
                        {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-[#e0e0ff]">{u.full_name || u.email?.split("@")[0] || "Sin nombre"}</span>
                    </button>
                  </td>
                  <td className="py-3 pr-4 text-xs text-[#e0e0ff]/60">{u.email}</td>
                  <td className="py-3 pr-4">
                    {u.banned ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">Suspendido</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">Activo</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1.5 items-center">
                      <button title="Ver perfil" onClick={() => setDetail(u)}
                        className="p-1.5 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/40 hover:text-[#a855f7] cursor-pointer"><Eye size={14} /></button>
                      <button title={u.banned ? "Reactivar" : "Suspender"} onClick={() => toggleBan(u)} disabled={busyId === u.id}
                        className="p-1.5 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/40 hover:text-yellow-400 cursor-pointer disabled:opacity-40">
                        {u.banned ? <Unlock size={14} /> : <Lock size={14} />}
                      </button>
                      <button title="Eliminar" onClick={() => deleteUser(u)} disabled={busyId === u.id}
                        className="p-1.5 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/40 hover:text-red-400 cursor-pointer disabled:opacity-40"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

/* ================= ACTIVIDAD ================= */

function ActivityTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: usersData, error } = await supabase
        .from("users")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        setMsg("Error: " + error.message);
        setLoading(false);
        return;
      }
      const ids = (usersData || []).map(u => u.id);
      let profileMap: Record<string, any> = {};
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, last_active, pomodoros_total, hours_total, streak_days")
          .in("id", ids);
        (profiles || []).forEach(p => { profileMap[p.id] = p; });
      }
      const withActivity = (usersData || []).map(u => ({ ...u, ...(profileMap[u.id] || {}) }));
      setUsers(withActivity);
      setLoading(false);
    })();
  }, []);

  const now = Date.now();
  const activeToday = users.filter(u => {
    const la = u.last_active ? new Date(u.last_active).getTime() : 0;
    return now - la < 24 * 3600 * 1000;
  }).length;
  const activeWeek = users.filter(u => {
    const la = u.last_active ? new Date(u.last_active).getTime() : 0;
    return now - la < 7 * 24 * 3600 * 1000;
  }).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-4 text-center">
          <Users size={20} className="mx-auto mb-1 text-[#a855f7]" />
          <p className="text-2xl font-bold neon-text">{users.length}</p>
          <p className="text-[10px] text-[#e0e0ff]/40 mt-1">Registrados</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Activity size={20} className="mx-auto mb-1 text-green-400" />
          <p className="text-2xl font-bold text-green-400">{activeToday}</p>
          <p className="text-[10px] text-[#e0e0ff]/40 mt-1">Activos hoy</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Clock size={20} className="mx-auto mb-1 text-[#06b6d4]" />
          <p className="text-2xl font-bold text-[#06b6d4]">{activeWeek}</p>
          <p className="text-[10px] text-[#e0e0ff]/40 mt-1">Activos (7 días)</p>
        </GlassCard>
      </div>

      {msg && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{msg}</div>}

      <GlassCard className="p-5">
        <h3 className="text-sm font-bold gradient-neon mb-4">Última actividad por usuario</h3>
        {loading ? (
          <p className="text-center py-6 text-[#e0e0ff]/40 text-sm">Cargando...</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-[rgba(168,85,247,0.05)] last:border-0">
                <div className="flex items-center gap-2">
                  <Activity size={14} className={u.last_active && now - new Date(u.last_active).getTime() < 7 * 86400000 ? "text-green-400" : "text-[#e0e0ff]/20"} />
                  <span className="text-sm text-[#e0e0ff]">{u.full_name || u.email}</span>
                  <span className="text-[10px] text-[#e0e0ff]/30">{u.pomodoros_total || 0} 🍅 · {(u.hours_total || 0).toFixed(1)}h</span>
                </div>
                <span className="text-[11px] text-[#e0e0ff]/40">
                  {u.last_active ? new Date(u.last_active).toLocaleString("es-ES") : "Nunca"}
                </span>
              </div>
            ))}
            {users.length === 0 && <p className="text-center text-[#e0e0ff]/30 text-sm py-4">Sin datos</p>}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

/* ================= MENSAJES ================= */

function MessagesTab() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, group_id, content, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      setMsg("Error: " + error.message + " (¿aplicaste las políticas de admin?)");
    } else {
      const ids = [...new Set((data || []).map(m => [m.sender_id, m.receiver_id]).flat().filter(Boolean))];
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: profiles } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
        (profiles || []).forEach(p => { names[p.id] = p.display_name || p.username || "Usuario"; });
      }
      setMessages((data || []).map(m => ({ ...m, senderName: names[m.sender_id] || "Desconocido" })));
      setMsg("");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) setMsg("Error: " + error.message);
    else setMessages(messages.filter(m => m.id !== id));
  };

  const filtered = messages.filter(m =>
    (m.content || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.senderName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#e0e0ff]">Mensajes ({messages.length})</h3>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e0e0ff]/30" />
            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-48 bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
          </div>
          <NeonButton onClick={load} variant="ghost" size="sm"><RefreshCw size={14} /></NeonButton>
        </div>
      </div>

      {msg && <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{msg}</div>}

      {loading ? (
        <p className="text-center py-8 text-[#e0e0ff]/40 text-sm">Cargando mensajes...</p>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map(m => (
            <div key={m.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#12122a]/40 border border-[rgba(168,85,247,0.08)]">
              <div className="min-w-0">
                <p className="text-xs text-[#e0e0ff]/50">
                  <span className="font-bold text-[#a855f7]">{m.senderName}</span>
                  <span className="text-[#e0e0ff]/30 ml-2">{m.group_id ? "Grupo" : "DM"}</span>
                  <span className="text-[#e0e0ff]/25 ml-2">{new Date(m.created_at).toLocaleString("es-ES")}</span>
                </p>
                <p className="text-sm text-[#e0e0ff] break-words mt-1">{m.content}</p>
              </div>
              <button onClick={() => remove(m.id)} title="Eliminar"
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#e0e0ff]/30 hover:text-red-400 cursor-pointer shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-[#e0e0ff]/30 text-sm py-8">No hay mensajes</p>}
        </div>
      )}
    </GlassCard>
  );
}

/* ================= SALAS ================= */

function RoomsTab() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("study_rooms")
        .select("id, name, host_id, is_public, max_participants, status, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        setMsg("Error: " + error.message + " (¿aplicaste las políticas de admin?)");
      } else {
        const ids = [...new Set((data || []).map(r => r.host_id).filter(Boolean))];
        let names: Record<string, string> = {};
        if (ids.length) {
          const { data: profiles } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
          (profiles || []).forEach(p => { names[p.id] = p.display_name || p.username || "Host"; });
        }
        setRooms((data || []).map(r => ({ ...r, hostName: names[r.host_id] || "Host" })));
        setMsg("");
      }
      setLoading(false);
    })();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta sala?")) return;
    const { error } = await supabase.from("study_rooms").delete().eq("id", id);
    if (error) setMsg("Error: " + error.message);
    else setRooms(rooms.filter(r => r.id !== id));
  };

  return (
    <GlassCard className="p-5">
      <h3 className="text-sm font-bold text-[#e0e0ff] mb-4">Salas ({rooms.length})</h3>
      {msg && <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{msg}</div>}
      {loading ? (
        <p className="text-center py-8 text-[#e0e0ff]/40 text-sm">Cargando salas...</p>
      ) : (
        <div className="space-y-2">
          {rooms.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#12122a]/40 border border-[rgba(168,85,247,0.08)]">
              <div className="min-w-0">
                <p className="text-sm text-[#e0e0ff] font-medium">{r.name}</p>
                <p className="text-[10px] text-[#e0e0ff]/40">
                  Host: {r.hostName} · {r.status} · {r.is_public ? "Pública" : "Privada"} · max {r.max_participants}
                </p>
              </div>
              <button onClick={() => remove(r.id)} title="Eliminar"
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#e0e0ff]/30 hover:text-red-400 cursor-pointer shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
          {rooms.length === 0 && <p className="text-center text-[#e0e0ff]/30 text-sm py-8">No hay salas en la base de datos</p>}
        </div>
      )}
    </GlassCard>
  );
}

/* ================= ANUNCIOS ================= */

function AnnouncementsTab() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (error) setMsg("Error: " + error.message + " (¿aplicaste el SQL de admin panel?)");
    else { setList(data || []); setMsg(""); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!title.trim()) return;
    const { error } = await supabase.from("announcements").insert({ title: title.trim(), content: content.trim(), active: true });
    if (error) setMsg("Error: " + error.message);
    else { setTitle(""); setContent(""); load(); }
  };

  const toggleActive = async (a: any) => {
    await supabase.from("announcements").update({ active: !a.active }).eq("id", a.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-5">
        <h3 className="text-sm font-bold gradient-neon mb-3">Nuevo anuncio</h3>
        <div className="space-y-3">
          <input type="text" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25" />
          <textarea placeholder="Contenido del anuncio..." rows={3} value={content} onChange={e => setContent(e.target.value)}
            className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25 resize-none" />
          <NeonButton onClick={create} variant="primary" size="sm"><Megaphone size={14} /> Publicar</NeonButton>
        </div>
      </GlassCard>

      {msg && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{msg}</div>}

      <GlassCard className="p-5">
        <h3 className="text-sm font-bold text-[#e0e0ff] mb-4">Anuncios publicados</h3>
        {loading ? (
          <p className="text-center py-6 text-[#e0e0ff]/40 text-sm">Cargando...</p>
        ) : (
          <div className="space-y-2">
            {list.map(a => (
              <div key={a.id} className="p-4 rounded-xl bg-[#12122a]/40 border border-[rgba(168,85,247,0.08)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#e0e0ff]">{a.title}</p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleActive(a)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${a.active ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-[#1a1a3e] text-[#e0e0ff]/40 hover:text-[#e0e0ff]"}`}>
                      {a.active ? "Activo" : "Inactivo"}
                    </button>
                    <button onClick={() => remove(a.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#e0e0ff]/30 hover:text-red-400 cursor-pointer"><Trash2 size={13} /></button>
                  </div>
                </div>
                <p className="text-xs text-[#e0e0ff]/60 mt-1">{a.content}</p>
                <p className="text-[10px] text-[#e0e0ff]/30 mt-2">{new Date(a.created_at).toLocaleString("es-ES")}</p>
              </div>
            ))}
            {list.length === 0 && <p className="text-center text-[#e0e0ff]/30 text-sm py-6">No hay anuncios</p>}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

/* ================= TICKETS ================= */

function TicketsTab() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const STATUS = { open: "Abierto", in_progress: "En curso", resolved: "Resuelto", closed: "Cerrado" } as any;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      if (error) {
        setMsg("Error: " + error.message + " (¿aplicaste el SQL de admin panel?)");
      } else {
        const ids = [...new Set((data || []).map(t => t.user_id))];
        let names: Record<string, string> = {};
        if (ids.length) {
          const { data: profiles } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
          (profiles || []).forEach(p => { names[p.id] = p.display_name || p.username || "Usuario"; });
        }
        setList((data || []).map(t => ({ ...t, userName: names[t.user_id] || "Usuario" })));
        setMsg("");
      }
      setLoading(false);
    })();
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tickets").update({ status }).eq("id", id);
    if (error) setMsg("Error: " + error.message);
    else setList(list.map(t => t.id === id ? { ...t, status } : t));
  };

  const nextStatus = (s: string) => {
    if (s === "open") return "in_progress";
    if (s === "in_progress") return "resolved";
    if (s === "resolved") return "closed";
    return "open";
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#e0e0ff]">Tickets de soporte ({list.length})</h3>
        <span className="text-[10px] text-[#e0e0ff]/40">{list.filter(t => t.status === "open").length} abiertos</span>
      </div>

      {msg && <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{msg}</div>}

      {loading ? (
        <p className="text-center py-8 text-[#e0e0ff]/40 text-sm">Cargando tickets...</p>
      ) : (
        <div className="space-y-2">
          {list.map(t => (
            <div key={t.id} className="p-4 rounded-xl bg-[#12122a]/40 border border-[rgba(168,85,247,0.08)]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-[#e0e0ff]">{t.subject}</p>
                <button onClick={() => setStatus(t.id, nextStatus(t.status))}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${t.status === "open" ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30" : t.status === "in_progress" ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30" : t.status === "resolved" ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-[#1a1a3e] text-[#e0e0ff]/40 hover:text-[#e0e0ff]"}`}>
                  {STATUS[t.status]}
                </button>
              </div>
              <p className="text-xs text-[#e0e0ff]/60">{t.message}</p>
              <p className="text-[10px] text-[#e0e0ff]/30 mt-2">
                {t.userName} · {new Date(t.created_at).toLocaleString("es-ES")}
              </p>
            </div>
          ))}
          {list.length === 0 && <p className="text-center text-[#e0e0ff]/30 text-sm py-8">No hay tickets</p>}
        </div>
      )}
    </GlassCard>
  );
}

/* ================= MANTENIMIENTO ================= */

function MaintenanceTab() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("app_settings").select("value").eq("key", "maintenance_mode").single();
      if (error && error.code !== "PGRST116") setMsg("Error: " + error.message + " (¿aplicaste el SQL?)");
      else setEnabled(data?.value === "true");
      setLoading(false);
    })();
  }, []);

  const toggle = async () => {
    const next = !enabled;
    const { error } = await supabase.from("app_settings").upsert({ key: "maintenance_mode", value: String(next) });
    if (error) setMsg("Error: " + error.message);
    else setEnabled(next);
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center gap-4">
          <Wrench size={28} className="text-[#a855f7]" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#e0e0ff]">Modo mantenimiento</h3>
            <p className="text-xs text-[#e0e0ff]/40 mt-1">
              Cuando está activo, los usuarios ven un aviso y no pueden usar la app mientras realizas cambios.
            </p>
          </div>
          {loading ? (
            <p className="text-[#e0e0ff]/40 text-xs">Cargando...</p>
          ) : (
            <button onClick={toggle}
              className={`relative w-14 h-8 rounded-full transition-colors cursor-pointer ${enabled ? "bg-red-500/80" : "bg-[#1a1a3e] border border-[rgba(168,85,247,0.3)]"}`}>
              <span className={`absolute top-1 w-6 h-6 rounded-full transition-all ${enabled ? "left-7 bg-white" : "left-1 bg-[#e0e0ff]/50"}`} />
            </button>
          )}
        </div>
        {enabled && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            ⚠️ El modo mantenimiento está ACTIVO. Los usuarios verán el aviso.
          </div>
        )}
      </GlassCard>

      {msg && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{msg}</div>}
    </div>
  );
}
