"use client";

import { Music } from "lucide-react";

const SPOTIFY_PLAYLIST_URL = "https://open.spotify.com/embed/playlist/37i9dQZF1DWYoYGBbGKurt?utm_source=generator&theme=0";

export default function SpotifyWidget() {
  return (
    <div className="rounded-2xl p-3 bg-[rgba(18,18,42,0.6)] backdrop-blur-xl border border-[rgba(168,85,247,0.15)]">
      <div className="flex items-center gap-2 mb-2">
        <Music size={12} className="text-[#a855f7]" />
        <span className="text-[10px] font-bold gradient-neon">Focus Music</span>
      </div>
      <div className="rounded-xl overflow-hidden border border-[rgba(168,85,247,0.1)]">
        <iframe src={SPOTIFY_PLAYLIST_URL} width="100%" height="120" frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"
          className="rounded-xl" title="Spotify Player" />
      </div>
    </div>
  );
}
