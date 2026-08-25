"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Save } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const STORAGE_KEY = "deskly-quick-notes";

export default function QuickNotes() {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => { const s = localStorage.getItem(STORAGE_KEY); if (s) setContent(s); }, []);

  const autoSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [content]);

  useEffect(() => { const t = setTimeout(autoSave, 1000); return () => clearTimeout(t); }, [content, autoSave]);

  const renderMarkdown = (text: string) => text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-[#a855f7] mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-[#ec4899] mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold gradient-neon mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-[#e0e0ff]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-[#e0e0ff]/80">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-[#1a1a3e] px-1.5 py-0.5 rounded text-[#06b6d4] text-xs font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-[#e0e0ff]/80">• $1</li>')
    .replace(/\n/g, "<br>");

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#ec4899]" />
          <h2 className="text-lg font-bold gradient-neon">Notas Rápidas</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#e0e0ff]/40">
          {saved ? <><Save size={12} className="text-[#06b6d4]" /><span className="text-[#06b6d4]">Guardado</span></> : <span>Autoguardado</span>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-[#e0e0ff]/40 mb-1.5 uppercase tracking-wider">Editor</p>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Escribe tus notas aquí..."
            className="w-full h-64 bg-[#12122a]/50 border border-[rgba(168,85,247,0.15)] rounded-xl p-3 text-sm text-[#e0e0ff] resize-none outline-none focus:border-[rgba(168,85,247,0.5)] placeholder:text-[#e0e0ff]/20 font-[family-name:var(--font-mono)]" />
        </div>
        <div>
          <p className="text-[10px] text-[#e0e0ff]/40 mb-1.5 uppercase tracking-wider">Vista Previa</p>
          <div className="h-64 bg-[#12122a]/50 border border-[rgba(168,85,247,0.15)] rounded-xl p-3 text-sm overflow-auto"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || '<span class="text-[#e0e0ff]/20">La vista previa aparecerá aquí...</span>' }} />
        </div>
      </div>
    </GlassCard>
  );
}
