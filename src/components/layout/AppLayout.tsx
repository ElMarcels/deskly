"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Zap, LayoutDashboard, User, Users, Radio, MessageCircle,
  CheckSquare, Brain, Calendar, Clock, FileQuestion, Menu, X, LogOut,
} from "lucide-react";
import SpotifyWidget from "@/components/widgets/SpotifyWidget";
import { supabase } from "@/lib/supabase/client";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/friends", label: "Amigos", icon: Users },
  { href: "/rooms", label: "Salas", icon: Radio },
  { href: "/messages", label: "Mensajes", icon: MessageCircle },
  { href: "/habits", label: "Hábitos", icon: CheckSquare },
  { href: "/flashcards", label: "Flashcards", icon: Brain },
  { href: "/routines", label: "Rutinas", icon: Calendar },
  { href: "/schedule", label: "Horario", icon: Clock },
  { href: "/exam", label: "Examen", icon: FileQuestion },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserEmail(data.user.email || "");
        setUserName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Usuario");
      } else {
        setUserEmail("usuario@deskly.app");
        setUserName("Usuario");
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-[#e0e0ff]">
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-[#12122a]/80 p-2 text-[#e0e0ff]/60 backdrop-blur-md border border-[rgba(168,85,247,0.2)] lg:hidden hover:text-[#a855f7] transition-colors cursor-pointer">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col bg-[#12122a]/70 border-r border-[rgba(168,85,247,0.15)] backdrop-blur-xl transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex items-center gap-3 border-b border-[rgba(168,85,247,0.15)] px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)] shadow-[0_0_12px_rgba(168,85,247,0.25)]">
            <Zap size={20} className="text-[#a855f7]" />
          </div>
          <span className="text-xl font-bold tracking-tight gradient-neon">Deskly</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? "bg-[rgba(168,85,247,0.15)] text-[#a855f7] border border-[rgba(168,85,247,0.3)] shadow-[0_0_15px_rgba(168,85,247,0.15)]" : "text-[#e0e0ff]/50 hover:bg-[#1a1a3e]/50 hover:text-[#e0e0ff]/80 border border-transparent"}`}>
                <Icon size={18} className={`flex-shrink-0 transition-colors ${isActive ? "text-[#a855f7] drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" : "text-[#e0e0ff]/30 group-hover:text-[#e0e0ff]/60"}`} />
                <span>{link.label}</span>
                {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.7)]" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[rgba(168,85,247,0.15)] px-3 py-3">
          <SpotifyWidget />
        </div>

        <div className="border-t border-[rgba(168,85,247,0.15)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a3e]/60 border border-[rgba(168,85,247,0.2)]">
              <User size={18} className="text-[#e0e0ff]/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#e0e0ff] truncate">{userName}</p>
              <p className="text-[10px] text-[#e0e0ff]/40 truncate">{userEmail}</p>
            </div>
            <button onClick={handleLogout} className="rounded-lg p-2 text-[#e0e0ff]/30 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer" title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen p-6 lg:p-8">{children}</main>
    </div>
  );
}
