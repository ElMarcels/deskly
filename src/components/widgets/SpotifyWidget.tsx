"use client";

import GlassCard from "@/components/ui/GlassCard";
import { Music } from "lucide-react";

const SPOTIFY_PLAYLIST_URL =
  "https://open.spotify.com/embed/playlist/37i9dQZF1DWYoYGBbGKurt?utm_source=generator&theme=0";

export default function SpotifyWidget() {
  return (
    <GlassCard className="p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <Music size={16} className="text-neon-purple" />
        <h2 className="text-sm font-bold gradient-neon">Música Focus</h2>
      </div>
      <div className="rounded-xl overflow-hidden border border-glass-border">
        <iframe
          src={SPOTIFY_PLAYLIST_URL}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl"
          title="Spotify Player - Focus Playlist"
        />
      </div>
    </GlassCard>
  );
}
