"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Save } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const STORAGE_KEY = "deskly-quick-notes";

export default function QuickNotes() {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setContent(saved);
  }, []);

  const autoSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [content]);

  useEffect(() => {
    const timer = setTimeout(autoSave, 1000);
    return () => clearTimeout(timer);
  }, [content, autoSave]);

  const renderMarkdown = (text: string) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-neon-purple mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-neon-magenta mb-1">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold gradient-neon mb-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic text-foreground/80">$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-surface-light px-1.5 py-0.5 rounded text-neon-cyan text-xs font-mono">$1</code>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-foreground/80">• $1</li>')
      .replace(/\n/g, "<br>");
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-neon-magenta" />
          <h2 className="text-lg font-bold gradient-neon">Notas Rápidas</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-foreground/40">
          {saved ? (
            <>
              <Save size={12} className="text-neon-cyan" />
              <span className="text-neon-cyan">Guardado</span>
            </>
          ) : (
            <span>Autoguardado</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-foreground/40 mb-1.5 uppercase tracking-wider">Editor</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe tus notas aquí... Soporta Markdown (#, **, `, -, etc.)"
            className="w-full h-64 bg-surface/50 border border-glass-border rounded-xl p-3 text-sm text-foreground resize-none outline-none focus:border-neon-purple/50 placeholder:text-foreground/20 font-mono"
          />
        </div>
        <div>
          <p className="text-[10px] text-foreground/40 mb-1.5 uppercase tracking-wider">Vista Previa</p>
          <div
            className="h-64 bg-surface/50 border border-glass-border rounded-xl p-3 text-sm overflow-auto prose-invert"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) || '<span class="text-foreground/20">La vista previa aparecerá aquí...</span>' }}
          />
        </div>
      </div>
    </GlassCard>
  );
}
