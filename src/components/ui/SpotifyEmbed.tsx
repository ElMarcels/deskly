"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music, ExternalLink, RefreshCw } from "lucide-react";

interface SpotifyEmbedProps {
  playlistUrl: string;
  height?: number;
  title?: string;
  loadTimeout?: number;
}

export default function SpotifyEmbed({
  playlistUrl,
  height = 352,
  title = "Spotify Player",
  loadTimeout = 12000,
}: SpotifyEmbedProps) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setFailed(false);
    clearTimer();
    timerRef.current = setTimeout(() => {
      setFailed(true);
    }, loadTimeout);
    return clearTimer;
  }, [attempt, loadTimeout, clearTimer]);

  const handleLoad = useCallback(() => {
    clearTimer();
    setFailed(false);
  }, [clearTimer]);

  const retry = useCallback(() => {
    setAttempt((a) => a + 1);
  }, []);

  const directUrl = playlistUrl.replace("/embed/", "/");

  return (
    <div className="relative rounded-xl overflow-hidden border border-[rgba(168,85,247,0.1)] bg-[#12122a]">
      <iframe
        key={attempt}
        src={playlistUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        onLoad={handleLoad}
        title={title}
        className="rounded-xl block"
      />
      {failed && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#12122a] p-4 text-center">
          <Music size={24} className="text-[#1db954]" />
          <p className="text-xs text-[#e0e0ff]/70">No se pudo cargar el reproductor</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1db954] text-white text-xs font-semibold hover:brightness-110 transition-all"
            >
              <ExternalLink size={12} /> Abrir en Spotify
            </a>
            <button
              onClick={retry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a3e] text-[#e0e0ff]/70 text-xs border border-[rgba(168,85,247,0.2)] hover:text-[#e0e0ff] transition-all cursor-pointer"
            >
              <RefreshCw size={12} /> Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}