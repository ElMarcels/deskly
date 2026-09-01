"use client";

import { useState } from "react";
import { Calculator, Delete, Eraser, Plus, Minus, X as Multiply, Divide, History } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import GlassCard from "@/components/ui/GlassCard";

type Tok = number | string;
type OpFn = (a: number, b: number) => number;

const BINARY_OPS: Record<string, { prec: number; fn: OpFn }> = {
  "+": { prec: 1, fn: (a, b) => a + b },
  "−": { prec: 1, fn: (a, b) => a - b },
  "×": { prec: 2, fn: (a, b) => a * b },
  "÷": { prec: 2, fn: (a, b) => (b === 0 ? NaN : a / b) },
  "^": { prec: 3, fn: Math.pow },
  "√": { prec: 3, fn: (a, b) => Math.pow(b, 1 / a) },
};

const UNARY_FNS: Record<string, (x: number) => number> = {
  "sin(": (x) => Math.sin(x * Math.PI / 180),
  "cos(": (x) => Math.cos(x * Math.PI / 180),
  "tan(": (x) => Math.tan(x * Math.PI / 180),
  "asin(": (x) => Math.asin(x) * 180 / Math.PI,
  "acos(": (x) => Math.acos(x) * 180 / Math.PI,
  "atan(": (x) => Math.atan(x) * 180 / Math.PI,
  "log(": (x) => Math.log10(x),
  "ln(": (x) => Math.log(x),
  "sqrt(": (x) => Math.sqrt(x),
  "abs(": (x) => Math.abs(x),
  "exp(": (x) => Math.exp(x),
  "floor(": (x) => Math.floor(x),
  "ceil(": (x) => Math.ceil(x),
};

function tokenize(expr: string): Tok[] {
  const tokens: Tok[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      tokens.push(parseFloat(expr.slice(i, j)));
      i = j;
      continue;
    }
    // unary functions
    const fnNames = Object.keys(UNARY_FNS).sort((a, b) => b.length - a.length);
    const matched = fnNames.find(fn => expr.startsWith(fn, i));
    if (matched) { tokens.push(matched); i += matched.length; continue; }
    // two-char constants
    if (ch === "π") { tokens.push(Math.PI); i++; continue; }
    if (ch === "e" && expr[i + 1] !== "(") { tokens.push(Math.E); i++; continue; }
    if (BINARY_OPS[ch]) { tokens.push(ch); i++; continue; }
    if (ch === "(" || ch === ")" || ch === ",") { tokens.push(ch); i++; continue; }
    // unknown -> skip
    i++;
  }
  return tokens;
}

function shuntingYard(tokens: Tok[]): Tok[] {
  const output: Tok[] = [];
  const ops: string[] = [];
  for (const tok of tokens) {
    if (typeof tok === "number") { output.push(tok); continue; }
    if (tok === "(") { ops.push(tok); continue; }
    if (tok === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") output.push(ops.pop() as string);
      ops.pop(); // discard (
      continue;
    }
    if (UNARY_FNS[tok]) { ops.push(tok); continue; }
    if (tok === ",") {
      while (ops.length && ops[ops.length - 1] !== "(") output.push(ops.pop() as string);
      continue;
    }
    // binary operator
    const op = BINARY_OPS[tok];
    while (ops.length) {
      const top = ops[ops.length - 1];
      if (UNARY_FNS[top]) { output.push(ops.pop() as string); continue; }
      const topOp = BINARY_OPS[top];
      if (topOp && topOp.prec >= op.prec) { output.push(ops.pop() as string); continue; }
      break;
    }
    ops.push(tok);
  }
  while (ops.length) output.push(ops.pop() as string);
  return output;
}

function evalRPN(tokens: Tok[]): number {
  const stack: number[] = [];
  for (const tok of tokens) {
    if (typeof tok === "number") { stack.push(tok); continue; }
    if (UNARY_FNS[tok]) {
      const x = stack.pop();
      if (x === undefined) return NaN;
      stack.push(UNARY_FNS[tok](x));
      continue;
    }
    if (BINARY_OPS[tok]) {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return NaN;
      stack.push(BINARY_OPS[tok].fn(a, b));
    }
  }
  return stack[stack.length - 1] ?? NaN;
}

function countParens(expr: string): number {
  let count = 0;
  for (const ch of expr) if (ch === "(") count++;
  return count;
}

export default function CalculatorPage() {
  const [expr, setExpr] = useState("0");
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [error, setError] = useState("");
  const [degreeMode, setDegreeMode] = useState(true);

  const pressSymbol = (s: string) => {
    setError("");
    if (expr === "0" && !/[0-9.πe(]/.test(s)) setExpr(s);
    else setExpr(expr + s);
  };
  const clear = () => { setExpr("0"); setError(""); };
  const backspace = () => {
    setError("");
    if (expr.length <= 1) setExpr("0");
    else setExpr(expr.slice(0, -1));
  };

  const evaluate = () => {
    setError("");
    try {
      const nonParen = expr.replace(/[()]/g, "");
      if (/[a-zA-Z]/.test(nonParen.replace(/sin|cos|tan|asin|acos|atan|log|ln|sqrt|abs|exp|floor|ceil/g, ""))) {
        setError("Expresión no válida"); return;
      }
      if (countParens(expr) > 0) { setError("Paréntesis sin cerrar"); return; }
      const result = evalRPN(shuntingYard(tokenize(expr)));
      if (Number.isNaN(result) || !Number.isFinite(result)) { setError("Resultado no definido"); return; }
      const rounded = Math.round(result * 1e10) / 1e10;
      const resultStr = String(rounded);
      setHistory(h => [{ expr, result: resultStr }, ...h].slice(0, 20));
      setExpr(resultStr);
    } catch {
      setError("Error al calcular");
    }
  };

  const sciLen = "aspect-[3/2]";
  const btnCls = "rounded-xl p-2 text-sm font-semibold text-[#e0e0ff] bg-[#1a1a3e] border border-[rgba(168,85,247,0.15)] hover:border-[#a855f7]/60 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)] transition-all cursor-pointer flex items-center justify-center";
  const fnBtn = `${btnCls} bg-[#12122a] text-[#06b6d4]`;
  const opBtn = `${btnCls} bg-[rgba(168,85,247,0.15)] text-[#a855f7]`;
  const eqBtn = `rounded-xl p-2 text-sm font-bold text-white bg-gradient-to-r from-[#a855f7] to-[#ec4899] hover:brightness-110 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer flex items-center justify-center`;

  const sciButtons: { label: string; action: string; cls: string }[] = [
    { label: "sin", action: "sin(", cls: fnBtn },
    { label: "cos", action: "cos(", cls: fnBtn },
    { label: "tan", action: "tan(", cls: fnBtn },
    { label: "π", action: "π", cls: fnBtn },
    { label: "log", action: "log(", cls: fnBtn },
    { label: "ln", action: "ln(", cls: fnBtn },
    { label: "√", action: "√", cls: fnBtn },
    { label: "^", action: "^", cls: btnCls },
    { label: "asin", action: "asin(", cls: fnBtn },
    { label: "acos", action: "acos(", cls: fnBtn },
    { label: "atan", action: "atan(", cls: fnBtn },
    { label: "e", action: "e", cls: fnBtn },
    { label: "abs", action: "abs(", cls: fnBtn },
    { label: "exp", action: "exp(", cls: fnBtn },
    { label: "floor", action: "floor(", cls: fnBtn },
    { label: "ceil", action: "ceil(", cls: fnBtn },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold gradient-neon flex items-center gap-2 mb-5"><Calculator size={24} /> Calculadora Científica</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setDegreeMode(!degreeMode)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${degreeMode ? "bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/40" : "bg-[#1a1a3e] text-[#e0e0ff]/40 border border-[rgba(168,85,247,0.2)]"}`}>
                  DEG {degreeMode ? "✓" : ""}
                </button>
              </div>
              <button onClick={clear} className="p-2 rounded-lg hover:bg-red-500/20 text-[#e0e0ff]/40 hover:text-red-400 cursor-pointer"><Eraser size={16} /></button>
            </div>

            <div className={`rounded-xl mb-4 p-4 text-right bg-[#0d0d1f] border border-[rgba(168,85,247,0.25)] ${sciLen}`}>
              <p className="text-3xl font-mono font-bold neon-text break-all">{expr}</p>
              {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {sciButtons.map((b, i) => (
                <button key={i} className={b.cls} onClick={() => pressSymbol(b.action)}>{b.label}</button>
              ))}
              <button className={fnBtn} onClick={() => pressSymbol("(")}>(</button>
              <button className={fnBtn} onClick={() => pressSymbol(")")}>)</button>
              <button className={opBtn} onClick={() => pressSymbol("÷")} aria-label="dividir"><Divide size={16} /></button>
              <button className={opBtn} onClick={() => pressSymbol("×")} aria-label="multiplicar"><Multiply size={16} /></button>
              <button className={opBtn} onClick={() => pressSymbol("−")} aria-label="restar"><Minus size={16} /></button>
              <button className={opBtn} onClick={() => pressSymbol("+")} aria-label="sumar"><Plus size={16} /></button>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-2">
              {["7", "8", "9", "C"].map((k, i) => (
                <button key={i} className={btnCls} onClick={() => k === "C" ? clear() : pressSymbol(k)}>{k}</button>
              ))}
              {["4", "5", "6", "AC"].map((k, i) => (
                <button key={i} className={btnCls} onClick={() => k === "AC" ? clear() : pressSymbol(k)}>{k}</button>
              ))}
              {["1", "2", "3", "⌫"].map((k, i) => (
                <button key={i} className={btnCls} onClick={() => k === "⌫" ? backspace() : pressSymbol(k)}>{k}</button>
              ))}
              {["0", ".", "00", "="].map((k, i) => (
                <button key={i} className={k === "=" ? eqBtn : btnCls} onClick={() => k === "=" ? evaluate() : pressSymbol(k)}>
                  {k === "=" && <span className="text-xl">=</span>}
                  {k === "⌫" && <Delete size={16} />}
                  {k !== "=" && k !== "⌫" && k}
                </button>
              ))}
            </div>
          </GlassCard>

          <div className="space-y-4">
            <GlassCard className="p-5">
              <h2 className="text-lg font-bold gradient-neon flex items-center gap-2 mb-3"><History size={16} /> Historial</h2>
              {history.length === 0 ? (
                <p className="text-[#e0e0ff]/30 text-sm py-4">Realiza cálculos para ver el historial</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} onClick={() => setExpr(h.result)}
                      className="p-2.5 rounded-lg bg-[#12122a]/50 border border-[rgba(168,85,247,0.1)] hover:border-[#a855f7]/40 cursor-pointer transition-colors">
                      <p className="text-[10px] text-[#e0e0ff]/40">{h.expr}</p>
                      <p className="text-sm font-mono text-[#a855f7]">{h.result}</p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-5">
              <h3 className="text-sm font-bold text-[#e0e0ff] mb-3">Funciones disponibles</h3>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-[#e0e0ff]/60">
                <p>sin, cos, tan (grados)</p>
                <p>asin, acos, atan</p>
                <p>log (base 10), ln</p>
                <p>sqrt, abs, exp</p>
                <p>floor, ceil, ^ (potencia)</p>
                <p>El modo DEG activo hace que las razones trigonométricas usen grados</p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
