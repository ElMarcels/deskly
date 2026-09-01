"use client";

import { X, Music } from "lucide-react";
import SpotifyEmbed from "@/components/ui/SpotifyEmbed";
import { getFocusPlaylist } from "@/lib/spotify";
import { useStore } from "@/lib/store/useStore";

export default function GlobalMusicPlayer() {
  const musicPlaying = useStore((s) => s.musicPlaying);
  const setMusicPlaying = useStore((s) => s.setMusicPlaying);
  const focusPlaylistId = useStore((s) => s.focusPlaylistId);

  if (!musicPlaying) return null;

  const playlist = getFocusPlaylist(focusPlaylistId);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] w-[min(500px,calc(100vw-2rem))]">
      <div className="rounded-2xl border border-[rgba(168,85,247,0.3)] bg-[#12122a] p-3 shadow-[0_0_30px_rgba(168,85,247,0.3)] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Music size={14} className="text-[#1db954] shrink-0" />
            <span className="text-[10px] font-bold text-[#e0e0ff]/70 truncate">Focus Music — {playlist.name}</span>
          </div>
          <button
            onClick={() => setMusicPlaying(false)}
            className="p-1 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/40 hover:text-[#e0e0ff] transition-colors cursor-pointer shrink-0 ml-2"
            title="Ocultar reproductor"
          >
            <X size={14} />
          </button>
        </div>
        <SpotifyEmbed playlistUrl={playlist.embed} height={352} title="Focus Music" />
      </div>
    </div>
  );
}