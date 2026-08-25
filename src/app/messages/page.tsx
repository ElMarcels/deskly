"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { MessageCircle, Send, Search, Plus, Users, Trash2, X, UserPlus } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import { supabase } from "@/lib/supabase/client";

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  isGroup: boolean;
  online: boolean;
  otherUserId?: string;
}
interface Msg {
  id: string;
  sender: string;
  senderId: string;
  content: string;
  time: string;
  isMe: boolean;
}
interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [isGroupCreation, setIsGroupCreation] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const formatTime = (t: string) => {
    try {
      const d = new Date(t);
      return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    } catch { return t; }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchChats = async () => {
      const { data: groups } = await supabase
        .from("message_groups")
        .select("id, name, created_by")
        .in("id", (await supabase.from("message_group_members").select("group_id").eq("user_id", userId)).data?.map(m => m.group_id) || []);

      const { data: dmMessages } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .is("group_id", null)
        .order("created_at", { ascending: false });

      const chatMap = new Map<string, Chat>();

      if (dmMessages) {
        const seen = new Set<string>();
        for (const msg of dmMessages) {
          const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
          if (!otherId || seen.has(otherId)) continue;
          seen.add(otherId);

          const { data: profile } = await supabase.from("profiles").select("username, display_name").eq("id", otherId).single();

          chatMap.set(otherId, {
            id: otherId,
            name: profile?.display_name || profile?.username || "Usuario",
            lastMessage: msg.content,
            time: formatTime(msg.created_at),
            unread: 0,
            isGroup: false,
            online: true,
            otherUserId: otherId,
          });
        }
      }

      if (groups) {
        for (const group of groups) {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("group_id", group.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          chatMap.set(group.id, {
            id: group.id,
            name: group.name,
            lastMessage: lastMsg?.content || "",
            time: lastMsg ? formatTime(lastMsg.created_at) : "",
            unread: 0,
            isGroup: true,
            online: false,
          });
        }
      }

      setChats(Array.from(chatMap.values()));
    };

    fetchChats();

    const channel = supabase
      .channel("messages-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => fetchChats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    if (!selectedChat || !userId) return;

    const fetchMessages = async () => {
      let query;
      if (selectedChat.isGroup) {
        query = supabase.from("messages").select("id, sender_id, content, created_at").eq("group_id", selectedChat.id);
      } else {
        query = supabase.from("messages").select("id, sender_id, content, created_at")
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${selectedChat.otherUserId}),and(sender_id.eq.${selectedChat.otherUserId},receiver_id.eq.${userId})`);
      }

      const { data } = await query.order("created_at", { ascending: true });
      if (!data) return;

      const senderIds = [...new Set(data.map(m => m.sender_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, username, display_name").in("id", senderIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      setMessages(data.map(m => {
        const profile = profileMap.get(m.sender_id);
        return {
          id: m.id,
          sender: profile?.display_name || profile?.username || "Usuario",
          senderId: m.sender_id,
          content: m.content,
          time: formatTime(m.created_at),
          isMe: m.sender_id === userId,
        };
      }));
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${selectedChat.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => fetchMessages())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedChat, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedChat || !userId) return;
    setNewMsg("");

    const payload: Record<string, unknown> = {
      sender_id: userId,
      content: newMsg,
      message_type: "text",
    };

    if (selectedChat.isGroup) {
      payload.group_id = selectedChat.id;
    } else {
      payload.receiver_id = selectedChat.otherUserId;
    }

    await supabase.from("messages").insert(payload);
  };

  const searchUsers = async (q: string) => {
    setUserSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq("id", userId)
      .limit(5);
    setSearchResults(data || []);
  };

  const startDM = async (profile: Profile) => {
    setSelectedChat({
      id: profile.id,
      name: profile.display_name || profile.username,
      lastMessage: "",
      time: "",
      unread: 0,
      isGroup: false,
      online: true,
      otherUserId: profile.id,
    });
    setShowNewChat(false);
    setUserSearch("");
    setSearchResults([]);
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !userId || selectedMembers.length === 0) return;

    const { data: group } = await supabase.from("message_groups")
      .insert({ name: newGroupName, created_by: userId })
      .select()
      .single();

    if (group) {
      const members = [{ group_id: group.id, user_id: userId }, ...selectedMembers.map(m => ({ group_id: group.id, user_id: m.id }))];
      await supabase.from("message_group_members").insert(members);

      setSelectedChat({
        id: group.id,
        name: group.name,
        lastMessage: "",
        time: "",
        unread: 0,
        isGroup: true,
        online: false,
      });
      setNewGroupName("");
      setSelectedMembers([]);
      setShowNewChat(false);
      setIsGroupCreation(false);
    }
  };

  const inviteToGroup = async (profile: Profile) => {
    if (!selectedChat?.isGroup) return;
    await supabase.from("message_group_members").insert({ group_id: selectedChat.id, user_id: profile.id });
    setShowInvite(false);
    setUserSearch("");
    setSearchResults([]);
  };

  const deleteChat = async (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    if (chat.isGroup && userId) {
      await supabase.from("message_group_members").delete().eq("group_id", chat.id).eq("user_id", userId);
    }
    setChats(chats.filter(c => c.id !== chat.id));
    if (selectedChat?.id === chat.id) setSelectedChat(null);
  };

  const filteredChats = chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-12 gap-4 h-full">
          <div className="col-span-4 glass-card p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold gradient-neon">Mensajes</h2>
              <button onClick={() => setShowNewChat(true)} className="p-1.5 rounded-lg hover:bg-[#1a1a3e] text-[#a855f7] cursor-pointer"><Plus size={16} /></button>
            </div>

            {showNewChat && (
              <div className="mb-3 p-3 rounded-xl bg-[#12122a] border border-[rgba(168,85,247,0.2)] animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-[#e0e0ff]/60">Nuevo chat</p>
                  <button onClick={() => { setShowNewChat(false); setIsGroupCreation(false); setSelectedMembers([]); setNewGroupName(""); }} className="text-[#e0e0ff]/30 hover:text-[#e0e0ff] cursor-pointer"><X size={14} /></button>
                </div>
                {!isGroupCreation ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="text" placeholder="Buscar usuario..." value={userSearch} onChange={e => searchUsers(e.target.value)}
                        className="flex-1 bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1.5 text-xs text-[#e0e0ff] outline-none" />
                      <NeonButton onClick={() => setIsGroupCreation(true)} variant="secondary" size="sm"><Users size={12} /></NeonButton>
                    </div>
                    {searchResults.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {searchResults.map(p => (
                          <button key={p.id} onClick={() => startDM(p)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#1a1a3e] text-left cursor-pointer">
                            <span className="text-xs">👤</span>
                            <span className="text-[10px] text-[#e0e0ff]">{p.display_name || p.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input type="text" placeholder="Nombre del grupo" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                      className="w-full bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1.5 text-xs text-[#e0e0ff] outline-none" />
                    <input type="text" placeholder="Buscar miembros..." value={userSearch} onChange={e => searchUsers(e.target.value)}
                      className="w-full bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1.5 text-xs text-[#e0e0ff] outline-none" />
                    {selectedMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedMembers.map(m => (
                          <span key={m.id} className="px-2 py-0.5 rounded-full bg-[#a855f7]/20 text-[9px] text-[#a855f7]">
                            {m.display_name || m.username}
                            <button onClick={() => setSelectedMembers(selectedMembers.filter(x => x.id !== m.id))} className="ml-1 cursor-pointer">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    {searchResults.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {searchResults.map(p => (
                          <button key={p.id} onClick={() => { if (!selectedMembers.find(m => m.id === p.id)) setSelectedMembers([...selectedMembers, p]); }}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#1a1a3e] text-left cursor-pointer">
                            <span className="text-xs">👤</span>
                            <span className="text-[10px] text-[#e0e0ff]">{p.display_name || p.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <NeonButton onClick={createGroup} variant="primary" size="sm" disabled={!newGroupName.trim() || selectedMembers.length === 0}>Crear Grupo</NeonButton>
                  </div>
                )}
              </div>
            )}

            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e0e0ff]/20" />
              <input type="text" placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.15)] rounded-lg pl-9 pr-3 py-2 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7]/50 placeholder:text-[#e0e0ff]/20" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredChats.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle size={32} className="mx-auto text-[#e0e0ff]/10 mb-2" />
                  <p className="text-[10px] text-[#e0e0ff]/20">{chats.length === 0 ? "No hay conversaciones" : "Sin resultados"}</p>
                </div>
              )}
              {filteredChats.map(chat => (
                <button key={chat.id} onClick={() => setSelectedChat(chat)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer group ${selectedChat?.id === chat.id ? "bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.2)]" : "hover:bg-[#1a1a3e]/50 border border-transparent"}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-[#1a1a3e] border border-[rgba(168,85,247,0.15)] flex items-center justify-center text-sm">
                      {chat.isGroup ? <Users size={16} className="text-[#e0e0ff]/40" /> : "👤"}
                    </div>
                    {chat.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a1a]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-[#e0e0ff] truncate">{chat.name}</p>
                      <span className="text-[9px] text-[#e0e0ff]/30 flex-shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-[10px] text-[#e0e0ff]/40 truncate mt-0.5">{chat.lastMessage || "Sin mensajes"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {chat.unread > 0 && <span className="w-5 h-5 rounded-full bg-[#a855f7] text-[9px] font-bold flex items-center justify-center text-white">{chat.unread}</span>}
                    <button onClick={(e) => deleteChat(chat, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-[#e0e0ff]/20 hover:text-red-400 transition-all cursor-pointer">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-8 glass-card p-4 flex flex-col">
            {selectedChat ? (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-[rgba(168,85,247,0.1)]">
                  <div className="w-9 h-9 rounded-xl bg-[#1a1a3e] border border-[rgba(168,85,247,0.15)] flex items-center justify-center text-sm">
                    {selectedChat.isGroup ? <Users size={16} className="text-[#e0e0ff]/40" /> : "👤"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#e0e0ff]">{selectedChat.name}</p>
                    <p className="text-[10px] text-[#e0e0ff]/30">{selectedChat.isGroup ? "Grupo" : selectedChat.online ? "🟢 En línea" : "⚪ Desconectado"}</p>
                  </div>
                  {selectedChat.isGroup && (
                    <button onClick={() => setShowInvite(true)} className="p-1.5 rounded-lg hover:bg-[#1a1a3e] text-[#a855f7] cursor-pointer"><UserPlus size={14} /></button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {messages.length === 0 && <p className="text-center text-[#e0e0ff]/20 text-xs py-8">Envía el primer mensaje</p>}
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.isMe ? "justify-end" : ""}`}>
                      <div className={`max-w-xs rounded-xl px-3 py-2 ${m.isMe ? "bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)]" : "bg-[#1a1a3e] border border-[rgba(168,85,247,0.1)]"}`}>
                        {!m.isMe && selectedChat.isGroup && <p className="text-[9px] text-[#a855f7] mb-0.5">{m.sender}</p>}
                        <p className="text-xs text-[#e0e0ff]">{m.content}</p>
                        <p className="text-[9px] text-[#e0e0ff]/20 mt-0.5 text-right">{m.time}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-2 pt-2 border-t border-[rgba(168,85,247,0.1)]">
                  <input type="text" placeholder="Escribe un mensaje..." value={newMsg} onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    className="flex-1 bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-xl px-4 py-2.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/20" />
                  <NeonButton onClick={sendMessage} variant="primary" size="md"><Send size={16} /></NeonButton>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle size={48} className="mx-auto text-[#e0e0ff]/10 mb-4" />
                  <p className="text-sm text-[#e0e0ff]/30">Selecciona una conversación</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvite && selectedChat?.isGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="p-5 w-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#e0e0ff]">Invitar al grupo</h3>
              <button onClick={() => { setShowInvite(false); setUserSearch(""); setSearchResults([]); }} className="text-[#e0e0ff]/30 hover:text-[#e0e0ff] cursor-pointer"><X size={16} /></button>
            </div>
            <input type="text" placeholder="Buscar usuario..." value={userSearch} onChange={e => searchUsers(e.target.value)}
              className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-2 text-xs text-[#e0e0ff] outline-none mb-3" />
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.length === 0 && <p className="text-[10px] text-[#e0e0ff]/30 text-center py-4">Busca un usuario para invitar</p>}
              {searchResults.map(p => (
                <button key={p.id} onClick={() => inviteToGroup(p)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[#1a1a3e] text-left cursor-pointer">
                  <span className="text-xs">👤</span>
                  <span className="text-[10px] text-[#e0e0ff]">{p.display_name || p.username}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </AppLayout>
  );
}
