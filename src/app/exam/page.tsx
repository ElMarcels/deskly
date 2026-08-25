"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { FileQuestion, Clock, Check, X, RotateCcw, Play, Pause, Trophy } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

interface Question { id: string; question: string; options: string[]; correct: number; subject: string; }

const MOCK_QUESTIONS: Question[] = [
  { id: "1", question: "¿Cuál es la derivada de sin(x)?", options: ["cos(x)", "-cos(x)", "tan(x)", "-sin(x)"], correct: 0, subject: "Cálculo" },
  { id: "2", question: "¿Qué ley de Newton establece F=ma?", options: ["Primera", "Segunda", "Tercera", "Ninguna"], correct: 1, subject: "Física" },
  { id: "3", question: "¿Qué es un array en programación?", options: ["Una función", "Una estructura de datos", "Un tipo de variable", "Un operador"], correct: 1, subject: "Programación" },
  { id: "4", question: "¿Cuál es la integral de x²?", options: ["x³/3 + C", "2x + C", "x³ + C", "x²/2 + C"], correct: 0, subject: "Cálculo" },
  { id: "5", question: "¿Qué mide el Ohmio?", options: ["Corriente", "Voltaje", "Resistencia", "Potencia"], correct: 2, subject: "Física" },
  { id: "6", question: "¿Qué significa SQL?", options: ["Simple Query Language", "Structured Query Language", "Standard Query Logic", "System Query Language"], correct: 1, subject: "Bases de Datos" },
  { id: "7", question: "¿Cuál es el resultado de 2^10?", options: ["512", "1024", "2048", "256"], correct: 1, subject: "Matemáticas" },
  { id: "8", question: "¿Qué protocolo usa HTTPS?", options: ["TCP", "UDP", "HTTP sobre TLS/SSL", "FTP"], correct: 2, subject: "Redes" },
];

export default function ExamPage() {
  const [mode, setMode] = useState<"menu" | "quiz" | "results">("menu");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startQuiz = () => {
    const shuffled = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, numQuestions);
    setQuestions(shuffled);
    setCurrentIdx(0);
    setSelected(null);
    setAnswers(new Array(shuffled.length).fill(null));
    setTimer(0);
    setTimerRunning(true);
    setMode("quiz");
  };

  useEffect(() => {
    if (timerRunning) intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const selectAnswer = (idx: number) => {
    if (answers[currentIdx] !== null) return;
    setSelected(idx);
    const newAnswers = [...answers];
    newAnswers[currentIdx] = idx;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    setSelected(null);
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
    else { setTimerRunning(false); setMode("results"); }
  };

  const correctCount = answers.filter((a, i) => a === questions[i]?.correct).length;
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {mode === "menu" && (
          <>
            <h1 className="text-2xl font-bold gradient-neon">Modo Examen</h1>
            <GlassCard className="p-8 text-center">
              <FileQuestion size={48} className="mx-auto text-[#a855f7] mb-4" />
              <h2 className="text-lg font-bold text-[#e0e0ff] mb-2">Practica con un examen aleatorio</h2>
              <p className="text-xs text-[#e0e0ff]/40 mb-6">Preguntas de múltiple-choice de tus materias</p>
              <div className="flex items-center justify-center gap-4 mb-6">
                <label className="text-xs text-[#e0e0ff]/50">Número de preguntas:</label>
                <select value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))}
                  className="bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-xs text-[#e0e0ff] outline-none">
                  {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <NeonButton onClick={startQuiz} variant="primary" size="lg"><Play size={18} /> Empezar Examen</NeonButton>
            </GlassCard>
          </>
        )}

        {mode === "quiz" && questions[currentIdx] && (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-[#e0e0ff]">Pregunta {currentIdx + 1}/{questions.length}</h1>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-[#a855f7]"><Clock size={14} /> {formatTime(timer)}</span>
                <span className="text-xs text-[#e0e0ff]/40">{questions[currentIdx].subject}</span>
              </div>
            </div>

            <div className="w-full h-1.5 bg-[#1a1a3e] rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-[#a855f7] to-[#ec4899] rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
            </div>

            <GlassCard className="p-6">
              <p className="text-lg font-medium text-[#e0e0ff] mb-6">{questions[currentIdx].question}</p>
              <div className="grid grid-cols-2 gap-3">
                {questions[currentIdx].options.map((opt, i) => {
                  const isCorrect = i === questions[currentIdx].correct;
                  const isSelected = selected === i;
                  const answered = answers[currentIdx] !== null;
                  let bg = "bg-[#12122a]/50 border-[rgba(168,85,247,0.15)] hover:border-[rgba(168,85,247,0.4)]";
                  if (answered && isCorrect) bg = "bg-green-500/20 border-green-500/50";
                  else if (answered && isSelected && !isCorrect) bg = "bg-red-500/20 border-red-500/50";
                  else if (isSelected) bg = "bg-[rgba(168,85,247,0.15)] border-[rgba(168,85,247,0.4)]";

                  return (
                    <button key={i} onClick={() => selectAnswer(i)} disabled={answered}
                      className={`p-4 rounded-xl border text-left text-sm transition-all cursor-pointer ${bg} ${!answered ? "" : ""}`}>
                      <span className="text-[10px] text-[#e0e0ff]/30 mr-2">{String.fromCharCode(65 + i)}.</span>
                      <span className="text-[#e0e0ff]">{opt}</span>
                      {answered && isCorrect && <Check size={14} className="inline ml-2 text-green-400" />}
                      {answered && isSelected && !isCorrect && <X size={14} className="inline ml-2 text-red-400" />}
                    </button>
                  );
                })}
              </div>
              {answers[currentIdx] !== null && (
                <div className="flex justify-end mt-4">
                  <NeonButton onClick={nextQuestion} variant="primary" size="md">
                    {currentIdx < questions.length - 1 ? "Siguiente →" : "Ver Resultados"}
                  </NeonButton>
                </div>
              )}
            </GlassCard>
          </>
        )}

        {mode === "results" && (
          <>
            <h1 className="text-2xl font-bold gradient-neon">Resultados</h1>
            <GlassCard className="p-8 text-center">
              <Trophy size={48} className={`mx-auto mb-4 ${score >= 70 ? "text-yellow-400" : "text-[#e0e0ff]/20"}`} />
              <p className="text-4xl font-bold neon-text mb-2">{score}%</p>
              <p className="text-sm text-[#e0e0ff]/60 mb-1">{correctCount}/{questions.length} correctas</p>
              <p className="text-xs text-[#e0e0ff]/40 mb-6">Tiempo: {formatTime(timer)}</p>
              <div className="flex justify-center gap-3">
                <NeonButton onClick={startQuiz} variant="primary" size="md"><RotateCcw size={14} /> Intentar de nuevo</NeonButton>
                <NeonButton onClick={() => setMode("menu")} variant="secondary" size="md">Volver al menú</NeonButton>
              </div>
            </GlassCard>

            <div className="space-y-2">
              {questions.map((q, i) => (
                <GlassCard key={q.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${answers[i] === q.correct ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {answers[i] === q.correct ? <Check size={12} /> : <X size={12} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#e0e0ff]">{q.question}</p>
                      <p className="text-[10px] text-[#e0e0ff]/30 mt-1">Correcta: {q.options[q.correct]}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
