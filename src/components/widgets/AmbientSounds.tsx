"use client";

import { useState, useRef, useEffect } from "react";
import { Headphones, Volume2, VolumeX } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useStore } from "@/lib/store/useStore";

const SOUNDS = [
  { id: "rain", name: "Lluvia", emoji: "🌧" }, { id: "forest", name: "Bosque", emoji: "🌲" },
  { id: "ocean", name: "Océano", emoji: "🌊" }, { id: "cafe", name: "Cafetería", emoji: "☕" },
  { id: "fire", name: "Chimenea", emoji: "🔥" }, { id: "whitenoise", name: "Ruido Blanco", emoji: "📻" },
];

function generateNoise(type: "brown" | "pink" | "white"): Float32Array {
  const sr = 44100, dur = 4, samples = sr * dur, buf = new Float32Array(samples);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < samples; i++) {
    const w = Math.random() * 2 - 1;
    if (type === "brown") { b0 = (b0 + 0.02 * w) / 1.02; buf[i] = b0 * 3.5; }
    else if (type === "pink") {
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      buf[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    } else { buf[i] = w * 0.3; }
  }
  return buf;
}

export default function AmbientSounds() {
  const { ambientSound, ambientVolume, setAmbientSound, setAmbientVolume } = useStore();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopSound = () => { try { srcRef.current?.stop(); } catch {} srcRef.current = null; setIsPlaying(false); };

  const playSound = (id: string) => {
    stopSound();
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)();
      const ctx = audioCtxRef.current; if (ctx.state === "suspended") ctx.resume();
      const nType = id === "whitenoise" ? "white" : id === "rain" || id === "ocean" ? "brown" : "pink";
      const noise = generateNoise(nType); const buf = ctx.createBuffer(1, noise.length, 44100);
      buf.getChannelData(0).set(noise); const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const gain = ctx.createGain(); gain.gain.value = ambientVolume;
      const filter = ctx.createBiquadFilter(); filter.type = "lowpass";
      filter.frequency.value = id === "ocean" ? 400 : id === "rain" ? 800 : id === "fire" ? 600 : 2000;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination); src.start();
      srcRef.current = src; gainRef.current = gain; setAmbientSound(id); setIsPlaying(true);
    } catch {}
  };

  useEffect(() => { if (gainRef.current) gainRef.current.gain.value = ambientVolume; }, [ambientVolume]);
  useEffect(() => () => stopSound(), []);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Headphones size={16} className="text-[#f472b6]" />
        <h2 className="text-lg font-bold gradient-neon">Sonidos Ambientales</h2>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {SOUNDS.map(s => (
          <button key={s.id} onClick={() => ambientSound === s.id && isPlaying ? stopSound() : playSound(s.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
              ambientSound === s.id && isPlaying ? "bg-[rgba(168,85,247,0.2)] border-[rgba(168,85,247,0.4)] shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "bg-[#12122a]/50 border-[rgba(168,85,247,0.1)] hover:border-[rgba(168,85,247,0.4)]"
            }`}>
            <span className="text-xl">{s.emoji}</span>
            <span className="text-[10px] text-[#e0e0ff]/70">{s.name}</span>
            {ambientSound === s.id && isPlaying && (
              <div className="flex gap-0.5">{[1, 2, 3].map(i => (
                <div key={i} className="w-0.5 bg-[#a855f7] rounded-full animate-pulse" style={{ height: `${6 + Math.random() * 8}px`, animationDelay: `${i * 0.15}s` }} />
              ))}</div>
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {isPlaying ? <Volume2 size={14} className="text-[#a855f7]" /> : <VolumeX size={14} className="text-[#e0e0ff]/30" />}
        <input type="range" min={0} max={1} step={0.01} value={ambientVolume} onChange={e => setAmbientVolume(parseFloat(e.target.value))}
          className="flex-1 h-1 appearance-none rounded-full bg-[#1a1a3e] accent-[#a855f7] cursor-pointer" />
        <span className="text-[10px] text-[#e0e0ff]/40 w-8 text-right">{Math.round(ambientVolume * 100)}%</span>
      </div>
    </GlassCard>
  );
}
