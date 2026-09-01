"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, Layers, Sparkles, Upload, Loader2, RotateCcw, ArrowRight,
  ArrowLeft, FileText, Save, Eye, X, RefreshCw,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import Modal from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase/client";

interface Deck {
  id: string;
  name: string;
  description: string;
  subject_id: string | null;
  flashcards: Flashcard[];
}
interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function FlashcardsPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false);
  const [genDeckName, setGenDeckName] = useState("");
  const [genText, setGenText] = useState("");
  const [genFile, setGenFile] = useState<File | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  // Study / review
  const [studyDeck, setStudyDeck] = useState<Deck | null>(null);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Create deck
  const [showCreate, setShowCreate] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUid(data.user.id);
        loadDecks(data.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadDecks = async (userId: string) => {
    setLoading(true);
    const { data: decksData } = await supabase
      .from("flashcard_decks")
      .select("id, name, description")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!decksData) { setLoading(false); return; }

    const deckIds = decksData.map(d => d.id);
    let cardsByDeck: Record<string, Flashcard[]> = {};
    if (deckIds.length > 0) {
      const { data: cards } = await supabase
        .from("flashcards")
        .select("id, deck_id, front, back")
        .in("deck_id", deckIds)
        .order("created_at", { ascending: true });
      cardsByDeck = (cards || []).reduce<Record<string, Flashcard[]>>((acc, c) => {
        (acc[c.deck_id] = acc[c.deck_id] || []).push({ id: c.id, front: c.front, back: c.back });
        return acc;
      }, {});
    }

    setDecks(decksData.map(d => ({
      id: d.id, name: d.name, description: d.description || "",
      subject_id: null, flashcards: cardsByDeck[d.id] || [],
    })));
    setLoading(false);
  };

  const createDeck = async () => {
    if (!newDeckName.trim() || !uid) return;
    const { data, error } = await supabase.from("flashcard_decks")
      .insert({ name: newDeckName.trim(), description: newDeckDesc.trim(), user_id: uid })
      .select()
      .single();
    if (error) { setGenError("Error: " + error.message); return; }
    setDecks([{ id: data.id, name: data.name, description: data.description, subject_id: null, flashcards: [] }, ...decks]);
    setNewDeckName(""); setNewDeckDesc(""); setShowCreate(false);
  };

  const deleteDeck = async (deck: Deck) => {
    await supabase.from("flashcards").delete().eq("deck_id", deck.id);
    await supabase.from("flashcard_decks").delete().eq("id", deck.id);
    setDecks(decks.filter(d => d.id !== deck.id));
  };

  const deleteCard = async (cardId: string) => {
    await supabase.from("flashcards").delete().eq("id", cardId);
    if (selectedDeck) {
      const next = { ...selectedDeck, flashcards: selectedDeck.flashcards.filter(c => c.id !== cardId) };
      setSelectedDeck(next);
      setDecks(decks.map(d => d.id === next.id ? next : d));
    }
  };

  const generateFlashcards = async () => {
    if (!uid || !genDeckName.trim() || (!genText.trim() && !genFile)) {
      setGenError("Completa el nombre del deck y sube un PDF o pega texto.");
      return;
    }
    setGenLoading(true);
    setGenError("");
    try {
      const formData = new FormData();
      formData.append("deckName", genDeckName.trim());
      if (genFile) formData.append("file", genFile);
      if (genText.trim()) formData.append("text", genText.trim());

      const res = await fetch("/api/generate-flashcards", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error || "Error al generar tarjetas"); setGenLoading(false); return; }

      const cards = data.flashcards as Flashcard[];
      const { data: deckData, error: deckError } = await supabase.from("flashcard_decks")
        .insert({ name: genDeckName.trim(), description: "Generado con IA", user_id: uid })
        .select()
        .single();
      if (deckError) { setGenError("Error: " + deckError.message); setGenLoading(false); return; }

      const inserts = cards.map(c => ({
        deck_id: deckData.id, user_id: uid, front: c.front, back: c.back,
      }));
      const { error: cardsError } = await supabase.from("flashcards").insert(inserts);
      if (cardsError) { setGenError("Error: " + cardsError.message); setGenLoading(false); return; }

      setDecks([{ id: deckData.id, name: deckData.name, description: "Generado con IA", subject_id: null, flashcards: cards }, ...decks]);
      setShowGenerate(false);
      setGenText(""); setGenFile(null); setGenDeckName("");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setGenLoading(false);
    }
  };

  const addManualCard = async () => {
    if (!selectedDeck) return;
    const { data, error } = await supabase.from("flashcards")
      .insert({ deck_id: selectedDeck.id, user_id: uid, front: "", back: "" })
      .select()
      .single();
    if (error) return;
    const next = { ...selectedDeck, flashcards: [...selectedDeck.flashcards, { id: data.id, front: "", back: "" }] };
    setSelectedDeck(next);
    setDecks(decks.map(d => d.id === next.id ? next : d));
  };

  const updateCard = async (card: Flashcard, field: "front" | "back", value: string) => {
    if (!selectedDeck) return;
    const next = { ...selectedDeck, flashcards: selectedDeck.flashcards.map(c => c.id === card.id ? { ...c, [field]: value } : c) };
    setSelectedDeck(next);
    setDecks(decks.map(d => d.id === next.id ? next : d));
  };

  const startStudy = (deck: Deck) => { setStudyDeck(deck); setStudyIndex(0); setFlipped(false); };

  const totalCards = decks.reduce((sum, d) => sum + d.flashcards.length, 0);

  const renderDeckList = () => (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-neon flex items-center gap-2"><Layers size={24} /> Flashcards</h1>
          <p className="text-xs text-[#e0e0ff]/40 mt-1">Crea, repasa y genera tarjetas con IA</p>
        </div>
        <div className="flex gap-2">
          <NeonButton onClick={() => setShowGenerate(true)} variant="primary" size="sm"><Sparkles size={14} /> Generar con IA</NeonButton>
          <NeonButton onClick={() => setShowCreate(true)} variant="secondary" size="sm"><Plus size={14} /> Nuevo deck</NeonButton>
        </div>
      </div>

      <GlassCard className="p-5">
        <p className="text-xs text-[#e0e0ff]/40">{decks.length} decks · {totalCards} tarjetas</p>
      </GlassCard>

      {decks.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <Sparkles size={48} className="mx-auto text-[#a855f7]/30 mb-4" />
          <p className="text-sm text-[#e0e0ff]/50">No tienes decks de flashcards</p>
          <p className="text-[10px] text-[#e0e0ff]/25 mt-1">Sube un PDF de apuntes y genera tarjetas con IA, o crea un deck manualmente</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(deck => (
            <GlassCard key={deck.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#ec4899]/40 flex items-center justify-center">
                  <Layers size={18} className="text-white" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setSelectedDeck(deck)} className="p-1.5 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/40 hover:text-[#e0e0ff] cursor-pointer"><Eye size={14} /></button>
                  <button onClick={() => deleteDeck(deck)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#e0e0ff]/40 hover:text-red-400 cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="text-sm font-bold text-[#e0e0ff] mb-1">{deck.name}</h3>
              <p className="text-[10px] text-[#e0e0ff]/40 mb-4">{deck.description || "Sin descripción"}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#e0e0ff]/50">{deck.flashcards.length} tarjetas</span>
                <NeonButton onClick={() => startStudy(deck)} variant="primary" size="sm" disabled={deck.flashcards.length === 0}>
                  Empezar <ArrowRight size={14} />
                </NeonButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );

  const renderDeckDetail = () => {
    if (!selectedDeck) return null;
    return (
      <>
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedDeck(null)} className="p-2 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/40 cursor-pointer"><ArrowLeft size={18} /></button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#e0e0ff]">{selectedDeck.name}</h1>
            <p className="text-[10px] text-[#e0e0ff]/40">{selectedDeck.flashcards.length} tarjetas</p>
          </div>
          <NeonButton onClick={addManualCard} variant="secondary" size="sm"><Plus size={14} /> Añadir tarjeta</NeonButton>
          <NeonButton onClick={() => startStudy(selectedDeck)} variant="primary" size="sm" disabled={selectedDeck.flashcards.length === 0}>Repasar</NeonButton>
        </div>

        <GlassCard className="p-5 space-y-3">
          {selectedDeck.flashcards.length === 0 && <p className="text-center text-[#e0e0ff]/30 text-sm py-8">Añade tarjetas a este deck</p>}
          {selectedDeck.flashcards.map((card, idx) => (
            <div key={card.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-[#12122a]/50 border border-[rgba(168,85,247,0.15)]">
              <div>
                <p className="text-[10px] text-[#a855f7] mb-1.5 uppercase tracking-wider flex items-center gap-1"><FileText size={11} /> Front ({idx + 1})</p>
                <textarea value={card.front} onChange={e => updateCard(card, "front", e.target.value)}
                  placeholder="Pregunta o concepto"
                  className="w-full h-20 bg-[#1a1a3e] border border-[rgba(168,85,247,0.15)] rounded-lg p-2 text-xs text-[#e0e0ff] resize-none outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-[#06b6d4] uppercase tracking-wider flex items-center gap-1"><FileText size={11} /> Back</p>
                  <button onClick={() => deleteCard(card.id)} className="p-1 rounded hover:bg-red-500/20 text-[#e0e0ff]/30 hover:text-red-400 cursor-pointer"><Trash2 size={12} /></button>
                </div>
                <textarea value={card.back} onChange={e => updateCard(card, "back", e.target.value)}
                  placeholder="Respuesta o definición"
                  className="w-full h-20 bg-[#1a1a3e] border border-[rgba(168,85,247,0.15)] rounded-lg p-2 text-xs text-[#e0e0ff] resize-none outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25" />
              </div>
            </div>
          ))}
        </GlassCard>
      </>
    );
  };

  const renderStudy = () => {
    if (!studyDeck) return null;
    const card = studyDeck.flashcards[studyIndex];
    if (!card) return null;
    return (
      <>
        <div className="flex items-center gap-3">
          <button onClick={() => setStudyDeck(null)} className="p-2 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/40 cursor-pointer"><X size={18} /></button>
          <h1 className="text-lg font-bold text-[#e0e0ff] flex-1">Repaso: {studyDeck.name}</h1>
          <p className="text-xs text-[#e0e0ff]/40">{studyIndex + 1} / {studyDeck.flashcards.length}</p>
        </div>

        <GlassCard glow className="p-8 cursor-pointer" onClick={() => setFlipped(!flipped)}>
          <div className="flex justify-center mb-6">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${flipped ? "bg-[#06b6d4]/20 text-[#06b6d4]" : "bg-[#a855f7]/20 text-[#a855f7]"}`}>
              {flipped ? "RESPUESTA" : "PREGUNTA"}
            </span>
          </div>
          <div className="min-h-[200px] flex items-center justify-center text-center">
            <p className={`text-2xl font-bold ${flipped ? "text-[#06b6d4]" : "text-[#e0e0ff]"}`}>
              {flipped ? card.back : card.front}
            </p>
          </div>
          <p className="text-center text-[10px] text-[#e0e0ff]/30 mt-6 flex items-center justify-center gap-1">
            <RotateCcw size={12} /> Haz clic para voltear la tarjeta
          </p>
        </GlassCard>

        <div className="flex justify-center gap-3">
          <NeonButton variant="secondary" size="md"
            onClick={() => { setFlipped(false); setStudyIndex(Math.max(0, studyIndex - 1)); }}
            disabled={studyIndex === 0}>
            <ArrowLeft size={16} /> Anterior
          </NeonButton>
          <NeonButton variant="primary" size="md"
            onClick={() => { setFlipped(false); setStudyIndex(studyIndex + 1); }}
            disabled={studyIndex >= studyDeck.flashcards.length - 1}>
            Siguiente <ArrowRight size={16} />
          </NeonButton>
        </div>
      </>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {studyDeck ? renderStudy() : selectedDeck ? renderDeckDetail() : renderDeckList()}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Deck">
        <div className="space-y-3">
          <input type="text" placeholder="Nombre del deck" value={newDeckName} onChange={e => setNewDeckName(e.target.value)}
            className="w-full bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25" />
          <input type="text" placeholder="Descripción (opcional)" value={newDeckDesc} onChange={e => setNewDeckDesc(e.target.value)}
            className="w-full bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25" />
          <NeonButton onClick={createDeck} variant="primary" size="md" disabled={!newDeckName.trim()}>Crear Deck</NeonButton>
        </div>
      </Modal>

      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generar Flashcards con IA">
        <div className="space-y-3">
          <input type="text" placeholder="Nombre del deck" value={genDeckName} onChange={e => setGenDeckName(e.target.value)}
            className="w-full bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-sm text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25" />

          <label className="block">
            <div className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${genFile ? "border-[#a855f7] bg-[#a855f7]/10" : "border-[rgba(168,85,247,0.3)] hover:border-[#a855f7]/60"}`}>
              <input type="file" accept=".pdf" className="hidden" onChange={e => setGenFile(e.target.files?.[0] || null)} />
              {genFile ? (
                <>
                  <Upload size={24} className="mx-auto text-[#a855f7] mb-2" />
                  <p className="text-xs font-medium text-[#e0e0ff]">{genFile.name}</p>
                  <p className="text-[10px] text-[#e0e0ff]/40 mt-1">Haz clic para cambiar</p>
                </>
              ) : (
                <>
                  <Upload size={24} className="mx-auto text-[#e0e0ff]/30 mb-2" />
                  <p className="text-xs text-[#e0e0ff]/60">Arrastra o selecciona un PDF</p>
                  <p className="text-[10px] text-[#e0e0ff]/30 mt-1">O pega el texto manualmente abajo</p>
                </>
              )}
            </div>
          </label>

          <textarea value={genText} onChange={e => setGenText(e.target.value)} placeholder="O pega aquí el texto de tus apuntes..."
            className="w-full h-32 bg-[#1a1a3e] border border-[rgba(168,85,247,0.15)] rounded-lg p-3 text-xs text-[#e0e0ff] resize-none outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25" />

          {genError && <p className="text-xs text-red-400">{genError}</p>}

          <NeonButton onClick={generateFlashcards} variant="primary" size="md" disabled={genLoading || !genDeckName.trim()}>
            {genLoading ? <><Loader2 size={16} className="animate-spin" /> Generando...</> : <><Sparkles size={16} /> Generar Tarjetas</>}
          </NeonButton>
        </div>
      </Modal>
    </AppLayout>
  );
}
