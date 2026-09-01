"use client";

import { useEffect, useState } from "react";
import { Music } from "lucide-react";
import SpotifyEmbed from "@/components/ui/SpotifyEmbed";
import { FOCUS_PLAYLISTS, getFocusPlaylist, loadFocusPlaylist, saveFocusPlaylist } from "@/lib/spotify";

export default function SpotifyWidget() {
  const [playlistId, setPlaylistId] = useState<string>("lofi");

  useEffect(() => {
    setPlaylistId(loadFocusPlaylist());
  }, []);

  useEffect(() => {
    saveFocusPlaylist(playlistId);
  }, [playlistId]);

  const playlist = getFocusPlaylist(playlistId);

  return (
    <div className="rounded-2xl p-3 bg-[rgba(18,18,42,0.6)] backdrop-blur-xl border border-[rgba(168,85,247,0.15)]">
      <div className="flex items-center gap-2 mb-2">
        <Music size={12} className="text-[#a855f7]" />
        <span className="text-[10px] font-bold gradient-neon">Focus Music</span>
      </div>
      <div className="flex gap-1.5 mb-2">
        {FOCUS_PLAYLISTS.map((p) => {
          const active = playlistId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPlaylistId(p.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                active ? "border-[rgba(168,85,247,0.4)] bg-[rgba(168,85,247,0.15)] text-[#e0e0ff]" : "border-[rgba(168,85,247,0.1)] bg-[#12122a]/50 text-[#e0e0ff]/50 hover:text-[#e0e0ff]"
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>
      <SpotifyEmbed playlistUrl={playlist.embed} height={120} title="Focus Music" />
    </div>
  );
}