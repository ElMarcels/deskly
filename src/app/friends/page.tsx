"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { UserPlus, UserCheck, UserX, Search, Users, Star, Zap } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

const MOCK_FRIENDS = [
  { id: "1", name: "María García", username: "maria_g", status: "Estudiando Cálculo", status_emoji: "📐", streak: 15, hours: 38.2 },
  { id: "2", name: "Carlos López", username: "carlos_l", status: "En pausa", status_emoji: "☕", streak: 8, hours: 22.1 },
  { id: "3", name: "Ana Martínez", username: "ana_m", status: "Escribiendo tesis", status_emoji: "✍️", streak: 31, hours: 67.4 },
  { id: "4", name: "Pedro Ruiz", username: "pedro_r", status: "Off-line", status_emoji: "💤", streak: 3, hours: 12.8 },
];

const MOCK_REQUESTS = [
  { id: "5", name: "Laura Sánchez", username: "laura_s", status_emoji: "📖" },
  { id: "6", name: "Diego Torres", username: "diego_t", status_emoji: "🧪" },
];

export default function FriendsPage() {
  const [tab, setTab] = useState<"friends" | "requests" | "search">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState(MOCK_FRIENDS);
  const [requests, setRequests] = useState(MOCK_REQUESTS);

  const acceptRequest = (id: string) => {
    const req = requests.find(r => r.id === id);
    if (req) {
      setFriends([...friends, { ...req, status: "Off-line", streak: 0, hours: 0 }]);
      setRequests(requests.filter(r => r.id !== id));
    }
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
                {t === "friends" ? "Amigos" : t === "requests" ? `Solicitudes${requests.length > 0 ? ` (${requests.length})` : ""}` : "Buscar"}
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
                  <div className="w-12 h-12 rounded-xl bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] flex items-center justify-center text-xl">
                    {f.status_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#e0e0ff]">{f.name}</p>
                      <span className="text-[10px] text-[#e0e0ff]/30">@{f.username}</span>
                    </div>
                    <p className="text-xs text-[#e0e0ff]/50">{f.status_emoji} {f.status}</p>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div>
                      <p className="text-sm font-bold neon-text">{f.streak}</p>
                      <p className="text-[9px] text-[#e0e0ff]/30">racha</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#06b6d4]">{f.hours}h</p>
                      <p className="text-[9px] text-[#e0e0ff]/30">horas</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-2 rounded-lg hover:bg-[rgba(168,85,247,0.1)] text-[#a855f7] transition-colors cursor-pointer" title="Dar 💪">
                      💪
                    </button>
                    <button className="p-2 rounded-lg hover:bg-[rgba(168,85,247,0.1)] text-[#06b6d4] transition-colors cursor-pointer" title="Dar 🔥">
                      🔥
                    </button>
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
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e0e0ff]/30" />
              <input type="text" placeholder="Buscar por nombre o usuario..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-xl pl-10 pr-4 py-3 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/30" />
            </div>
            <GlassCard className="p-12 text-center">
              <Search size={48} className="mx-auto text-[#e0e0ff]/10 mb-4" />
              <p className="text-[#e0e0ff]/40">Busca usuarios para agregar</p>
              <p className="text-[10px] text-[#e0e0ff]/20 mt-1">Escribe el nombre o usuario de tu amigo</p>
            </GlassCard>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
