"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Radio, Plus, Users, Lock, Unlock, Volume2, VolumeX, Play, Pause, Send, ArrowLeft } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

interface Room {
  id: string; name: string; host: string; isPublic: boolean; isSilent: boolean;
  participants: number; maxParticipants: number; timerDuration: number;
  status: "lobby" | "active" | "completed"; timeLeft: number;
}

interface RoomMessage { id: string; user: string; content: string; time: string; }

const MOCK_ROOMS: Room[] = [
  { id: "1", name: "Sesión de Cálculo III", host: "María", isPublic: true, isSilent: false, participants: 4, maxParticipants: 8, timerDuration: 25, status: "active", timeLeft: 847 },
  { id: "2", name: "Estudio Física Cuántica", host: "Carlos", isPublic: true, isSilent: true, participants: 6, maxParticipants: 10, timerDuration: 45, status: "active", timeLeft: 1523 },
  { id: "3", name: "Taller de Programación", host: "Ana", isPublic: false, isSilent: false, participants: 2, maxParticipants: 5, timerDuration: 30, status: "lobby", timeLeft: 0 },
];

const MOCK_MESSAGES: RoomMessage[] = [
  { id: "1", user: "María", content: "¡Hola a todos! Vamos con fuerza 💪", time: "14:23" },
  { id: "2", user: "Pedro", content: "Listo para esta sesión", time: "14:24" },
  { id: "3", user: "Ana", content: "¿De qué tema empezamos?", time: "14:25" },
];

export default function RoomsPage() {
  const [view, setView] = useState<"list" | "room">("list");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  useEffect(() => {
    if (selectedRoom) setTimer(selectedRoom.timeLeft);
  }, [selectedRoom]);

  useEffect(() => {
    if (timerRunning && timer > 0) {
      intervalRef.current = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, timer]);

  const enterRoom = (room: Room) => {
    setSelectedRoom(room);
    setView("room");
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), user: "Tú", content: newMessage, time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) }]);
    setNewMessage("");
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {view === "list" ? (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold gradient-neon">Salas de Estudio</h1>
              <NeonButton variant="primary" size="sm"><Plus size={14} /> Crear Sala</NeonButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_ROOMS.map(room => (
                <GlassCard key={room.id} className="p-5 cursor-pointer hover:neon-glow transition-all" onClick={() => enterRoom(room)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#e0e0ff]">{room.name}</h3>
                        {room.isPublic ? <Unlock size={12} className="text-[#06b6d4]" /> : <Lock size={12} className="text-yellow-400" />}
                      </div>
                      <p className="text-[10px] text-[#e0e0ff]/40">Host: {room.host}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${room.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {room.status === "active" ? "🟢 En vivo" : "🟡 Lobby"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-[#e0e0ff]/40">
                    <span className="flex items-center gap-1"><Users size={12} /> {room.participants}/{room.maxParticipants}</span>
                    <span className="flex items-center gap-1">⏱ {room.timerDuration}min</span>
                    {room.isSilent && <span className="flex items-center gap-1"><VolumeX size={12} /> Silencioso</span>}
                    {room.status === "active" && <span className="text-[#a855f7] font-mono font-bold">{formatTime(room.timeLeft)}</span>}
                  </div>
                </GlassCard>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => setView("list")} className="p-2 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/40 cursor-pointer"><ArrowLeft size={18} /></button>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-[#e0e0ff]">{selectedRoom?.name}</h1>
                <p className="text-[10px] text-[#e0e0ff]/40">Host: {selectedRoom?.host} · {selectedRoom?.participants}/{selectedRoom?.maxParticipants} participantes</p>
              </div>
              {selectedRoom?.isSilent && <VolumeX size={16} className="text-yellow-400" />}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-4">
                <GlassCard className="p-6 text-center">
                  <p className="text-[10px] text-[#e0e0ff]/40 uppercase tracking-wider mb-2">Timer Compartido</p>
                  <p className="text-5xl font-mono font-bold neon-text mb-4">{formatTime(timer)}</p>
                  <div className="flex justify-center gap-3">
                    <NeonButton onClick={() => setTimerRunning(!timerRunning)} variant="primary" size="md">
                      {timerRunning ? <Pause size={18} /> : <Play size={18} />}
                      {timerRunning ? "Pausar" : "Iniciar"}
                    </NeonButton>
                  </div>
                </GlassCard>

                {selectedRoom?.isSilent ? (
                  <GlassCard className="p-12 text-center">
                    <VolumeX size={48} className="mx-auto text-yellow-400/30 mb-4" />
                    <p className="text-sm text-[#e0e0ff]/40">Modo silencioso activo</p>
                    <p className="text-[10px] text-[#e0e0ff]/20 mt-1">Solo se permiten reacciones</p>
                    <div className="flex justify-center gap-3 mt-4">
                      {["🔥", "💪", "👏", "🎯", "⚡"].map(e => (
                        <button key={e} className="text-2xl hover:scale-125 transition-transform cursor-pointer p-2 rounded-xl hover:bg-[#1a1a3e]">{e}</button>
                      ))}
                    </div>
                  </GlassCard>
                ) : (
                  <GlassCard className="p-4">
                    <div className="h-64 overflow-y-auto space-y-3 mb-3">
                      {messages.map(m => (
                        <div key={m.id} className={`flex gap-2 ${m.user === "Tú" ? "justify-end" : ""}`}>
                          {m.user !== "Tú" && <div className="w-7 h-7 rounded-lg bg-[#1a1a3e] flex items-center justify-center text-xs flex-shrink-0">👤</div>}
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
              </div>

              <GlassCard className="p-4">
                <h3 className="text-xs font-bold text-[#e0e0ff]/60 mb-3">Participantes</h3>
                <div className="space-y-2">
                  {[{ name: "Tú", status: "Host", emoji: "👤" }, { name: "María", status: "En pomodoro", emoji: "📐" }, { name: "Pedro", status: "Descanso", emoji: "☕" }].map(p => (
                    <div key={p.name} className="flex items-center gap-2 p-2 rounded-lg bg-[#12122a]/50">
                      <span className="text-lg">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#e0e0ff] truncate">{p.name}</p>
                        <p className="text-[9px] text-[#e0e0ff]/30">{p.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
