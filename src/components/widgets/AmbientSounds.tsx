"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Headphones, Volume2, VolumeX, Pause, Play, Sparkles } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useStore } from "@/lib/store/useStore";

const SOUNDS = [
  { id: "rain", name: "Lluvia", emoji: "🌧" }, { id: "forest", name: "Bosque", emoji: "🌲" },
  { id: "ocean", name: "Océano", emoji: "🌊" }, { id: "cafe", name: "Cafetería", emoji: "☕" },
  { id: "fire", name: "Chimenea", emoji: "🔥" }, { id: "whitenoise", name: "Ruido Blanco", emoji: "📻" },
];

const PRESETS = [
  { id: "lluvia_noche", name: "Lluvia nocturna", icon: "🌧", layers: { rain: 0.5, fire: 0.25 } },
  { id: "bosque_rio", name: "Bosque sereno", icon: "🌲", layers: { forest: 0.5, ocean: 0.25 } },
  { id: "cafe_lluvia", name: "Café atemporal", icon: "☕", layers: { cafe: 0.4, rain: 0.2 } },
  { id: "todo_off", name: "Silencio", icon: "🔇", layers: {} },
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
  const { ambientLayers, setAmbientLayer, setAmbientVolumeAll } = useStore();
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<Record<string, { src: AudioBufferSourceNode; gain: GainNode }>>({});
  const [muted, setMuted] = useState(false);

  const rebuild = useCallback((layers: Record<string, number>) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      Object.keys(nodesRef.current).forEach(id => {
        if (!(id in layers)) {
          try { nodesRef.current[id].src.stop(); } catch {}
          delete nodesRef.current[id];
        }
      });

      Object.entries(layers).forEach(([id, vol]) => {
        if (nodesRef.current[id]) {
          nodesRef.current[id].gain.gain.value = vol;
          return;
        }
        const nType = id === "whitenoise" ? "white" : id === "rain" || id === "ocean" ? "brown" : "pink";
        const noise = generateNoise(nType);
        const buf = ctx.createBuffer(1, noise.length, 44100);
        buf.getChannelData(0).set(noise);
        const src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const gain = ctx.createGain(); gain.gain.value = vol;
        const filter = ctx.createBiquadFilter(); filter.type = "lowpass";
        filter.frequency.value = id === "ocean" ? 400 : id === "rain" ? 800 : id === "fire" ? 600 : 2000;
        src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
        src.start();
        nodesRef.current[id] = { src, gain };
      });
    } catch {}
  }, []);

  useEffect(() => { rebuild(ambientLayers); }, [ambientLayers, rebuild]);
  useEffect(() => () => { try { Object.values(nodesRef.current).forEach(n => n.src.stop()); } catch {} }, []);

  const toggleSound = (id: string) => {
    if (id in ambientLayers) setAmbientLayer(id, 0);
    else setAmbientLayer(id, 0.3);
  };

  const applyPreset = (preset: { layers: Record<string, number> }) => {
    setMuted(false);
    const current = { ...ambientLayers };
    Object.keys(current).forEach(k => delete current[k]);
    Object.entries(preset.layers).forEach(([k, v]) => { current[k] = v; });
    useStore.setState({ ambientLayers: current });
    localStorage.setItem("deskly-ambient-layers", JSON.stringify(current));
  };

  const anyActive = Object.keys(ambientLayers).length > 0;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Headphones size={16} className="text-[#f472b6]" />
        <h2 className="text-lg font-bold gradient-neon">Soundscapes</h2>
        {anyActive && (
          <button onClick={() => { setMuted(!muted); }}>
            {muted ? <Play size={16} className="text-[#a855f7]" /> : <Pause size={16} className="text-[#a855f7]" />}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <Sparkles size={14} className="text-[#f59e0b] mr-1" />
        {PRESETS.map(p => {
          const isActive = !muted && Object.keys(p.layers).length > 0 &&
            Object.keys(p.layers).every(k => k in ambientLayers) && Object.keys(ambientLayers).length === Object.keys(p.layers).length;
          return (
            <button key={p.id} onClick={() => applyPreset(p)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                isActive ? "bg-[rgba(245,158,11,0.2)] text-[#f59e0b] border border-[rgba(245,158,11,0.4)]" : "bg-[#12122a]/60 text-[#e0e0ff]/60 border border-[rgba(168,85,247,0.15)] hover:border-[rgba(168,85,247,0.4)]"
              }`}>
              <span className="mr-1">{p.icon}</span>{p.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {SOUNDS.map(s => {
          const vol = ambientLayers[s.id] ?? 0;
          const isOn = vol > 0 && !muted;
          return (
            <button key={s.id} onClick={() => toggleSound(s.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                isOn ? "bg-[rgba(168,85,247,0.2)] border-[rgba(168,85,247,0.45)] shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "bg-[#12122a]/50 border-[rgba(168,85,247,0.1)] hover:border-[rgba(168,85,247,0.4)]"
              }`}>
              <span className="text-xl">{s.emoji}</span>
              <span className="text-[10px] text-[#e0e0ff]/70">{s.name}</span>
              {isOn && (
                <div className="flex gap-0.5">{[1, 2, 3].map(i => (
                  <div key={i} className="w-0.5 bg-[#a855f7] rounded-full animate-pulse" style={{ height: `${6 + ((vol * 8) % 8)}px`, animationDelay: `${i * 0.15}s` }} />
                ))}</div>
              )}
              {isOn && (
                <input type="range" min={0} max={1} step={0.01} value={vol}
                  onClick={e => e.stopPropagation()}
                  onChange={e => { e.stopPropagation(); setAmbientLayer(s.id, parseFloat(e.target.value)); }}
                  className="w-full h-1 appearance-none rounded-full bg-[#1a1a3e] accent-[#a855f7] cursor-pointer" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {anyActive ? <Volume2 size={14} className="text-[#a855f7]" /> : <VolumeX size={14} className="text-[#e0e0ff]/30" />}
        <input type="range" min={0} max={1} step={0.01}
          value={Object.values(ambientLayers)[0] ?? 0.3}
          onChange={e => setAmbientVolumeAll(parseFloat(e.target.value))}
          className="flex-1 h-1 appearance-none rounded-full bg-[#1a1a3e] accent-[#a855f7] cursor-pointer" />
        <span className="text-[10px] text-[#e0e0ff]/40 w-8 text-right">
          {Math.round((Object.values(ambientLayers)[0] ?? 0.3) * 100)}%
        </span>
      </div>
    </GlassCard>
  );
}
