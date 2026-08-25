"use client";

import { useState, useRef, useEffect } from "react";
import { Headphones, Volume2, VolumeX, Play, Pause } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useStore } from "@/lib/store/useStore";

const SOUNDS = [
  { id: "rain", name: "Lluvia", emoji: "🌧" },
  { id: "forest", name: "Bosque", emoji: "🌲" },
  { id: "ocean", name: "Océano", emoji: "🌊" },
  { id: "cafe", name: "Cafetería", emoji: "☕" },
  { id: "fire", name: "Chimenea", emoji: "🔥" },
  { id: "whitenoise", name: "Ruido Blanco", emoji: "📻" },
];

function generateNoise(type: "brown" | "pink" | "white"): Float32Array {
  const sampleRate = 44100;
  const duration = 4;
  const samples = sampleRate * duration;
  const buffer = new Float32Array(samples);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < samples; i++) {
    const white = Math.random() * 2 - 1;
    if (type === "brown") {
      b0 = (b0 + 0.02 * white) / 1.02;
      buffer[i] = b0 * 3.5;
    } else if (type === "pink") {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      buffer[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else {
      buffer[i] = white * 0.3;
    }
  }
  return buffer;
}

export default function AmbientSounds() {
  const { ambientSound, ambientVolume, setAmbientSound, setAmbientVolume } =
    useStore();
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopSound = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playSound = (soundId: string) => {
    stopSound();

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      if (ctx.state === "suspended") ctx.resume();

      const noiseType =
        soundId === "whitenoise"
          ? "white"
          : soundId === "rain" || soundId === "ocean"
            ? "brown"
            : "pink";

      const noiseBuffer = generateNoise(noiseType);
      const audioBuffer = ctx.createBuffer(1, noiseBuffer.length, 44100);
      audioBuffer.getChannelData(0).set(noiseBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = ambientVolume;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value =
        soundId === "ocean" ? 400 : soundId === "rain" ? 800 : soundId === "fire" ? 600 : 2000;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();

      sourceRef.current = source;
      gainRef.current = gain;
      setAmbientSound(soundId);
      setIsPlaying(true);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = ambientVolume;
    }
  }, [ambientVolume]);

  useEffect(() => {
    return () => stopSound();
  }, []);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Headphones size={16} className="text-neon-pink" />
        <h2 className="text-lg font-bold gradient-neon">Sonidos Ambientales</h2>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {SOUNDS.map((sound) => (
          <button
            key={sound.id}
            onClick={() =>
              ambientSound === sound.id && isPlaying
                ? stopSound()
                : playSound(sound.id)
            }
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
              ambientSound === sound.id && isPlaying
                ? "bg-neon-purple/20 border-neon-purple/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                : "bg-surface/50 border-glass-border hover:border-glass-border-hover"
            }`}
          >
            <span className="text-xl">{sound.emoji}</span>
            <span className="text-[10px] text-foreground/70">{sound.name}</span>
            {ambientSound === sound.id && isPlaying && (
              <div className="flex gap-0.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-neon-purple rounded-full animate-pulse"
                    style={{
                      height: `${6 + Math.random() * 8}px`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {isPlaying ? (
          <Volume2 size={14} className="text-neon-purple" />
        ) : (
          <VolumeX size={14} className="text-foreground/30" />
        )}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={ambientVolume}
          onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
          className="flex-1 h-1 appearance-none rounded-full bg-surface-light accent-neon-purple cursor-pointer"
        />
        <span className="text-[10px] text-foreground/40 w-8 text-right">
          {Math.round(ambientVolume * 100)}%
        </span>
      </div>
    </GlassCard>
  );
}
