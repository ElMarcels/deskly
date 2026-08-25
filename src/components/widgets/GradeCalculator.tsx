"use client";

import { useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { useStore } from "@/lib/store/useStore";

export default function GradeCalculator() {
  const { grades, addGrade, removeGrade, updateGrade } = useStore();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [weight, setWeight] = useState("");

  const addEntry = () => {
    if (!name.trim() || !grade || !weight) return;
    addGrade({
      id: Date.now().toString(),
      name: name.trim(),
      grade: parseFloat(grade),
      weight: parseFloat(weight),
    });
    setName("");
    setGrade("");
    setWeight("");
  };

  const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
  const weightedAverage =
    totalWeight > 0
      ? grades.reduce((sum, g) => sum + g.grade * (g.weight / 100), 0) /
        (totalWeight / 100)
      : 0;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={16} className="text-neon-violet" />
        <h2 className="text-lg font-bold gradient-neon">Calculadora de Notas</h2>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-surface/50 border border-glass-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-neon-purple placeholder:text-foreground/30"
        />
        <input
          type="number"
          placeholder="Nota"
          min={0}
          max={5}
          step={0.1}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="w-16 bg-surface/50 border border-glass-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-neon-purple placeholder:text-foreground/30"
        />
        <input
          type="number"
          placeholder="%"
          min={0}
          max={100}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-14 bg-surface/50 border border-glass-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-neon-purple placeholder:text-foreground/30"
        />
        <NeonButton onClick={addEntry} variant="primary" size="sm">
          <Plus size={14} />
        </NeonButton>
      </div>

      {grades.length > 0 && (
        <div className="space-y-1.5 mb-3 max-h-36 overflow-auto">
          {grades.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-surface/50 border border-glass-border text-xs"
            >
              <span className="flex-1 text-foreground truncate">{g.name}</span>
              <span className="text-neon-purple font-mono font-bold">{g.grade}</span>
              <span className="text-foreground/40">({g.weight}%)</span>
              <button
                onClick={() => removeGrade(g.id)}
                className="text-red-400/50 hover:text-red-400 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-neon-purple/10 to-neon-magenta/10 border border-neon-purple/20">
        <span className="text-sm font-medium text-foreground/70">Promedio Ponderado</span>
        <span className="text-2xl font-bold neon-text font-mono">
          {weightedAverage.toFixed(2)}
        </span>
      </div>
      {totalWeight > 100 && (
        <p className="text-[10px] text-yellow-400 mt-2">
          ⚠ El peso total ({totalWeight}%) supera el 100%
        </p>
      )}
    </GlassCard>
  );
}
