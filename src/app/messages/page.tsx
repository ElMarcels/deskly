"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { MessageCircle, Send, Search, Plus, Users, Trash2, X } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

interface Chat { id: string; name: string; lastMessage: string; time: string; unread: number; isGroup: boolean; online: boolean; }
interface Msg { id: string; sender: string; content: string; time: string; isMe: boolean; }

const STORAGE_CHATS = "deskly-chats";
const STORAGE_MESSAGES = "deskly-messages";

export default function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [allMessages, setAllMessages] = useState<Record<string, Msg[]>>({});
  const [newMsg, setNewMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatName, setNewChatName] = useState("");

  useEffect(() => {
    try { const c = localStorage.getItem(STORAGE_CHATS); if (c) setChats(JSON.parse(c)); } catch {}
    try { const m = localStorage.getItem(STORAGE_MESSAGES); if (m) setAllMessages(JSON.parse(m)); } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem(STORAGE_CHATS, JSON.stringify(chats)); } catch {} }, [chats]);
  useEffect(() => { try { localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(allMessages)); } catch {} }, [allMessages]);

  const messages = selectedChat ? (allMessages[selectedChat.id] || []) : [];

  const sendMessage = () => {
    if (!newMsg.trim() || !selectedChat) return;
    const msg: Msg = {
      id: Date.now().toString(), sender: "Tú", content: newMsg,
      time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }), isMe: true,
    };
    const updated = { ...allMessages, [selectedChat.id]: [...(allMessages[selectedChat.id] || []), msg] };
    setAllMessages(updated);
    setChats(chats.map(c => c.id === selectedChat.id ? { ...c, lastMessage: newMsg, time: "Ahora" } : c));
    setNewMsg("");
  };

  const createChat = () => {
    if (!newChatName.trim()) return;
    const chat: Chat = { id: Date.now().toString(), name: newChatName, lastMessage: "", time: "Ahora", unread: 0, isGroup: false, online: true };
    setChats([...chats, chat]);
    setNewChatName(""); setShowNewChat(false);
    setSelectedChat(chat);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(chats.filter(c => c.id !== id));
    const msgs = { ...allMessages }; delete msgs[id]; setAllMessages(msgs);
    if (selectedChat?.id === id) setSelectedChat(null);
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
                <div className="flex gap-2">
                  <input type="text" placeholder="Nombre del chat" value={newChatName} onChange={e => setNewChatName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && createChat()} autoFocus
                    className="flex-1 bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1.5 text-xs text-[#e0e0ff] outline-none" />
                  <NeonButton onClick={createChat} variant="primary" size="sm">Crear</NeonButton>
                  <button onClick={() => setShowNewChat(false)} className="text-[#e0e0ff]/30 hover:text-[#e0e0ff] cursor-pointer"><X size={14} /></button>
                </div>
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
                    <button onClick={(e) => deleteChat(chat.id, e)}
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
                  <div>
                    <p className="text-sm font-medium text-[#e0e0ff]">{selectedChat.name}</p>
                    <p className="text-[10px] text-[#e0e0ff]/30">{selectedChat.online ? "🟢 En línea" : "⚪ Desconectado"}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {messages.length === 0 && <p className="text-center text-[#e0e0ff]/20 text-xs py-8">Envía el primer mensaje</p>}
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.isMe ? "justify-end" : ""}`}>
                      <div className={`max-w-xs rounded-xl px-3 py-2 ${m.isMe ? "bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)]" : "bg-[#1a1a3e] border border-[rgba(168,85,247,0.1)]"}`}>
                        <p className="text-xs text-[#e0e0ff]">{m.content}</p>
                        <p className="text-[9px] text-[#e0e0ff]/20 mt-0.5 text-right">{m.time}</p>
                      </div>
                    </div>
                  ))}
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
    </AppLayout>
  );
}
