"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { UserPlus, UserCheck, UserX, Search, Users, Trash2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

interface Friend { id: string; name: string; username: string; status: string; status_emoji: string; streak: number; hours: number; }
interface FriendRequest { id: string; name: string; username: string; status_emoji: string; }

const STORAGE_FRIENDS = "deskly-friends";
const STORAGE_REQUESTS = "deskly-friend-requests";

export default function FriendsPage() {
  const [tab, setTab] = useState<"friends" | "requests" | "search">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");

  useEffect(() => {
    try { const f = localStorage.getItem(STORAGE_FRIENDS); if (f) setFriends(JSON.parse(f)); } catch {}
    try { const r = localStorage.getItem(STORAGE_REQUESTS); if (r) setRequests(JSON.parse(r)); } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem(STORAGE_FRIENDS, JSON.stringify(friends)); } catch {} }, [friends]);
  useEffect(() => { try { localStorage.setItem(STORAGE_REQUESTS, JSON.stringify(requests)); } catch {} }, [requests]);

  const acceptRequest = (id: string) => {
    const req = requests.find(r => r.id === id);
    if (req) {
      setFriends([...friends, { ...req, status: "En línea", streak: 0, hours: 0 }]);
      setRequests(requests.filter(r => r.id !== id));
    }
  };

  const removeFriend = (id: string) => setFriends(friends.filter(f => f.id !== id));

  const addFriend = () => {
    if (!newName.trim() || !newUsername.trim()) return;
    setRequests([...requests, { id: Date.now().toString(), name: newName, username: newUsername, status_emoji: "📚" }]);
    setNewName(""); setNewUsername("");
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-neon">Amigos</h1>
          <div className="flex gap-1 bg-[#12122a] rounded-lg p-1">
            {(["friends", "requests", "search"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${tab === t ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7]" : "text-[#e0e0ff]/40 hover:text-[#e0e0ff]"}`}>
                {t === "friends" ? "Amigos" : t === "requests" ? `Solicitudes${requests.length > 0 ? ` (${requests.length})` : ""}` : "Agregar"}
              </button>
            ))}
          </div>
        </div>

        {tab === "friends" && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <Users size={48} className="mx-auto text-[#e0e0ff]/10 mb-4" />
                <p className="text-[#e0e0ff]/40">Aún no tienes amigos</p>
                <p className="text-[10px] text-[#e0e0ff]/20 mt-1">Busca gente para estudiar juntos</p>
              </GlassCard>
            ) : friends.map(f => (
              <GlassCard key={f.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] flex items-center justify-center text-xl">{f.status_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#e0e0ff]">{f.name}</p>
                      <span className="text-[10px] text-[#e0e0ff]/30">@{f.username}</span>
                    </div>
                    <p className="text-xs text-[#e0e0ff]/50">{f.status_emoji} {f.status}</p>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div><p className="text-sm font-bold neon-text">{f.streak}</p><p className="text-[9px] text-[#e0e0ff]/30">racha</p></div>
                    <div><p className="text-sm font-bold text-[#06b6d4]">{f.hours}h</p><p className="text-[9px] text-[#e0e0ff]/30">horas</p></div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-2 rounded-lg hover:bg-[rgba(168,85,247,0.1)] text-xl transition-transform hover:scale-110 cursor-pointer" title="Dar 💪">💪</button>
                    <button className="p-2 rounded-lg hover:bg-[rgba(168,85,247,0.1)] text-xl transition-transform hover:scale-110 cursor-pointer" title="Dar 🔥">🔥</button>
                    <button onClick={() => removeFriend(f.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-[#e0e0ff]/20 hover:text-red-400 transition-colors cursor-pointer" title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {tab === "requests" && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <UserCheck size={48} className="mx-auto text-[#e0e0ff]/10 mb-4" />
                <p className="text-[#e0e0ff]/40">No hay solicitudes pendientes</p>
              </GlassCard>
            ) : requests.map(r => (
              <GlassCard key={r.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] flex items-center justify-center text-xl">{r.status_emoji}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#e0e0ff]">{r.name}</p>
                    <p className="text-[10px] text-[#e0e0ff]/30">@{r.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <NeonButton onClick={() => acceptRequest(r.id)} variant="primary" size="sm"><UserCheck size={14} /> Aceptar</NeonButton>
                    <NeonButton onClick={() => setRequests(requests.filter(x => x.id !== r.id))} variant="danger" size="sm"><UserX size={14} /></NeonButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {tab === "search" && (
          <div className="space-y-4">
            <GlassCard className="p-5">
              <h3 className="text-sm font-bold text-[#e0e0ff] mb-3">Enviar solicitud de amistad</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)}
                  className="flex-1 bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
                <input type="text" placeholder="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)}
                  className="flex-1 bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
                <NeonButton onClick={addFriend} variant="primary" size="sm"><UserPlus size={14} /> Enviar</NeonButton>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
