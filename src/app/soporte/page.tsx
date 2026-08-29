"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { LifeBuoy, Send, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

const STATUS: Record<string, { label: string; color: string }> = {
  open: { label: "Abierto", color: "#eab308" },
  in_progress: { label: "En curso", color: "#3b82f6" },
  resolved: { label: "Resuelto", color: "#22c55e" },
  closed: { label: "Cerrado", color: "#64748b" },
};

export default function SoportePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

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

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !uid) return;
    setSending(true);
    setError("");
    const { error } = await supabase.from("tickets").insert({
      user_id: uid,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
    });
    if (error) {
      setError("Error: " + error.message + " (¿aplicaste el SQL de tickets?)");
    } else {
      setSubject("");
      setMessage("");
      load(uid);
    }
    setSending(false);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-neon flex items-center gap-2">
            <LifeBuoy size={24} /> Soporte
          </h1>
          <p className="text-xs text-[#e0e0ff]/40 mt-1">Crea un ticket y revisa las respuestas del equipo</p>
        </div>

        <GlassCard className="p-5">
          <h3 className="text-sm font-bold text-[#e0e0ff] mb-3">Nuevo ticket</h3>
          <form onSubmit={create} className="space-y-3">
            <input type="text" placeholder="Asunto" value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25" />
            <textarea placeholder="Describe tu problema o pregunta..." rows={4} value={message} onChange={e => setMessage(e.target.value)}
              className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25 resize-none" />
            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>}
            <NeonButton type="submit" variant="primary" size="sm" disabled={sending || !subject.trim() || !message.trim()}>
              <Send size={14} /> {sending ? "Enviando..." : "Enviar ticket"}
            </NeonButton>
          </form>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#e0e0ff]">Mis tickets ({tickets.length})</h3>
            <NeonButton onClick={() => uid && load(uid)} variant="ghost" size="sm"><RefreshCw size={14} /></NeonButton>
          </div>

          {loading ? (
            <p className="text-center py-8 text-[#e0e0ff]/40 text-sm">Cargando...</p>
          ) : (
            <div className="space-y-3">
              {tickets.map(t => {
                const st = STATUS[t.status] || STATUS.open;
                return (
                  <div key={t.id} className="p-4 rounded-xl bg-[#12122a]/40 border border-[rgba(168,85,247,0.08)]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-[#e0e0ff]">{t.subject}</p>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: `${st.color}22`, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#e0e0ff]/60 mb-2">{t.message}</p>
                    <p className="text-[10px] text-[#e0e0ff]/25">{new Date(t.created_at).toLocaleString("es-ES")}</p>

                    {t.staff_response ? (
                      <div className="mt-3 p-3 rounded-xl bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.2)]">
                        <p className="text-[10px] font-bold text-[#a855f7] mb-1">Respuesta del equipo
                          {t.responded_at && <span className="text-[#e0e0ff]/30 font-normal ml-2">{new Date(t.responded_at).toLocaleString("es-ES")}</span>}
                        </p>
                        <p className="text-xs text-[#e0e0ff]/80">{t.staff_response}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-[10px] text-[#e0e0ff]/30 italic">El equipo aún no ha respondido a este ticket.</p>
                    )}
                  </div>
                );
              })}
              {tickets.length === 0 && !loading && (
                <p className="text-center text-[#e0e0ff]/30 text-sm py-6">No has creado ningún ticket.</p>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </AppLayout>
  );
}
