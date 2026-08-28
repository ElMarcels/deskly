"use client";

import { useEffect, useState } from "react";
import { Ban, LogOut, LifeBuoy } from "lucide-react";
import NeonButton from "@/components/ui/NeonButton";
import GlassCard from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase/client";

export default function SuspendedPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a] px-4">
      <GlassCard className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
          <Ban size={32} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#e0e0ff] mb-2">Cuenta suspendida</h1>
        <p className="text-sm text-[#e0e0ff]/60 mb-6">
          Tu cuenta ha sido suspendida. No puedes acceder a Deskly en este momento.
          Si crees que se trata de un error, ponte en contacto con soporte.
        </p>
        <div className="flex flex-col gap-2">
          <NeonButton variant="secondary" onClick={() => window.open("mailto:soporte@deskly.app", "_self")}>
            <LifeBuoy size={16} /> Contactar con soporte
          </NeonButton>
          <NeonButton variant="ghost" onClick={handleLogout}>
            <LogOut size={16} /> Salir
          </NeonButton>
        </div>
      </GlassCard>
    </div>
  );
}
