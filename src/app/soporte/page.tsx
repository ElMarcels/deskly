"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { LifeBuoy, RefreshCw, Send, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const STATUS: Record<string, { label: string; color: string }> = {
  open: { label: "Abierto", color: "#eab308" },
  in_progress: { label: "En curso", color: "#3b82f6" },
  resolved: { label: "Resuelto", color: "#22c55e" },
  closed: { label: "Cerrado", color: "#64748b" },
};

export default function SoportePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const load = async (userUid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", userUid)
      .order("created_at", { ascending: false });
    if (error) setError("Error: " + error.message);
    else setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUid(data.user.id);
        load(data.user.id);
      }
    })();
  }, []);

  const openTicket = async (t: any) => {
    setSelected(t);
    setText("");
    const { data } = await supabase
      .from("ticket_messages").select("*")
      .eq("ticket_id", t.id).order("created_at", { ascending: true });
    setMessages([{ id: "first", sender: "user", content: t.message, created_at: t.created_at }, ...(data || [])]);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !text.trim()) return;
    setSending(true);
    setError("");
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: selected.id, sender: "user", content: text.trim(),
    });
    if (error) {
      setError("Error: " + error.message + " (¿aplicaste el SQL ticket_conversations?)");
    } else {
      openTicket(selected);
    }
    setSending(false);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !uid) return;
    setSending(true);
    setError("");
    const { data, error } = await supabase.from("tickets").insert({
      user_id: uid, subject: subject.trim(), message: message.trim(), status: "open",
    }).select().single();
    if (error) {
      setError("Error: " + error.message + " (¿aplicaste el SQL de tickets?)");
    } else {
      setSubject(""); setMessage(""); setShowNew(false);
      await load(uid);
      if (data) openTicket(data);
    }
    setSending(false);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-neon flex items-center gap-2">
              <LifeBuoy size={24} /> Soporte
            </h1>
            <p className="text-xs text-[#e0e0ff]/40 mt-1">Conversa con el equipo en cada ticket</p>
          </div>
          <div className="flex gap-2">
            <NeonButton onClick={() => uid && load(uid)} variant="ghost" size="sm"><RefreshCw size={14} /></NeonButton>
            <NeonButton onClick={() => setShowNew(true)} variant="primary" size="sm"><Plus size={14} /> Nuevo ticket</NeonButton>
          </div>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>}

        {showNew && (
          <GlassCard className="p-5 animate-slide-up">
            <h3 className="text-sm font-bold text-[#e0e0ff] mb-3">Nuevo ticket</h3>
            <form onSubmit={create} className="space-y-3">
              <input type="text" placeholder="Asunto" value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25" />
              <textarea placeholder="Describe tu problema o pregunta..." rows={4} value={message} onChange={e => setMessage(e.target.value)}
                className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25 resize-none" />
              <div className="flex gap-2">
                <NeonButton type="submit" variant="primary" size="sm" disabled={sending || !subject.trim() || !message.trim()}>
                  <Send size={14} /> {sending ? "Creando..." : "Crear ticket"}
                </NeonButton>
                <NeonButton onClick={() => setShowNew(false)} variant="ghost" size="sm">Cancelar</NeonButton>
              </div>
            </form>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <GlassCard className="lg:col-span-2 p-4">
            <h3 className="text-sm font-bold text-[#e0e0ff] mb-3">Mis tickets ({tickets.length})</h3>
            {loading ? (
              <p className="text-center text-[#e0e0ff]/40 text-sm py-8">Cargando...</p>
            ) : (
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                {tickets.map(t => {
                  const st = STATUS[t.status] || STATUS.open;
                  return (
                    <button key={t.id} onClick={() => openTicket(t)}
                      className={`w-full text-left p-3 rounded-lg cursor-pointer transition-colors ${selected?.id === t.id ? "bg-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.3)]" : "border border-transparent hover:bg-[#1a1a3e]"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-[#e0e0ff] truncate mr-2">{t.subject}</p>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0" style={{ background: `${st.color}22`, color: st.color }}>{st.label}</span>
                      </div>
                      <p className="text-[10px] text-[#e0e0ff]/30">{new Date(t.created_at).toLocaleString("es-ES")}</p>
                    </button>
                  );
                })}
                {tickets.length === 0 && <p className="text-center text-[#e0e0ff]/30 text-sm py-8">No has creado ningún ticket.</p>}
              </div>
            )}
          </GlassCard>

          <GlassCard className="lg:col-span-3 p-4 flex flex-col">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[rgba(168,85,247,0.1)]">
                  <p className="text-sm font-bold text-[#e0e0ff]">{selected.subject}</p>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: `${STATUS[selected.status]?.color || "#eab308"}22`, color: STATUS[selected.status]?.color || "#eab308" }}>
                    {STATUS[selected.status]?.label || "Abierto"}
                  </span>
                </div>

                <div className="flex-1 min-h-[48vh] max-h-[62vh] overflow-y-auto space-y-3 pr-1 mb-3">
                  {messages.map(m => {
                    const isStaff = m.sender === "staff";
                    return (
                      <div key={m.id} className={`flex ${isStaff ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 ${isStaff ? "bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)]" : "bg-[#1a1a3e] border border-[rgba(168,85,247,0.1)]"}`}>
                          <p className={`text-[10px] mb-0.5 ${isStaff ? "text-[#a855f7]" : "text-[#e0e0ff]/40"}`}>
                            {isStaff ? "Equipo Deskly" : "Tú"}
                          </p>
                          <p className="text-xs text-[#e0e0ff]">{m.content}</p>
                          <p className="text-[9px] text-[#e0e0ff]/20 mt-0.5">{new Date(m.created_at).toLocaleString("es-ES")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selected.status !== "resolved" && selected.status !== "closed" && (
                  <form onSubmit={send} className="flex gap-2">
                    <input value={text} onChange={e => setText(e.target.value)} placeholder="Escribe un mensaje..."
                      className="flex-1 bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-xl px-3 py-2 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
                    <NeonButton type="submit" variant="primary" size="sm" disabled={sending || !text.trim()}><Send size={14} /></NeonButton>
                  </form>
                )}
                {(selected.status === "resolved" || selected.status === "closed") && (
                  <p className="text-center text-xs text-[#e0e0ff]/30 py-3">
                    Este ticket está {selected.status === "resolved" ? "resuelto" : "cerrado"}.
                  </p>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[#e0e0ff]/30 text-sm">Selecciona un ticket para abrir la conversación</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}
