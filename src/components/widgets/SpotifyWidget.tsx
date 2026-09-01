"use client";

import { Music, Play, Square } from "lucide-react";
import { FOCUS_PLAYLISTS } from "@/lib/spotify";
import { useStore } from "@/lib/store/useStore";

export default function SpotifyWidget() {
  const musicPlaying = useStore((s) => s.musicPlaying);
  const setMusicPlaying = useStore((s) => s.setMusicPlaying);
  const focusPlaylistId = useStore((s) => s.focusPlaylistId);
  const setFocusPlaylistId = useStore((s) => s.setFocusPlaylistId);

  return (
    <div className="rounded-2xl p-4 bg-[rgba(18,18,42,0.6)] backdrop-blur-xl border border-[rgba(168,85,247,0.15)]">
      <div className="flex items-center gap-2 mb-3">
        <Music size={14} className="text-[#1db954]" />
        <span className="text-xs font-bold gradient-neon">Focus Music</span>
        {musicPlaying && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-[#1db954]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1db954] animate-pulse" />
            Sonando
          </span>
        )}
      </div>

      <div className="space-y-2 mb-3">
        {FOCUS_PLAYLISTS.map((p) => {
          const active = focusPlaylistId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setFocusPlaylistId(p.id)}
              className={`w-full flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                active
                  ? "border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.12)]"
                  : "border-[rgba(168,85,247,0.1)] bg-[#12122a]/50 hover:border-[rgba(168,85,247,0.35)]"
              }`}
              style={active ? { borderColor: p.color + "80", background: p.color + "18" } : undefined}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                style={{ background: p.color + "22", color: p.color }}
              >
                {p.name[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-[#e0e0ff] truncate">{p.name}</span>
                <span className="block text-[10px] text-[#e0e0ff]/40 truncate">{p.desc}</span>
              </span>
              {active && <span className="text-xs text-[#e0e0ff]/40 shrink-0">✓</span>}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setMusicPlaying(!musicPlaying)}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          musicPlaying
            ? "bg-[#1a1a3e] text-[#e0e0ff]/80 border border-[rgba(168,85,247,0.2)] hover:text-[#e0e0ff]"
            : "bg-[#1db954] text-white hover:brightness-110"
        }`}
      >
        {musicPlaying ? <Square size={14} /> : <Play size={14} />}
        {musicPlaying ? "Detener" : "Reproducir"}
      </button>

      <p className="text-[9px] text-[#e0e0ff]/30 mt-2">
        La música seguirá sonando mientras navegas por la plataforma.
      </p>
    </div>
  );
}