"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Zap, LayoutDashboard, User, Users, Radio, MessageCircle,
  CheckSquare, Music, Menu, X, LogOut, ChevronDown, ChevronUp, ShieldCheck, Wrench, Megaphone,
  Sun, Moon, LifeBuoy, ScrollText, Timer, Layers, Calculator, Palette,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useStore } from "@/lib/store/useStore";
import { ACCENTS, PRESETS } from "@/lib/theme";

const ADMIN_EMAIL = "mnartves@gmail.com";

const FOCUS_PLAYLISTS = [
  {
    id: "lofi",
    name: "Lo-Fi Relajante",
    desc: "Vibes tranquilas para concentrarte",
    color: "#a855f7",
    embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DWYoYGBbGKurt?utm_source=generator&theme=0",
  },
  {
    id: "academia",
    name: "Dark Academia",
    desc: "Clásicos y ambient para estudiar",
    color: "#ec4899",
    embed: "https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI2TtZa6?utm_source=generator&theme=0",
  },
];

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
  const [spotifyOpen, setSpotifyOpen] = useState(true);
  const [focusPlaylist, setFocusPlaylist] = useState("lofi");
  const [maintenance, setMaintenance] = useState(false);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string }[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const accent = useStore((s) => s.accent);
  const setAccent = useStore((s) => s.setAccent);
  const preset = useStore((s) => s.preset);
  const setPreset = useStore((s) => s.setPreset);
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
          <button onClick={() => setSpotifyOpen(!spotifyOpen)}
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
                    <button key={p.id} onClick={() => setFocusPlaylist(p.id)}
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
                <iframe
                  src={FOCUS_PLAYLISTS.find(p => p.id === focusPlaylist)?.embed}
                  width="100%" height="352" frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl" title="Spotify Player"
                  style={{ borderRadius: "0.75rem" }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[rgba(168,85,247,0.15)] px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Palette size={14} className="text-[#e0e0ff]/40" />
              <span className="text-[10px] font-bold text-[#e0e0ff]/50 uppercase tracking-wider">Tema</span>
            </div>
            <button onClick={toggleTheme} title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
              className="p-2 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/60 hover:text-[#e0e0ff] cursor-pointer transition-colors">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {PRESETS.map(p => {
              const active = preset.id === p.id;
              const colors = p[theme];
              return (
                <button key={p.id} onClick={() => setPreset(p)} title={p.name}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 border cursor-pointer transition-all ${
                    active ? "border-[var(--accent)] bg-[rgba(var(--accent-rgb),0.12)]" : "border-[rgba(168,85,247,0.1)] hover:border-[rgba(168,85,247,0.4)]"
                  }`}>
                  <span className="text-base leading-none">{p.icon}</span>
                  <span className="text-[8px] font-semibold text-[#e0e0ff]/60 truncate w-full text-center">{p.name}</span>
                  <div className="flex w-full gap-0.5 mt-0.5">
                    <span className="w-3 h-1.5 rounded-sm" style={{ background: colors.bg }} />
                    <span className="w-3 h-1.5 rounded-sm" style={{ background: accent.color }} />
                    <span className="w-3 h-1.5 rounded-sm" style={{ background: colors.surfaceSolid }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            {ACCENTS.slice(0, 7).map(a => (
              <button key={a.name} onClick={() => setAccent(a)} title={a.name}
                className={`w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110 ${accent.name === a.name ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[#12122a]" : ""}`}
                style={{ background: a.color }} />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1a3e]/60 border border-[rgba(168,85,247,0.2)]">
              <User size={18} className="text-[#e0e0ff]/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#e0e0ff] truncate">{userName}</p>
              <p className="text-[10px] text-[#e0e0ff]/40 truncate">{userEmail}</p>
            </div>
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
