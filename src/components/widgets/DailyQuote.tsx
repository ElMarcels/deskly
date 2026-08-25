"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const QUOTES = [
  { text: "La educación es el arma más poderosa que puedes usar para cambiar el mundo.", author: "Nelson Mandela" },
  { text: "El secreto del cambio es enfocar todas tus energías no en luchar contra lo viejo, sino en construir lo nuevo.", author: "Sócrates" },
  { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
  { text: "La constancia es la madre del saber.", author: "Refrán popular" },
  { text: "Aprender sin reflexionar es malgastar la energía.", author: "Confucio" },
  { text: "Cada experto fue alguna vez un principiante.", author: "Helen Hayes" },
  { text: "La disciplina es el puente entre tus metas y tus logros.", author: "Jim Rohn" },
  { text: "Invertir en educación genera el mejor interés.", author: "Benjamin Franklin" },
  { text: "No es que yo sea muy listo, es que me quedo con los problemas más tiempo.", author: "Albert Einstein" },
  { text: "La tecnología es mejor cuando une a la gente.", author: "Matt Mullenweg" },
];

export default function DailyQuote() {
  const [qi, setQi] = useState(0);
  useEffect(() => {
    const today = new Date().toDateString(); const stored = localStorage.getItem("deskly-quote-date"); const idx = localStorage.getItem("deskly-quote-index");
    if (stored === today && idx) setQi(parseInt(idx));
    else { const ni = Math.floor(Math.random() * QUOTES.length); setQi(ni); localStorage.setItem("deskly-quote-date", today); localStorage.setItem("deskly-quote-index", ni.toString()); }
  }, []);
  const refresh = () => { let ni = Math.floor(Math.random() * QUOTES.length); while (ni === qi && QUOTES.length > 1) ni = Math.floor(Math.random() * QUOTES.length); setQi(ni); localStorage.setItem("deskly-quote-index", ni.toString()); };
  const q = QUOTES[qi];
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Sparkles size={14} className="text-[#06b6d4]" /><span className="text-[10px] text-[#e0e0ff]/40 uppercase tracking-wider">Frase del Día</span></div>
        <button onClick={refresh} className="p-1 rounded-lg hover:bg-[#1a1a3e] transition-colors text-[#e0e0ff]/30 hover:text-[#e0e0ff] cursor-pointer"><RefreshCw size={12} /></button>
      </div>
      <p className="text-sm text-[#e0e0ff]/80 italic leading-relaxed">&ldquo;{q.text}&rdquo;</p>
      <p className="text-[10px] text-[#a855f7] mt-2 font-medium">— {q.author}</p>
    </GlassCard>
  );
}
