"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Save, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Props {
  groupId: string;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, '<code class="bg-[#1a1a3e] px-1.5 py-0.5 rounded text-[#06b6d4] text-xs font-mono">$1</code>')
    .replace(/- \[ \] (.+)$/gm, '<li class="ml-4">☐ $1</li>')
    .replace(/- \[x\] (.+)$/gm, '<li class="ml-4">☑ $1</li>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
    .replace(/\n/g, "<br>");
}

export default function GroupSharedNotes({ groupId }: Props) {
  const [noteId, setNoteId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id || null));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("group_notes")
      .select("id, content")
      .eq("group_id", groupId)
      .maybeSingle();
    if (data) {
      setNoteId(data.id);
      setContent(data.content || "");
    } else {
      setNoteId(null);
      setContent("");
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel(`pn-${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_notes" }, load)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "group_notes" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, load]);

  const persist = useCallback(async () => {
    if (!uid) return;
    if (noteId) {
      await supabase.from("group_notes").update({ content, updated_by: uid, updated_at: new Date().toISOString() }).eq("id", noteId);
    } else {
      const { data } = await supabase.from("group_notes").insert({ group_id: groupId, content, updated_by: uid }).select().single();
      if (data) setNoteId(data.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [uid, noteId, content, groupId]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(persist, 1200);
    return () => clearTimeout(t);
  }, [content, persist, loading]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#e0e0ff]/40 uppercase tracking-wider flex items-center gap-1"><BookOpen size={11} /> Nota compartida del grupo</p>
        <span className={`flex items-center gap-1 text-[10px] ${saved ? "text-[#06b6d4]" : "text-[#e0e0ff]/30"}`}>
          <Save size={10} /> {saved ? "Guardado" : "Autoguardado"}
        </span>
      </div>

      {loading ? (
        <p className="text-center text-[#e0e0ff]/30 text-xs py-6">Cargando nota...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-[#e0e0ff]/40 mb-1.5 uppercase tracking-wider">Editor (Markdown)</p>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Escribe apuntes compartidos. Todos los miembros del grupo pueden editarlos..."
              className="w-full h-64 bg-[#12122a]/50 border border-[rgba(168,85,247,0.15)] rounded-xl p-3 text-sm text-[#e0e0ff] resize-none outline-none focus:border-[rgba(168,85,247,0.5)] placeholder:text-[#e0e0ff]/20 font-[family-name:var(--font-mono)]" />
          </div>
          <div>
            <p className="text-[10px] text-[#e0e0ff]/40 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Eye size={11} /> Vista Previa</p>
            <div className="h-64 bg-[#12122a]/50 border border-[rgba(168,85,247,0.15)] rounded-xl p-3 text-sm overflow-auto text-[#e0e0ff]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || '<span class="text-[#e0e0ff]/20">La vista previa aparecerá aquí...</span>' }} />
          </div>
        </div>
      )}
    </div>
  );
}
