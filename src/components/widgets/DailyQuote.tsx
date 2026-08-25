"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

const QUOTES = [
  { text: "La educación es el arma más poderosa que puedes usar para cambiar el mundo.", author: "Nelson Mandela" },
  { text: "El secreto del cambio es enfocar todas tus energías no en luchar contra lo viejo, sino en construir lo nuevo.", author: "Sócrates" },
  { text: "La programación es como el arte: una combinación de creatividad, lógica y perseverancia.", author: "Anónimo" },
  { text: "No es que yo sea muy listo, es que me quedo con los problemas más tiempo.", author: "Albert Einstein" },
  { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
  { text: "La constancia es la madre del saber.", author: "Refrán popular" },
  { text: "Aprender sin reflexionar es malgastar la energía.", author: "Confucio" },
  { text: "La tecnología es mejor cuando une a la gente.", author: "Matt Mullenweg" },
  { text: "El futuro pertenece a quienes creen en la belleza de sus sueños.", author: "Eleanor Roosevelt" },
  { text: "Cada experto fue alguna vez un principiante.", author: "Helen Hayes" },
  { text: "La disciplina es el puente entre tus metas y tus logros.", author: "Jim Rohn" },
  { text: "Invertir en educación genera el mejor interés.", author: "Benjamin Franklin" },
];

export default function DailyQuote() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem("deskly-quote-date");
    const storedIndex = localStorage.getItem("deskly-quote-index");

    if (stored === today && storedIndex) {
      setQuoteIndex(parseInt(storedIndex));
    } else {
      const newIndex = Math.floor(Math.random() * QUOTES.length);
      setQuoteIndex(newIndex);
      localStorage.setItem("deskly-quote-date", today);
      localStorage.setItem("deskly-quote-index", newIndex.toString());
    }
  }, []);

  const refreshQuote = () => {
    let newIndex = Math.floor(Math.random() * QUOTES.length);
    while (newIndex === quoteIndex && QUOTES.length > 1) {
      newIndex = Math.floor(Math.random() * QUOTES.length);
    }
    setQuoteIndex(newIndex);
    localStorage.setItem("deskly-quote-index", newIndex.toString());
  };

  const quote = QUOTES[quoteIndex];

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-neon-cyan" />
          <span className="text-[10px] text-foreground/40 uppercase tracking-wider">
            Frase del Día
          </span>
        </div>
        <button
          onClick={refreshQuote}
          className="p-1 rounded-lg hover:bg-surface-light transition-colors text-foreground/30 hover:text-foreground cursor-pointer"
        >
          <RefreshCw size={12} />
        </button>
      </div>
      <p className="text-sm text-foreground/80 italic leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="text-[10px] text-neon-purple mt-2 font-medium">— {quote.author}</p>
    </GlassCard>
  );
}
