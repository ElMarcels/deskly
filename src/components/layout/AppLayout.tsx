"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Zap, LayoutDashboard, User, Users, Radio, MessageCircle,
  CheckSquare, Music, Menu, X, LogOut, ChevronDown, ChevronUp, ShieldCheck, Wrench, Megaphone,
  LifeBuoy, ScrollText, Timer, Layers, Calculator, Settings2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/lib/store/useStore";
import SpotifyEmbed from "@/components/ui/SpotifyEmbed";
import { FOCUS_PLAYLISTS, getFocusPlaylist, loadFocusPlaylist, saveFocusPlaylist } from "@/lib/spotify";

const ADMIN_EMAIL = "mnartves@gmail.com";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/friends", label: "Amigos", icon: Users },
  { href: "/rooms", label: "Salas", icon: Radio },
  { href: "/messages", label: "Mensajes", icon: MessageCircle },
  { href: "/habits", label: "Habitos", icon: CheckSquare },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/notas", label: "Notas", icon: CheckSquare },
  { href: "/reglas", label: "Reglas", icon: ScrollText },
  { href: "/breaks", label: "Pausas", icon: Timer },
  { href: "/soporte", label: "Soporte", icon: LifeBuoy },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [spotifyOpen, setSpotifyOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem("deskly-focus-music-open");
      return stored === null ? true : stored === "1";
    } catch {
      return true;
    }
  });
  const [focusPlaylist, setFocusPlaylist] = useState<string>(() => loadFocusPlaylist());
  const [maintenance, setMaintenance] = useState(false);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string }[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const zenMode = useStore((s) => s.zenMode);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserEmail(data.user.email || "");
        setUserName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Usuario");
        const { data: profile } = await supabase
          .from("profiles")
          .select("banned, suspension_until")
          .eq("id", data.user.id)
          .single();
        const expired = profile?.suspension_until && new Date(profile.suspension_until).getTime() < Date.now();
        if (profile?.banned && !expired) {
          router.replace("/suspended");
          return;
        }
      } else {
        setUserEmail("usuario@deskly.app");
        setUserName("Usuario");
      }
    };
    loadUser();

    const loadGlobal = async () => {
      try {
        const { data: setting } = await supabase.from("app_settings").select("value").eq("key", "maintenance_mode").single();
        if (setting) setMaintenance(setting.value === "true");
      } catch {}
      try {
        const { data: anns } = await supabase.from("announcements").select("id, title, content").eq("active", true).order("created_at", { ascending: false });
        if (anns) setAnnouncements(anns || []);
      } catch {}
      try {
        const d = localStorage.getItem("deskly-announcements-dismiss");
        if (d) setDismissed(JSON.parse(d));
      } catch {}
    };
    loadGlobal();
  }, []);

  const dismissAnnouncement = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { localStorage.setItem("deskly-announcements-dismiss", JSON.stringify(next)); } catch {}
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen text-[#e0e0ff]" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {!zenMode && (
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 rounded-lg bg-[#12122a]/80 p-2 text-[#e0e0ff]/60 backdrop-blur-md border border-[rgba(168,85,247,0.2)] lg:hidden hover:text-[#a855f7] transition-colors cursor-pointer">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {!zenMode && sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {!zenMode && (
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
          {userEmail.toLowerCase() === ADMIN_EMAIL && (
            <Link key="/admin" href="/admin" onClick={() => setSidebarOpen(false)}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === "/admin" ? "bg-[rgba(239,68,68,0.15)] text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "text-[#e0e0ff]/50 hover:bg-[#1a1a3e]/50 hover:text-[#e0e0ff]/80 border border-transparent"}`}>
              <ShieldCheck size={18} className={`flex-shrink-0 transition-colors ${pathname === "/admin" ? "text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]" : "text-[#e0e0ff]/30 group-hover:text-[#e0e0ff]/60"}`} />
              <span>Admin</span>
              {pathname === "/admin" && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />}
            </Link>
          )}
        </nav>

        <div className="border-t border-[rgba(168,85,247,0.15)] px-3 py-3">
          <button onClick={() => { const next = !spotifyOpen; setSpotifyOpen(next); try { localStorage.setItem("deskly-focus-music-open", next ? "1" : "0"); } catch {} }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left hover:bg-[#1a1a3e]/50 transition-colors cursor-pointer group">
            <Music size={14} className="text-[#1db954]" />
            <span className="text-[10px] font-bold text-[#e0e0ff]/60 flex-1">Focus Music</span>
            {spotifyOpen ? <ChevronDown size={12} className="text-[#e0e0ff]/30" /> : <ChevronUp size={12} className="text-[#e0e0ff]/30" />}
          </button>
          {spotifyOpen && (
            <div className="mt-2">
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {FOCUS_PLAYLISTS.map(p => {
                  const active = focusPlaylist === p.id;
                  return (
                    <button key={p.id} onClick={() => { setFocusPlaylist(p.id); saveFocusPlaylist(p.id); }}
                      className={`text-left px-2.5 py-2 rounded-xl border transition-all cursor-pointer ${
                        active
                          ? `bg-[${p.color}]/15 border-[${p.color}]/50`
                          : "bg-[#12122a]/50 border-[rgba(168,85,247,0.1)] hover:border-[rgba(168,85,247,0.4)]"
                      }`}
                      style={active ? { borderColor: p.color + "80", background: p.color + "22" } : undefined}>
                      <span className={`block text-[10px] font-bold ${active ? "" : "text-[#e0e0ff]/50"}`} style={active ? { color: p.color } : undefined}>{p.name}</span>
                      <span className="block text-[9px] text-[#e0e0ff]/40 leading-tight mt-0.5">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-xl overflow-hidden border border-[rgba(168,85,247,0.1)] spotify-embed">
                <SpotifyEmbed playlistUrl={getFocusPlaylist(focusPlaylist).embed} height={352} title="Focus Music" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[rgba(168,85,247,0.15)] px-3 py-3">
          <Link href="/ajustes" onClick={() => setSidebarOpen(false)}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === "/ajustes" ? "bg-[rgba(168,85,247,0.15)] text-[#a855f7] border border-[rgba(168,85,247,0.3)] shadow-[0_0_15px_rgba(168,85,247,0.15)]" : "text-[#e0e0ff]/50 hover:bg-[#1a1a3e]/50 hover:text-[#e0e0ff]/80 border border-transparent"}`}>
            <Settings2 size={18} className={`flex-shrink-0 transition-colors ${pathname === "/ajustes" ? "text-[#a855f7] drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" : "text-[#e0e0ff]/30 group-hover:text-[#e0e0ff]/60"}`} />
            <span>Ajustes</span>
            {pathname === "/ajustes" && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.7)]" />}
          </Link>

          <div className="flex items-center gap-3 mt-3">
            <Link href="/profile" className="group flex items-center gap-3 flex-1 min-w-0 rounded-lg px-2 py-1.5 hover:bg-[#1a1a3e]/50 transition-colors" onClick={() => setSidebarOpen(false)}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a3e]/60 border border-[rgba(168,85,247,0.2)] shrink-0">
                <User size={18} className="text-[#e0e0ff]/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#e0e0ff] truncate">{userName}</p>
                <p className="text-[10px] text-[#e0e0ff]/40 truncate">{userEmail}</p>
              </div>
            </Link>
            <button onClick={handleLogout} className="rounded-lg p-2 text-[#e0e0ff]/30 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer" title="Cerrar sesion">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      )}

      <main className={`min-h-screen p-6 lg:p-8 ${zenMode ? "" : "lg:ml-64"}`}>
        {announcements.filter(a => !dismissed.includes(a.id)).map(a => (
          <div key={a.id} className="mb-4 flex items-start gap-3 p-3 rounded-xl bg-[rgba(168,85,247,0.12)] border border-[rgba(168,85,247,0.25)] animate-slide-up">
            <Megaphone size={16} className="text-[#a855f7] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#e0e0ff]">{a.title}</p>
              <p className="text-xs text-[#e0e0ff]/70 mt-0.5">{a.content}</p>
            </div>
            <button onClick={() => dismissAnnouncement(a.id)} className="p-1 rounded hover:bg-[#1a1a3e] text-[#e0e0ff]/40 hover:text-[#e0e0ff] cursor-pointer shrink-0"><X size={14} /></button>
          </div>
        ))}
        {children}
      </main>

      {maintenance && userEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase() && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a1a]/95 backdrop-blur-md p-6">
          <div className="text-center max-w-md">
            <Wrench size={44} className="mx-auto mb-4 text-[#a855f7]" />
            <h1 className="text-2xl font-bold text-[#e0e0ff] mb-2">Mantenimiento</h1>
            <p className="text-sm text-[#e0e0ff]/60">
              Estamos realizando tareas de mantenimiento. Vuelve en unos minutos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
