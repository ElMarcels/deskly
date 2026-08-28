"use client";

import { useEffect, useState } from "react";
import { Ban, LogOut, Zap } from "lucide-react";
import NeonButton from "@/components/ui/NeonButton";
import GlassCard from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase/client";

export default function SuspendedPage() {
  const [checking, setChecking] = useState(true);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("suspension_reason")
        .eq("id", data.user.id)
        .single();
      setReason(profile?.suspension_reason || null);
      setChecking(false);
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
        <p className="text-sm text-[#e0e0ff]/40">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a] px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08),transparent_60%)]" />
      <GlassCard className="w-full max-w-md p-8 text-center relative">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/15 border border-red-500/40 shadow-[0_0_35px_rgba(239,68,68,0.3)]">
          <Ban size={38} className="text-red-400" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)]">
            <Zap size={12} className="text-[#a855f7]" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-[#e0e0ff]/70">DESKLY</span>
        </div>

        <h1 className="text-3xl font-bold text-[#e0e0ff] mb-3">Cuenta suspendida</h1>
        <div className="h-px w-16 mx-auto my-4 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent" />
        <p className="text-sm leading-relaxed text-[#e0e0ff]/60 mb-3">
          Tu cuenta ha sido suspendida y ya no tienes acceso a Deskly.
          Esta medida se toma cuando se incumplen las normas de la plataforma
          o se detecta actividad inapropiada.
        </p>
        {reason ? (
          <div className="my-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-left">
            <p className="text-xs font-bold text-red-400 mb-1">Motivo de la suspensión</p>
            <p className="text-sm text-[#e0e0ff]/80">{reason}</p>
          </div>
        ) : (
          <div className="my-5 p-4 rounded-xl bg-[#12122a]/60 border border-[rgba(168,85,247,0.15)] text-left">
            <p className="text-xs text-[#e0e0ff]/50">
              El acceso a tu cuenta seguirá bloqueado hasta que se resuelva esta situación.
              Todos los datos asociados a tu cuenta están deshabilitados durante este periodo.
            </p>
          </div>
        )}

        <NeonButton variant="ghost" onClick={handleLogout} className="w-full">
          <LogOut size={16} /> Salir
        </NeonButton>
      </GlassCard>
    </div>
  );
}
