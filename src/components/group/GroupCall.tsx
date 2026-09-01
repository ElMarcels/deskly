"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  PhoneOff, Mic, MicOff, Video, VideoOff, Users, Send, Maximize2, Minimize2,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type SignalType = "join" | "leave" | "offer" | "answer" | "ice" | "chat";

interface SignalRow {
  id: string;
  group_id: string;
  sender_id: string;
  target_id: string | null;
  message_type: SignalType;
  sdp: string | null;
  ice_candidate: string | null;
  content: string | null;
  created_at: string;
}

interface Participant {
  id: string;
  name: string;
  stream: MediaStream;
}

interface CallChatMsg {
  id: string;
  sender: string;
  content: string;
  isMe: boolean;
  time: string;
}

interface Props {
  groupId: string;
  groupName: string;
  onClose: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function GroupCall({ groupId, groupName, onClose }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Yo");

  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [mutedOthers, setMutedOthers] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const [chatMessages, setChatMessages] = useState<CallChatMsg[]>([]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const processingRef = useRef<Set<string>>(new Set());

  const stopAll = useCallback(() => {
    peersRef.current.forEach(pc => { try { pc.close(); } catch {} });
    peersRef.current.clear();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    channelRef.current && supabase.removeChannel(channelRef.current);
    setParticipants([]);
  }, []);

  const sendSignal = useCallback(async (type: SignalType, payload?: { targetId?: string; sdp?: string; ice?: string; content?: string }) => {
    if (!userId) return;
    const insert: Record<string, unknown> = {
      group_id: groupId,
      sender_id: userId,
      message_type: type,
      sdp: payload?.sdp ?? null,
      ice_candidate: payload?.ice ?? null,
      content: payload?.content ?? null,
    };
    if (payload?.targetId) insert.target_id = payload.targetId;
    await supabase.from("group_call_signaling").insert(insert);
  }, [groupId, userId]);

  const createPeer = useCallback(async (remoteId: string): Promise<RTCPeerConnection> => {
    if (peersRef.current.has(remoteId)) return peersRef.current.get(remoteId)!;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(remoteId, pc);

    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal("ice", { targetId: remoteId, ice: JSON.stringify(e.candidate) });
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal("offer", { targetId: remoteId, sdp: JSON.stringify(pc.localDescription) });
      } catch {}
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!stream) return;
      setParticipants(prev => {
        const existing = prev.find(p => p.id === remoteId);
        if (existing) {
          existing.stream = stream;
          return [...prev];
        }
        return [...prev, { id: remoteId, name: `Usuario ${remoteId.slice(0, 4)}`, stream }];
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        setParticipants(prev => prev.filter(p => p.id !== remoteId));
        peersRef.current.delete(remoteId);
      }
    };

    return pc;
  }, [localStreamRef, sendSignal]);

  const handleSignal = useCallback(async (signal: SignalRow) => {
    if (!userId || signal.sender_id === userId) return;
    if (processingRef.current.has(signal.id)) return;
    processingRef.current.add(signal.id);

    if (signal.message_type === "join") {
      const pc = await createPeer(signal.sender_id);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal("offer", { targetId: signal.sender_id, sdp: JSON.stringify(pc.localDescription) });
      } catch {}
    } else if (signal.message_type === "leave") {
      const pc = peersRef.current.get(signal.sender_id);
      if (pc) { try { pc.close(); } catch {} peersRef.current.delete(signal.sender_id); }
      setParticipants(prev => prev.filter(p => p.id !== signal.sender_id));
    } else if (signal.message_type === "offer") {
      if (signal.sdp) {
        const pc = await createPeer(signal.sender_id);
        try {
          await pc.setRemoteDescription(JSON.parse(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal("answer", { targetId: signal.sender_id, sdp: JSON.stringify(pc.localDescription) });
        } catch {}
      }
    } else if (signal.message_type === "answer") {
      if (signal.sdp) {
        const pc = peersRef.current.get(signal.sender_id);
        if (pc && pc.remoteDescription === null) {
          try { await pc.setRemoteDescription(JSON.parse(signal.sdp)); } catch {}
        }
      }
    } else if (signal.message_type === "ice") {
      if (signal.ice_candidate) {
        const pc = peersRef.current.get(signal.sender_id);
        if (pc) {
          try { await pc.addIceCandidate(JSON.parse(signal.ice_candidate)); } catch {}
        }
      }
    } else if (signal.message_type === "chat") {
      const chatContent = signal.content;
      if (chatContent) {
        const name = signal.sender_id === userId ? "Yo" : "Usuario";
        const newMsg: CallChatMsg = {
          id: signal.id,
          sender: name,
          content: chatContent,
          isMe: false,
          time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        };
        setChatMessages(prev => [...prev, newMsg]);
      }
    }
  }, [userId, createPeer, sendSignal]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;
      setUserId(data.user.id);
      setUserName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Yo");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
        setParticipants(prev => [{ id: data.user!.id, name: "Tú", stream }, ...prev]);

        const channel = supabase
          .channel(`call-${groupId}`)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_call_signaling" }, (payload) => {
            handleSignal(payload.new as SignalRow);
          })
          .subscribe();
        channelRef.current = channel;

        await supabase.from("group_call_signaling").insert({ group_id: groupId, sender_id: data.user.id, message_type: "join" });
      } catch {
        // No se pudo acceder a cámara/micrófono
      }
    })();
    return () => {
      cancelled = true;
      stopAll();
    };
  }, [groupId, handleSignal, stopAll]);

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(), sender: userName, content: chatMsg, isMe: true,
      time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    }]);
    sendSignal("chat", { content: chatMsg });
    setChatMsg("");
  };

  const toggleAudio = () => {
    const next = !audioOn;
    setAudioOn(next);
    localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = next);
  };
  const toggleVideo = () => {
    const next = !videoOn;
    setVideoOn(next);
    localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = next);
  };

  const endCall = () => {
    if (userId) sendSignal("leave", {});
    stopAll();
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[300] bg-black/90 backdrop-blur-lg ${fullscreen ? "" : "flex items-center justify-center p-4"}`}>
      <div className={`relative w-full rounded-2xl overflow-hidden border border-[rgba(168,85,247,0.3)] shadow-[0_0_40px_rgba(168,85,247,0.3)] ${fullscreen ? "h-full" : "max-w-3xl h-[80vh]"}`} style={{ background: "var(--bg)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(168,85,247,0.15)]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm font-bold text-[#e0e0ff]">Llamada: {groupName}</p>
            <span className="text-[10px] text-[#e0e0ff]/40">{participants.length} participantes</span>
          </div>
          <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/50 hover:text-[#e0e0ff] cursor-pointer">
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        <div className={`grid gap-3 p-4 ${fullscreen ? "" : "h-[calc(80vh-4rem)]"} grid-cols-2 ${participants.length + 1 <= 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          <div className="relative rounded-xl overflow-hidden bg-[#0d0d1f] border border-[rgba(168,85,247,0.2)]">
            <video ref={localVideoRef} muted playsInline autoPlay className="w-full h-full object-cover" />
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white">Tú{videoOn ? "" : " (cámara off)"}</span>
          </div>
          {participants.filter(p => p.id !== userId).map(p => (
            <div key={p.id} className="relative rounded-xl overflow-hidden bg-[#0d0d1f] border border-[rgba(168,85,247,0.2)]">
              <video ref={el => { if (el) { el.srcObject = p.stream; el.play().catch(() => {}); } }} muted={mutedOthers} playsInline autoPlay className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white">{p.name}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-[rgba(168,85,247,0.15)] px-4 py-3 bg-[#0d0d1f]/60">
          <div className="flex items-center justify-center gap-3">
            <button onClick={toggleAudio} title={audioOn ? "Silenciar micrófono" : "Activar micrófono"}
              className={`p-3 rounded-full cursor-pointer transition-colors ${audioOn ? "bg-[#1a1a3e] text-[#e0e0ff]" : "bg-red-500/30 text-red-400"}`}>
              {audioOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button onClick={toggleVideo} title={videoOn ? "Apagar cámara" : "Encender cámara"}
              className={`p-3 rounded-full cursor-pointer transition-colors ${videoOn ? "bg-[#1a1a3e] text-[#e0e0ff]" : "bg-red-500/30 text-red-400"}`}>
              {videoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <button onClick={() => setMutedOthers(!mutedOthers)} title="Silenciar a los demás"
              className={`p-3 rounded-full cursor-pointer transition-colors ${mutedOthers ? "bg-[#a855f7]/40 text-[#a855f7]" : "bg-[#1a1a3e] text-[#e0e0ff]"}`}>
              <Users size={18} />
            </button>
            <button onClick={endCall} className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 cursor-pointer transition-colors">
              <PhoneOff size={18} />
            </button>
          </div>

          <div className="mt-3 border-t border-[rgba(168,85,247,0.1)] pt-3">
            <div className="h-32 overflow-y-auto space-y-2 mb-2 pr-1">
              {chatMessages.length === 0 && <p className="text-center text-[#e0e0ff]/20 text-[10px] py-4">Chat de la llamada</p>}
              {chatMessages.map(m => (
                <div key={m.id} className={`flex ${m.isMe ? "justify-end" : ""}`}>
                  <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 ${m.isMe ? "bg-[rgba(168,85,247,0.3)] border border-[rgba(168,85,247,0.4)]" : "bg-[#1a1a3e] border border-[rgba(168,85,247,0.1)]"}`}>
                    <p className="text-[9px] text-[#a855f7]">{m.sender}</p>
                    <p className="text-xs text-[#e0e0ff]">{m.content}</p>
                    <p className="text-[8px] text-[#e0e0ff]/30 text-right">{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Escribe en el chat de la llamada..." value={chatMsg}
                onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()}
                className="flex-1 bg-[#12122a] border border-[rgba(168,85,247,0.2)] rounded-lg px-3 py-1.5 text-xs text-[#e0e0ff] outline-none focus:border-[#a855f7] placeholder:text-[#e0e0ff]/25" />
              <button onClick={sendChat} className="p-2 rounded-lg bg-[#a855f7]/20 text-[#a855f7] hover:bg-[#a855f7]/30 cursor-pointer transition-colors"><Send size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
