"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Radio, Plus, Users, Lock, Unlock, VolumeX, Play, Pause, Send, ArrowLeft, Trash2, X } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

interface Room {
  id: string; name: string; host: string; isPublic: boolean; isSilent: boolean;
  maxParticipants: number; timerDuration: number;
  status: "lobby" | "active"; timeLeft: number;
}
interface RoomMessage { id: string; user: string; content: string; time: string; }

const STORAGE = "deskly-rooms";

export default function RoomsPage() {
  const [view, setView] = useState<"list" | "room">("list");
  const [rooms, setRooms] = useState<Room[]>([]);
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

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE); if (s) setRooms(JSON.parse(s)); } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(rooms)); } catch {} }, [rooms]);

  useEffect(() => {
    if (selectedRoom) setTimer(selectedRoom.timerDuration * 60);
  }, [selectedRoom]);

  useEffect(() => {
    if (timerRunning && timer > 0) {
      intervalRef.current = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && timerRunning) {
      setTimerRunning(false);
      if (selectedRoom) {
        setRooms(rooms.map(r => r.id === selectedRoom.id ? { ...r, status: "completed" as const } : r));
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, timer]);

  const createRoom = () => {
    if (!newRoomName.trim()) return;
    const room: Room = {
      id: Date.now().toString(), name: newRoomName, host: "Tú",
      isPublic: newRoomPublic, isSilent: newRoomSilent,
      maxParticipants: 10, timerDuration: newRoomDuration,
      status: "lobby", timeLeft: newRoomDuration * 60,
    };
    setRooms([...rooms, room]);
    setNewRoomName(""); setShowCreateForm(false);
  };

  const enterRoom = (room: Room) => { setSelectedRoom(room); setView("room"); setMessages([]); setTimerRunning(false); };

  const deleteRoom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRooms(rooms.filter(r => r.id !== id));
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
              <NeonButton onClick={() => setShowCreateForm(true)} variant="primary" size="sm"><Plus size={14} /> Crear Sala</NeonButton>
            </div>

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

            {rooms.length === 0 ? (
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
                        <button onClick={(e) => deleteRoom(room.id, e)} className="p-1 rounded hover:bg-red-500/20 text-[#e0e0ff]/20 hover:text-red-400 cursor-pointer"><Trash2 size={12} /></button>
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
        ) : (
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
        )}
      </div>
    </AppLayout>
  );
}
