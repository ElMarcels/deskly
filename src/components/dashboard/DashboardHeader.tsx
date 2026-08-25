"use client";

import { Moon, Sun, Zap, LogOut, User } from "lucide-react";
import NeonButton from "@/components/ui/NeonButton";
import { useStore } from "@/lib/store/useStore";

export default function DashboardHeader() {
  const { zenMode, toggleZenMode } = useStore();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-glass-border bg-surface/30 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Zap size={28} className="text-neon-purple" />
          <div className="absolute inset-0 blur-md">
            <Zap size={28} className="text-neon-purple opacity-50" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">
            <span className="gradient-neon">Deskly</span>
          </h1>
          <p className="text-[10px] text-foreground/40 -mt-0.5">Dashboard de Estudio</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NeonButton
          onClick={toggleZenMode}
          variant={zenMode ? "primary" : "ghost"}
          size="sm"
          className="text-xs"
        >
          {zenMode ? (
            <>
              <Sun size={14} />
              Salir Zen
            </>
          ) : (
            <>
              <Moon size={14} />
              Modo Zen
            </>
          )}
        </NeonButton>

        <div className="w-px h-6 bg-glass-border" />

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-light transition-colors text-foreground/60 hover:text-foreground text-xs cursor-pointer">
          <User size={14} />
        </button>
      </div>
    </header>
  );
}
