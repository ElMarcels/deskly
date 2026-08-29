"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Radio, Plus, Users, Lock, Unlock, VolumeX, Play, Pause, Send, ArrowLeft, Trash2, X, Calendar, Bell, Clock as ClockIcon } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { supabase } from "@/lib/supabase/client";

interface Room {
  id: string; name: string; host: string; hostId: string; isPublic: boolean; isSilent: boolean;
  maxParticipants: number; timerDuration: number;
  status: "lobby" | "active" | "completed"; timeLeft: number;
}
interface RoomMessage { id: string; user: string; content: string; time: string; }
interface Session { id: string; title: string; day: string; start: string; end: string; reminder: number; }

const SESSIONS_STORAGE = "deskly-room-schedule";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function RoomsPage() {
  const [view, setView] = useState<"list" | "room" | "schedule">("list");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomError, setRoomError] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPublic, setNewRoomPublic] = useState(true);
  const [newRoomSilent, setNewRoomSilent] = useState(false);
  const [newRoomDuration, setNewRoomDuration] = useState(25);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDay, setSessionDay] = useState("Lunes");
  const [sessionStart, setSessionStart] = useState("18:00");
  const [sessionEnd, setSessionEnd] = useState("19:00");
  const [sessionReminder, setSessionReminder] = useState(5);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try { const s = localStorage.getItem(SESSIONS_STORAGE); if (s) setSessions(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(SESSIONS_STORAGE, JSON.stringify(sessions)); } catch {} }, [sessions]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true);
    const { data, error } = await supabase
      .from("study_rooms")
      .select("id, name, host_id, is_public, is_silent, max_participants, timer_duration, status, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setRoomError("Error: " + error.message + " (¿aplicaste las políticas y la tabla study_rooms?)");
      setRooms([]);
      setRoomsLoading(false);
      return;
    }
    const ids = Array.from(new Set((data || []).map(r => r.host_id).filter(Boolean)));
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
      (profiles || []).forEach(p => { names[p.id] = p.display_name || p.username || "Host"; });
    }
    setRooms((data || []).map(r => ({
      id: r.id, name: r.name, host: names[r.host_id] || "Host", hostId: r.host_id,
      isPublic: !!r.is_public, isSilent: !!r.is_silent,
      maxParticipants: r.max_participants, timerDuration: r.timer_duration,
      status: r.status as any, timeLeft: (r.timer_duration || 25) * 60,
    })));
    setRoomError("");
    setRoomsLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUid(data.user?.id || null);
      loadRooms();
    })();
  }, [loadRooms]);

  useEffect(() => {
    if (selectedRoom) setTimer(selectedRoom.timerDuration * 60);
  }, [selectedRoom]);

  useEffect(() => {
    if (timerRunning && timer > 0) {
      intervalRef.current = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && timerRunning) {
      setTimerRunning(false);
      if (selectedRoom) {
        setRooms(r => r.map(room => room.id === selectedRoom.id ? { ...room, status: "completed" as const } : room));
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, timer, selectedRoom]);

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    if (!uid) { setRoomError("Debes iniciar sesión para crear una sala."); return; }
    const { error } = await supabase
      .from("study_rooms")
      .insert({
        name: newRoomName.trim(), host_id: uid,
        is_public: newRoomPublic, is_silent: newRoomSilent,
        max_participants: 10, timer_duration: newRoomDuration, status: "lobby",
      });
    if (error) {
      setRoomError("Error: " + error.message);
      return;
    }
    setNewRoomName(""); setShowCreateForm(false);
    loadRooms();
  };

  const enterRoom = (room: Room) => { setSelectedRoom(room); setView("room"); setMessages([]); setTimerRunning(false); };

  const deleteRoom = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("study_rooms").delete().eq("id", id);
    if (error) setRoomError("Error: " + error.message);
    else loadRooms();
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), user: "Tú", content: newMessage, time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) }]);
    setNewMessage("");
  };

  const addSession = () => {
    if (!sessionTitle.trim()) return;
    const s: Session = { id: Date.now().toString(), title: sessionTitle.trim(), day: sessionDay, start: sessionStart, end: sessionEnd, reminder: sessionReminder };
    setSessions([...sessions, s]);
    setSessionTitle(""); setShowSessionForm(false);
  };

  const deleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    notifiedRef.current.delete(id);
  };

  useEffect(() => {
    const check = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const now = new Date();
      const today = DAYS[(now.getDay() + 6) % 7];
      const nowMin = now.getHours() * 60 + now.getMinutes();
      sessions.forEach(s => {
        if (s.day !== today) return;
        const [h, m] = s.start.split(":").map(Number);
        const startMin = h * 60 + m;
        const target = startMin - s.reminder;
        if (nowMin >= target && nowMin < startMin && !notifiedRef.current.has(s.id)) {
          notifiedRef.current.add(s.id);
          new Notification("📚 Deskly · Recordatorio", { body: `Tu sesión "${s.title}" empieza en ${s.reminder} min` });
        }
      });
    };
    const t = setInterval(check, 20000);
    check();
    return () => clearInterval(t);
  }, [sessions]);

  const askNotification = () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {view === "list" ? (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold gradient-neon">Salas de Estudio</h1>
              <div className="flex items-center gap-2">
                <NeonButton onClick={() => { setView("schedule"); askNotification(); }} variant="ghost" size="sm"><Calendar size={14} /> Horario</NeonButton>
                <NeonButton onClick={() => setShowCreateForm(true)} variant="primary" size="sm"><Plus size={14} /> Crear Sala</NeonButton>
              </div>
            </div>

            {roomError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{roomError}</div>
            )}

            {showCreateForm && (
              <GlassCard className="p-5 animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#e0e0ff]">Nueva Sala</h3>
                  <button onClick={() => setShowCreateForm(false)} className="text-[#e0e0ff]/30 hover:text-[#e0e0ff] cursor-pointer"><X size={16} /></button>
                </div>
                <div className="space-y-3">
                  <input type="text" placeholder="Nombre de la sala" value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
                    className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-[#e0e0ff]/60 cursor-pointer">
                      <input type="checkbox" checked={newRoomPublic} onChange={e => setNewRoomPublic(e.target.checked)}
                        className="accent-[#a855f7] w-4 h-4" /> Pública
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#e0e0ff]/60 cursor-pointer">
                      <input type="checkbox" checked={newRoomSilent} onChange={e => setNewRoomSilent(e.target.checked)}
                        className="accent-[#a855f7] w-4 h-4" /> Modo silencioso
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#e0e0ff]/60">Timer:</label>
                      <select value={newRoomDuration} onChange={e => setNewRoomDuration(parseInt(e.target.value))}
                        className="bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1 text-xs text-[#e0e0ff] outline-none">
                        {[15, 25, 30, 45, 60].map(d => <option key={d} value={d}>{d}min</option>)}
                      </select>
                    </div>
                  </div>
                  <NeonButton onClick={createRoom} variant="primary" size="sm">Crear Sala</NeonButton>
                </div>
              </GlassCard>
            )}

            {roomsLoading ? (
              <GlassCard className="p-12 text-center">
                <p className="text-[#e0e0ff]/40 text-sm">Cargando salas...</p>
              </GlassCard>
            ) : rooms.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <Radio size={48} className="mx-auto text-[#e0e0ff]/10 mb-4" />
                <p className="text-[#e0e0ff]/40">No hay salas de estudio</p>
                <p className="text-[10px] text-[#e0e0ff]/20 mt-1">Crea una sala para estudiar con amigos</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map(room => (
                  <GlassCard key={room.id} className="p-5 cursor-pointer hover:neon-glow transition-all" onClick={() => enterRoom(room)}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#e0e0ff]">{room.name}</h3>
                          {room.isPublic ? <Unlock size={12} className="text-[#06b6d4]" /> : <Lock size={12} className="text-yellow-400" />}
                        </div>
                        <p className="text-[10px] text-[#e0e0ff]/40">Host: {room.host}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${room.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                          {room.status === "active" ? "🟢 En vivo" : "🟡 Lobby"}
                        </span>
                        {uid === room.hostId && (
                          <button onClick={(e) => deleteRoom(room.id, e)} className="p-1 rounded hover:bg-red-500/20 text-[#e0e0ff]/20 hover:text-red-400 cursor-pointer"><Trash2 size={12} /></button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-[#e0e0ff]/40">
                      <span className="flex items-center gap-1">⏱ {room.timerDuration}min</span>
                      {room.isSilent && <span className="flex items-center gap-1"><VolumeX size={12} /> Silencioso</span>}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </>
        ) : view === "room" ? (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => { setView("list"); setTimerRunning(false); }} className="p-2 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/40 cursor-pointer"><ArrowLeft size={18} /></button>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-[#e0e0ff]">{selectedRoom?.name}</h1>
                <p className="text-[10px] text-[#e0e0ff]/40">Host: {selectedRoom?.host}</p>
              </div>
              {selectedRoom?.isSilent && <VolumeX size={16} className="text-yellow-400" />}
            </div>

            <GlassCard className="p-6 text-center">
              <p className="text-[10px] text-[#e0e0ff]/40 uppercase tracking-wider mb-2">Timer</p>
              <p className="text-5xl font-mono font-bold neon-text mb-4">{formatTime(timer)}</p>
              <div className="flex justify-center gap-3">
                <NeonButton onClick={() => setTimerRunning(!timerRunning)} variant="primary" size="md">
                  {timerRunning ? <Pause size={18} /> : <Play size={18} />}
                  {timerRunning ? "Pausar" : "Iniciar"}
                </NeonButton>
              </div>
            </GlassCard>

            {selectedRoom?.isSilent ? (
              <GlassCard className="p-8 text-center">
                <VolumeX size={36} className="mx-auto text-yellow-400/30 mb-3" />
                <p className="text-sm text-[#e0e0ff]/40">Modo silencioso — solo reacciones</p>
                <div className="flex justify-center gap-3 mt-4">
                  {["🔥", "💪", "👏", "🎯", "⚡"].map(e => (
                    <button key={e} className="text-2xl hover:scale-125 transition-transform cursor-pointer p-2 rounded-xl hover:bg-[#1a1a3e]">{e}</button>
                  ))}
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-4">
                <div className="h-64 overflow-y-auto space-y-3 mb-3">
                  {messages.length === 0 && <p className="text-center text-[#e0e0ff]/20 text-xs py-8">Envía el primer mensaje</p>}
                  {messages.map(m => (
                    <div key={m.id} className={`flex gap-2 ${m.user === "Tú" ? "justify-end" : ""}`}>
                      <div className={`max-w-xs rounded-xl px-3 py-2 ${m.user === "Tú" ? "bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)]" : "bg-[#1a1a3e] border border-[rgba(168,85,247,0.1)]"}`}>
                        <p className="text-[10px] text-[#a855f7] mb-0.5">{m.user}</p>
                        <p className="text-xs text-[#e0e0ff]">{m.content}</p>
                        <p className="text-[9px] text-[#e0e0ff]/20 mt-0.5">{m.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Escribe un mensaje..." value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    className="flex-1 bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-xl px-3 py-2 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
                  <NeonButton onClick={sendMessage} variant="primary" size="sm"><Send size={14} /></NeonButton>
                </div>
              </GlassCard>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setView("list")} className="p-2 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/40 cursor-pointer"><ArrowLeft size={18} /></button>
              <h1 className="text-xl font-bold gradient-neon flex-1">Horario de estudio</h1>
              <NeonButton onClick={() => setShowSessionForm(!showSessionForm)} variant="primary" size="sm"><Plus size={14} /> Añadir sesión</NeonButton>
            </div>

            {showSessionForm && (
              <GlassCard className="p-5 animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#e0e0ff]">Nueva sesión de estudio</h3>
                  <button onClick={() => setShowSessionForm(false)} className="text-[#e0e0ff]/30 hover:text-[#e0e0ff] cursor-pointer"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" placeholder="Título (ej. Matemáticas)" value={sessionTitle} onChange={e => setSessionTitle(e.target.value)}
                    className="md:col-span-2 w-full bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
                  <select value={sessionDay} onChange={e => setSessionDay(e.target.value)} className="bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={sessionReminder} onChange={e => setSessionReminder(parseInt(e.target.value))} className="bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none">
                    <option value={0}>Sin recordatorio</option>
                    <option value={5}>Recordar 5 min antes</option>
                    <option value={15}>Recordar 15 min antes</option>
                    <option value={30}>Recordar 30 min antes</option>
                    <option value={60}>Recordar 1 h antes</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs text-[#e0e0ff]/60">
                    <ClockIcon size={14} /> Inicio
                    <input type="time" value={sessionStart} onChange={e => setSessionStart(e.target.value)} className="bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1.5 text-sm text-[#e0e0ff] outline-none" />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#e0e0ff]/60">
                    <ClockIcon size={14} /> Fin
                    <input type="time" value={sessionEnd} onChange={e => setSessionEnd(e.target.value)} className="bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1.5 text-sm text-[#e0e0ff] outline-none" />
                  </label>
                </div>
                <NeonButton onClick={addSession} variant="primary" size="sm" disabled={!sessionTitle.trim()}>Guardar sesión</NeonButton>
              </GlassCard>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {DAYS.map(day => {
                const daySessions = sessions.filter(s => s.day === day).sort((a, b) => a.start.localeCompare(b.start));
                const isToday = DAYS[(new Date().getDay() + 6) % 7] === day;
                return (
                  <GlassCard key={day} className={`p-4 ${isToday ? "border-[rgba(168,85,247,0.6)]" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-[#e0e0ff]">{day}</h3>
                      {isToday && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[rgba(168,85,247,0.25)] text-[#a855f7]">HOY</span>}
                    </div>
                    <div className="space-y-2">
                      {daySessions.map(s => (
                        <div key={s.id} className="p-2.5 rounded-lg bg-[#12122a]/50 border border-[rgba(168,85,247,0.15)] group relative">
                          <p className="text-xs font-medium text-[#e0e0ff]">{s.title}</p>
                          <p className="text-[10px] text-[#e0e0ff]/40 mt-0.5 flex items-center gap-1">
                            <ClockIcon size={10} /> {s.start} – {s.end}
                          </p>
                          {s.reminder > 0 && (
                            <p className="text-[9px] text-[#06b6d4]/60 mt-0.5 flex items-center gap-1">
                              <Bell size={9} /> Alerta {s.reminder} min antes
                            </p>
                          )}
                          <button onClick={() => deleteSession(s.id)} className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-[#e0e0ff]/30 hover:text-red-400 cursor-pointer transition-all"><Trash2 size={12} /></button>
                        </div>
                      ))}
                      {daySessions.length === 0 && <p className="text-[10px] text-[#e0e0ff]/20 text-center py-3">Sin sesiones</p>}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
            <p className="text-[10px] text-[#e0e0ff]/25 text-center">
              {sessions.length} sesión{sessions.length === 1 ? "" : "es"} programada{sessions.length === 1 ? "" : "s"} · Autoriza las notificaciones para recordatorios
            </p>
          </>
        )}
      </div>
    </AppLayout>
  );
}
