"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Zap } from "lucide-react";
import NeonButton from "@/components/ui/NeonButton";
import GlassCard from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "register";
  onToggleMode: () => void;
}

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (uid) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("banned")
            .eq("id", uid)
            .single();
          if (profile?.banned) {
            window.location.href = "/suspended";
            return;
          }
        }
      }
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-magenta/10 rounded-full blur-[150px]" />
      </div>

      <GlassCard className="w-full max-w-md p-8 relative" glow>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <Zap size={36} className="text-neon-purple" />
            <div className="absolute inset-0 blur-lg">
              <Zap size={36} className="text-neon-purple opacity-50" />
            </div>
          </div>
          <h1 className="text-3xl font-black gradient-neon">Deskly</h1>
        </div>

        <h2 className="text-center text-foreground/70 text-sm mb-6">
          {mode === "login" ? "Inicia sesión en tu cuenta" : "Crea tu cuenta"}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center animate-slide-up">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface/50 border border-glass-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground outline-none focus:border-neon-purple transition-colors placeholder:text-foreground/30"
            />
          </div>

          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-surface/50 border border-glass-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground outline-none focus:border-neon-purple transition-colors placeholder:text-foreground/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <NeonButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "Cargando..."
              : mode === "login"
                ? "Iniciar Sesión"
                : "Crear Cuenta"}
          </NeonButton>
        </form>

        <p className="text-center text-xs text-foreground/40 mt-6">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            onClick={onToggleMode}
            className="text-neon-purple hover:text-neon-pink transition-colors font-medium cursor-pointer"
          >
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </GlassCard>
    </div>
  );
}
