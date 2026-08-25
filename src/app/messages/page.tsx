"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { MessageCircle, Send, Search, Plus, Users, Circle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";

interface Chat { id: string; name: string; lastMessage: string; time: string; unread: number; isGroup: boolean; online: boolean; }
interface Msg { id: string; sender: string; content: string; time: string; isMe: boolean; }

const MOCK_CHATS: Chat[] = [
  { id: "1", name: "María García", lastMessage: "¿Terminaste el ejercicio de cálculo?", time: "14:32", unread: 2, isGroup: false, online: true },
  { id: "2", name: "Grupo Física III", lastMessage: "Pedro: Voy a subir los apuntes", time: "13:15", unread: 5, isGroup: true, online: true },
  { id: "3", name: "Carlos López", lastMessage: "Gracias por la nota!", time: "Ayer", unread: 0, isGroup: false, online: false },
  { id: "4", name: "Ana Martínez", lastMessage: "Nos vemos en la sala de estudio", time: "Ayer", unread: 0, isGroup: false, online: true },
];

const MOCK_MSGS: Msg[] = [
  { id: "1", sender: "María", content: "¿Terminaste el ejercicio de cálculo?", time: "14:32", isMe: false },
  { id: "2", sender: "Tú", content: "Casi! Me falta la integral", time: "14:33", isMe: true },
  { id: "3", sender: "María", content: "Te ayudo? Es la del número 3, ¿no?", time: "14:34", isMe: false },
  { id: "4", sender: "Tú", content: "Sí! Esa misma. No entiendo cómo cambiar los límites", time: "14:35", isMe: true },
  { id: "5", sender: "María", content: "Te mando una foto de mis apuntes 📸", time: "14:36", isMe: false },
];

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(MOCK_CHATS[0]);
  const [messages, setMessages] = useState<Msg[]>(MOCK_MSGS);
  const [newMsg, setNewMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const sendMessage = () => {
    if (!newMsg.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), sender: "Tú", content: newMsg, time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }), isMe: true }]);
    setNewMsg("");
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-12 gap-4 h-full">
          <div className="col-span-4 glass-card p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold gradient-neon">Mensajes</h2>
              <button className="p-1.5 rounded-lg hover:bg-[#1a1a3e] text-[#a855f7] cursor-pointer"><Plus size={16} /></button>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e0e0ff]/20" />
              <input type="text" placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#12122a] border border-[rgba(168,85,247,0.15)] rounded-lg pl-9 pr-3 py-2 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7]/50 placeholder:text-[#e0e0ff]/20" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {MOCK_CHATS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
                <button key={chat.id} onClick={() => setSelectedChat(chat)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${selectedChat?.id === chat.id ? "bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.2)]" : "hover:bg-[#1a1a3e]/50 border border-transparent"}`}>
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
                    <p className="text-[10px] text-[#e0e0ff]/40 truncate mt-0.5">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && <span className="w-5 h-5 rounded-full bg-[#a855f7] text-[9px] font-bold flex items-center justify-center text-white flex-shrink-0">{chat.unread}</span>}
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
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.isMe ? "justify-end" : ""}`}>
                      <div className={`max-w-xs rounded-xl px-3 py-2 ${m.isMe ? "bg-[rgba(168,85,247,0.2)] border border-[rgba(168,85,247,0.3)]" : "bg-[#1a1a3e] border border-[rgba(168,85,247,0.1)]"}`}>
                        {!m.isMe && <p className="text-[10px] text-[#a855f7] mb-0.5">{m.sender}</p>}
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
