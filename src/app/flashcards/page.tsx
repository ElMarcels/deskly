"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Brain, Plus, RotateCcw, ChevronRight, ChevronLeft, Trash2, Check, X, Eye, EyeOff } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

interface Flashcard { id: string; front: string; back: string; difficulty: "easy" | "medium" | "hard"; nextReview: string; reviewCount: number; easeFactor: number; }
interface Deck { id: string; name: string; cards: Flashcard[]; }

const STORAGE = "deskly-flashcards";

const DEFAULT_DECKS: Deck[] = [
  { id: "1", name: "Cálculo Integral", cards: [
    { id: "c1", front: "¿Qué es la integral indefinida?", back: "Es la operación inversa de la derivada. Si F'(x) = f(x), entonces ∫f(x)dx = F(x) + C", difficulty: "medium", nextReview: new Date().toISOString(), reviewCount: 2, easeFactor: 2.5 },
    { id: "c2", front: "Fórmula de integración por partes", back: "∫u·dv = u·v - ∫v·du", difficulty: "easy", nextReview: new Date().toISOString(), reviewCount: 5, easeFactor: 2.8 },
  ]},
  { id: "2", name: "Física Cuántica", cards: [
    { id: "c3", front: "¿Qué es el Principio de Incertidumbre de Heisenberg?", back: "No se pueden conocer simultáneamente con precisión la posición y el momento de una partícula: Δx·Δp ≥ ℏ/2", difficulty: "hard", nextReview: new Date().toISOString(), reviewCount: 1, easeFactor: 2.5 },
  ]},
];

function spacedRepetition(card: Flashcard, quality: number): Flashcard {
  let { easeFactor, reviewCount } = card;
  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const interval = quality < 3 ? 1 : reviewCount < 3 ? 6 : Math.round(reviewCount * easeFactor);
  reviewCount++;
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  return { ...card, easeFactor, reviewCount, nextReview: nextReview.toISOString(), difficulty: quality <= 2 ? "hard" : quality <= 3 ? "medium" : "easy" };
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newDeckName, setNewDeckName] = useState("");

  useEffect(() => { try { const s = localStorage.getItem(STORAGE); setDecks(s ? JSON.parse(s) : DEFAULT_DECKS); } catch { setDecks(DEFAULT_DECKS); } }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(decks)); } catch {} }, [decks]);

  const dueCards = selectedDeck?.cards.filter(c => new Date(c.nextReview) <= new Date()) || [];
  const currentCard = dueCards[currentCardIdx];

  const rateCard = (quality: number) => {
    if (!selectedDeck || !currentCard) return;
    const updated = spacedRepetition(currentCard, quality);
    setDecks(decks.map(d => d.id === selectedDeck.id ? { ...d, cards: d.cards.map(c => c.id === updated.id ? updated : c) } : d));
    setShowBack(false);
    if (currentCardIdx < dueCards.length - 1) setCurrentCardIdx(currentCardIdx + 1);
    else { setStudyMode(false); setCurrentCardIdx(0); }
  };

  const addCard = () => {
    if (!newFront.trim() || !newBack.trim() || !selectedDeck) return;
    const card: Flashcard = { id: Date.now().toString(), front: newFront, back: newBack, difficulty: "medium", nextReview: new Date().toISOString(), reviewCount: 0, easeFactor: 2.5 };
    setDecks(decks.map(d => d.id === selectedDeck.id ? { ...d, cards: [...d.cards, card] } : d));
    setNewFront(""); setNewBack(""); setShowAddForm(false);
  };

  const addDeck = () => {
    if (!newDeckName.trim()) return;
    setDecks([...decks, { id: Date.now().toString(), name: newDeckName, cards: [] }]);
    setNewDeckName("");
  };

  const deleteDeck = (id: string) => { setDecks(decks.filter(d => d.id !== id)); setSelectedDeck(null); };

  if (studyMode && currentCard) {
    const diffColors = { easy: "text-[#06b6d4]", medium: "text-yellow-400", hard: "text-red-400" };
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-[#e0e0ff]">{selectedDeck?.name}</h1>
            <p className="text-xs text-[#e0e0ff]/40">{currentCardIdx + 1}/{dueCards.length}</p>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-lg cursor-pointer" onClick={() => setShowBack(!showBack)}>
              <GlassCard className={`p-12 text-center min-h-[250px] flex flex-col items-center justify-center neon-glow ${showBack ? "border-[#06b6d4]/50" : ""}`}>
                <p className="text-[10px] text-[#e0e0ff]/30 uppercase tracking-wider mb-4">{showBack ? "Respuesta" : "Pregunta"}</p>
                <p className={`text-lg font-medium ${showBack ? "text-[#06b6d4]" : "text-[#e0e0ff]"}`}>
                  {showBack ? currentCard.back : currentCard.front}
                </p>
                {!showBack && <p className="text-[10px] text-[#e0e0ff]/20 mt-4">Toca para ver la respuesta</p>}
                <span className={`text-[10px] mt-3 ${diffColors[currentCard.difficulty]}`}>
                  {currentCard.difficulty === "easy" ? "Fácil" : currentCard.difficulty === "medium" ? "Media" : "Difícil"}
                </span>
              </GlassCard>
            </div>
          </div>
          {showBack && (
            <div className="flex justify-center gap-3 animate-slide-up">
              <NeonButton onClick={() => rateCard(1)} variant="danger" size="md">😰 Otra vez</NeonButton>
              <NeonButton onClick={() => rateCard(3)} variant="secondary" size="md">🤔 Difícil</NeonButton>
              <NeonButton onClick={() => rateCard(5)} variant="primary" size="md">😎 Fácil</NeonButton>
            </div>
          )}
          <div className="flex justify-center">
            <NeonButton onClick={() => { setStudyMode(false); setCurrentCardIdx(0); }} variant="ghost" size="sm">Salir del modo estudio</NeonButton>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-neon">Flashcards</h1>
          <div className="flex gap-2">
            <input type="text" placeholder="Nombre del deck..." value={newDeckName} onChange={e => setNewDeckName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addDeck()}
              className="bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
            <NeonButton onClick={addDeck} variant="primary" size="sm"><Plus size={14} /> Deck</NeonButton>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(deck => {
            const due = deck.cards.filter(c => new Date(c.nextReview) <= new Date()).length;
            return (
              <GlassCard key={deck.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#e0e0ff]">{deck.name}</h3>
                    <p className="text-[10px] text-[#e0e0ff]/40 mt-0.5">{deck.cards.length} tarjetas · {due} para revisar</p>
                  </div>
                  <button onClick={() => deleteDeck(deck.id)} className="text-[#e0e0ff]/20 hover:text-red-400 cursor-pointer"><Trash2 size={14} /></button>
                </div>
                <div className="flex gap-2">
                  <NeonButton onClick={() => { setSelectedDeck(deck); setShowAddForm(true); }} variant="secondary" size="sm" className="flex-1"><Plus size={12} /> Agregar</NeonButton>
                  <NeonButton onClick={() => { setSelectedDeck(deck); setStudyMode(true); setCurrentCardIdx(0); }} variant="primary" size="sm" className="flex-1" disabled={due === 0}>
                    <Brain size={12} /> Estudiar {due > 0 ? `(${due})` : ""}
                  </NeonButton>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {showAddForm && selectedDeck && (
          <GlassCard className="p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#e0e0ff]">Agregar a {selectedDeck.name}</h3>
              <NeonButton onClick={() => setShowAddForm(false)} variant="ghost" size="sm"><X size={14} /></NeonButton>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#e0e0ff]/40 block mb-1">Pregunta (Frente)</label>
                <textarea value={newFront} onChange={e => setNewFront(e.target.value)} placeholder="Escribe la pregunta..."
                  className="w-full h-24 bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-xl p-3 text-sm text-[#e0e0ff] resize-none outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
              </div>
              <div>
                <label className="text-[10px] text-[#e0e0ff]/40 block mb-1">Respuesta (Reverso)</label>
                <textarea value={newBack} onChange={e => setNewBack(e.target.value)} placeholder="Escribe la respuesta..."
                  className="w-full h-24 bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-xl p-3 text-sm text-[#e0e0ff] resize-none outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <NeonButton onClick={addCard} variant="primary" size="sm">Agregar tarjeta</NeonButton>
            </div>
          </GlassCard>
        )}
      </div>
    </AppLayout>
  );
}
