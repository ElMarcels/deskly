"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { ShieldCheck, Users, Mail, Calendar } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { supabase } from "@/lib/supabase/client";

const ADMIN_EMAIL = "mnartves@gmail.com";

interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  daily_study_goal: number;
  created_at: string;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email?.toLowerCase() || "";
      setIsAdmin(email === ADMIN_EMAIL.toLowerCase());
      setLoadingAuth(false);
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setError("");
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, avatar_url, daily_study_goal, created_at")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setUsers(data || []);
      }
      setLoadingUsers(false);
    };
    fetchUsers();
  }, [isAdmin]);

  if (loadingAuth) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center py-20 text-[#e0e0ff]/40 text-sm">
          Cargando...
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <GlassCard className="p-8 text-center">
            <ShieldCheck size={40} className="mx-auto mb-3 text-red-400/60" />
            <h1 className="text-xl font-bold text-[#e0e0ff]">Acceso denegado</h1>
            <p className="text-xs text-[#e0e0ff]/40 mt-2">
              No tienes permisos para acceder a este panel.
            </p>
          </GlassCard>
        </div>
      </AppLayout>
    );
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold gradient-neon flex items-center gap-2">
            <ShieldCheck size={24} /> Panel de Administración
          </h1>
          <p className="text-xs text-[#e0e0ff]/40 mt-1">Acceso exclusivo · {ADMIN_EMAIL}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-4 text-center">
            <Users size={20} className="mx-auto mb-1 text-[#a855f7]" />
            <p className="text-2xl font-bold neon-text">{users.length}</p>
            <p className="text-[10px] text-[#e0e0ff]/40 mt-1">Usuarios registrados</p>
          </GlassCard>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            Error cargando usuarios: {error}
          </div>
        )}

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#e0e0ff]">Todos los usuarios</h3>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-64 bg-[#12122a] border border-[rgba(168,85,247,0.3)] rounded-lg px-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20"
            />
          </div>

          {loadingUsers ? (
            <p className="text-center py-8 text-[#e0e0ff]/40 text-sm">Cargando usuarios...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] text-[#e0e0ff]/40 font-medium pb-3 pr-4">Usuario</th>
                    <th className="text-left text-[10px] text-[#e0e0ff]/40 font-medium pb-3 pr-4">
                      <span className="flex items-center gap-1"><Mail size={10} /> Email</span>
                    </th>
                    <th className="text-left text-[10px] text-[#e0e0ff]/40 font-medium pb-3 pr-4">Meta diaria</th>
                    <th className="text-left text-[10px] text-[#e0e0ff]/40 font-medium pb-3">
                      <span className="flex items-center gap-1"><Calendar size={10} /> Registrado</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-[#e0e0ff]/30 text-sm">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ) : (
                    filtered.map(u => (
                      <tr key={u.id} className="border-t border-[rgba(168,85,247,0.05)]">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] flex items-center justify-center text-[#a855f7] text-xs font-bold">
                              {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-[#e0e0ff]">
                              {u.full_name || u.email?.split("@")[0] || "Sin nombre"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-[#e0e0ff]/60">{u.email}</td>
                        <td className="py-3 pr-4 text-xs text-[#e0e0ff]/60">{u.daily_study_goal}h</td>
                        <td className="py-3 text-xs text-[#e0e0ff]/40">{formatDate(u.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </AppLayout>
  );
}
