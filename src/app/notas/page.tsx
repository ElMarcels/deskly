"use client";

import { useState, useEffect, useCallback } from "react";
import { Note, Plus, Trash2, Search, Save, Eye, BookOpen, Tag, Palette } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

const STORAGE_KEY = "deskly-notes";

const COLORS = [
  { name: "Violeta", color: "#a855f7" },
  { name: "Magenta", color: "#ec4899" },
  { name: "Cian", color: "#06b6d4" },
  { name: "Azul", color: "#3b82f6" },
  { name: "Verde", color: "#22c55e" },
  { name: "Naranja", color: "#f97316" },
];

interface NoteItem {
  id: string;
  title: string;
  content: string;
  tag: string;
  color: string;
  updatedAt: number;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/`(.+?)`/g, '<code class="bg-[#1a1a3e] px-1.5 py-0.5 rounded text-[#06b6d4] text-xs font-mono">$1</code>')
    .replace(/- \[ \] (.+)$/gm, '<li class="ml-4 flex items-center gap-2"><input type="checkbox" disabled class="accent-[#a855f7]"> $1</li>')
    .replace(/- \[x\] (.+)$/gm, '<li class="ml-4 flex items-center gap-2"><input type="checkbox" checked disabled class="accent-[#a855f7]"> <span class="line-through opacity-60">$1</span></li>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
    .replace(/\n/g, "<br>");
}

export default function NotasPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setNotes(JSON.parse(s)); } catch {}
    setLoading(false);
  }, []);

  const persist = useCallback((next: NoteItem[]) => {
    setNotes(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const create = () => {
    const n: NoteItem = { id: crypto.randomUUID(), title: "Nueva nota", content: "", tag: "", color: COLORS[0].color, updatedAt: Date.now() };
    persist([n, ...notes]);
    setSel(n.id);
  };

  const update = (id: string, patch: Partial<NoteItem>) => {
    persist(notes.map(n => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n));
  };

  const remove = (id: string) => {
    persist(notes.filter(n => n.id !== id));
    if (sel === id) setSel(null);
  };

  const allTags = Array.from(new Set(notes.map(n => n.tag).filter(Boolean)));
  const filtered = notes.filter(n => {
    const q = search.toLowerCase();
    const matchQ = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    const matchT = !tagFilter || n.tag === tagFilter;
    return matchQ && matchT;
  });

  const active = notes.find(n => n.id === sel) || null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-neon flex items-center gap-2"><BookOpen size={24} /> Notas</h1>
            <p className="text-xs text-[#e0e0ff]/40 mt-1">Notas con Markdown, etiquetas y colores</p>
          </div>
          <NeonButton onClick={create} variant="primary" size="sm"><Plus size={14} /> Nueva nota</NeonButton>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-72 shrink-0 space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e0e0ff]/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en notas..."
                className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setTagFilter("")}
                className={`px-2 py-1 rounded-lg text-[10px] cursor-pointer ${!tagFilter ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7]" : "bg-[#1a1a3e] text-[#e0e0ff]/50 hover:text-[#e0e0ff]"}`}>Todas</button>
              {allTags.map(t => (
                <button key={t} onClick={() => setTagFilter(tagFilter === t ? "" : t)}
                  className={`px-2 py-1 rounded-lg text-[10px] cursor-pointer ${tagFilter === t ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7]" : "bg-[#1a1a3e] text-[#e0e0ff]/50 hover:text-[#e0e0ff]"}`}>{t}</button>
              ))}
            </div>
            <GlassCard className="p-3">
              {loading ? (
                <p className="text-center text-[#e0e0ff]/40 text-sm py-4">Cargando...</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-[#e0e0ff]/30 text-sm py-4">No hay notas</p>
              ) : (
                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                  {filtered.map(n => (
                    <button key={n.id} onClick={() => setSel(n.id)}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer ${sel === n.id ? "bg-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.3)]" : "hover:bg-[#1a1a3e] border border-transparent"}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: n.color }} />
                        <p className="text-sm font-medium text-[#e0e0ff] truncate flex-1">{n.title || "Sin título"}</p>
                      </div>
                      {n.tag && <p className="text-[10px] text-[#e0e0ff]/40 mt-1 ml-4">#{n.tag}</p>}
                    </button>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          <div className="flex-1">
            {active ? (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: active.color }} />
                  <input value={active.title} onChange={e => update(active.id, { title: e.target.value })}
                    placeholder="Título" className="flex-1 bg-transparent text-lg font-bold text-[#e0e0ff] outline-none placeholder:text-[#e0e0ff]/20" />
                  <button onClick={() => remove(active.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-[#e0e0ff]/40 hover:text-red-400 cursor-pointer"><Trash2 size={16} /></button>
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="flex items-center gap-1 text-[#e0e0ff]/40"><Tag size={12} /></span>
                  <input value={active.tag} onChange={e => update(active.id, { tag: e.target.value })}
                    placeholder="Etiqueta"
                    className="bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-2 py-1 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25 w-40" />
                  <span className="flex items-center gap-1 text-[#e0e0ff]/40"><Palette size={12} /></span>
                  <div className="flex gap-1.5">
                    {COLORS.map(c => (
                      <button key={c.name} onClick={() => update(active.id, { color: c.color })} title={c.name}
                        className={`w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110 ${active.color === c.color ? "ring-2 ring-white/50" : ""}`} style={{ background: c.color }} />
                    ))}
                  </div>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-[#e0e0ff]/30"><Save size={12} /> Autoguardado</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-[#e0e0ff]/40 mb-1.5 uppercase tracking-wider">Editor (Markdown)</p>
                    <textarea value={active.content} onChange={e => update(active.id, { content: e.target.value })}
                      placeholder="Escribe con Markdown: # Título, **negrita**, - lista..."
                      className="w-full h-72 bg-[#12122a]/50 border border-[rgba(168,85,247,0.15)] rounded-xl p-3 text-sm text-[#e0e0ff] resize-none outline-none focus:border-[rgba(168,85,247,0.5)] placeholder:text-[#e0e0ff]/20 font-[family-name:var(--font-mono)]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#e0e0ff]/40 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Eye size={11} /> Vista Previa</p>
                    <div
                      className="h-72 bg-[#12122a]/50 border border-[rgba(168,85,247,0.15)] rounded-xl p-3 text-sm overflow-auto text-[#e0e0ff]"
                      style={{ borderLeft: `3px solid ${active.color}` }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(active.content) || '<span class="text-[#e0e0ff]/20">La vista previa aparecerá aquí...</span>' }} />
                  </div>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-16 text-center">
                <Note size={40} className="mx-auto mb-3 text-[#e0e0ff]/20" />
                <p className="text-sm text-[#e0e0ff]/40">Selecciona una nota o crea una nueva</p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
