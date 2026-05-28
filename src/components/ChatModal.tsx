"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

type OtherUser = { id: string; username: string | null; avatar_url: string | null; verified: boolean };
type Conversation = {
  id: string;
  other_user: OtherUser;
  latest_message?: { content: string | null; image_url: string | null; created_at: string; sender_id: string } | null;
};
type Message = {
  id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  sender: { username: string | null; avatar_url: string | null } | null;
};

function Avatar({ user, size = 36 }: { user: { username?: string | null; avatar_url?: string | null }; size?: number }) {
  const ini = (user.username?.[0] ?? "?").toUpperCase();
  return (
    <div
      className="rounded-xl flex-shrink-0 flex items-center justify-center font-bold overflow-hidden"
      style={{ width: size, height: size, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: GOLD, fontSize: size * 0.4 }}
    >
      {user.avatar_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
        : ini}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path fill="#1d9bf0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"/>
      <path fill="#fff" d="M16.9 9.3 10.9 15.3l-3.8-3.8 1.4-1.4 2.4 2.4 4.6-4.6z"/>
    </svg>
  );
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

export function ChatModal({ onClose, initialUsername, onConvDeleted }: {
  onClose: () => void;
  initialUsername?: string;
  onConvDeleted?: (id: string) => void;
}) {
  const [myId, setMyId]                     = useState<string | null>(null);
  const [view, setView]                     = useState<"list" | "thread">(initialUsername ? "thread" : "list");
  const [conversations, setConversations]   = useState<Conversation[]>([]);
  const [activeConv, setActiveConv]         = useState<Conversation | null>(null);
  const [messages, setMessages]             = useState<Message[]>([]);
  const [input, setInput]                   = useState("");
  const [sending, setSending]               = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [listLoading, setListLoading]       = useState(true);
  const [msgLoading, setMsgLoading]         = useState(false);
  const [error, setError]                   = useState("");
  const [imgPreview, setImgPreview]         = useState<string | null>(null);
  const [deletingConv, setDeletingConv]     = useState<string | null>(null);
  const [menuMsgId, setMenuMsgId]           = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId]     = useState<string | null>(null);
  const [editInput, setEditInput]           = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const editInputRef   = useRef<HTMLInputElement>(null);

  async function authH(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? `Bearer ${token}` : null;
  }

  const loadConversations = useCallback(async () => {
    const auth = await authH();
    if (!auth) return;
    const res = await fetch("/api/chat/conversations", { headers: { Authorization: auth }, cache: "no-store" });
    if (res.ok) setConversations(await res.json());
    setListLoading(false);
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    setMsgLoading(true);
    const auth = await authH();
    if (!auth) { setMsgLoading(false); return; }
    const res = await fetch(`/api/chat/messages?conversation_id=${convId}`, { headers: { Authorization: auth }, cache: "no-store" });
    if (res.ok) setMessages(await res.json());
    setMsgLoading(false);
  }, []);

  const openConversation = useCallback(async (username: string) => {
    setError("");
    const auth = await authH();
    if (!auth) return;
    const res = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Ошибка");
      return;
    }
    const conv: Conversation = await res.json();
    setActiveConv(conv);
    setView("thread");
    await loadMessages(conv.id);
  }, [loadMessages]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setMyId(data.session?.user?.id ?? null);
      await loadConversations();
      if (initialUsername) await openConversation(initialUsername);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: INSERT + UPDATE + DELETE on messages
  useEffect(() => {
    if (!activeConv || !myId) return;
    const channel = supabase
      .channel(`chat_msgs_${activeConv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConv.id}` }, (payload) => {
        const m = payload.new as Message;
        setMessages(prev => {
          if (prev.some(x => x.id === m.id)) return prev;
          const sender = m.sender_id === myId
            ? { username: null, avatar_url: null }
            : { username: activeConv.other_user.username, avatar_url: activeConv.other_user.avatar_url };
          return [...prev, { ...m, sender }];
        });
        setConversations(prev => prev.map(c =>
          c.id === activeConv.id ? { ...c, latest_message: { content: m.content, image_url: m.image_url, created_at: m.created_at, sender_id: m.sender_id } } : c
        ));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConv.id}` }, (payload) => {
        const m = payload.new as Message;
        setMessages(prev => prev.map(x => x.id === m.id ? { ...x, content: m.content } : x));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConv.id}` }, (payload) => {
        const id = (payload.old as { id: string }).id;
        setMessages(prev => prev.filter(x => x.id !== id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv?.id, myId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (view === "thread") setTimeout(() => inputRef.current?.focus(), 100); }, [view, activeConv?.id]);
  useEffect(() => { if (editingMsgId) setTimeout(() => editInputRef.current?.focus(), 50); }, [editingMsgId]);

  async function sendMessage() {
    if (!input.trim() || !activeConv || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    const auth = await authH();
    if (!auth) { setSending(false); return; }
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: activeConv.id, content: text }),
    });
    if (res.ok) {
      const msg: Message = await res.json();
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, { ...msg, sender: { username: null, avatar_url: null } }]);
    }
    setSending(false);
  }

  async function sendImage(file: File) {
    if (!activeConv) return;
    if (!file.type.startsWith("image/")) { setError("Только изображения"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Максимум 5 МБ"); return; }
    setUploading(true); setError("");
    const auth = await authH();
    if (!auth) { setUploading(false); return; }
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/chat/upload", { method: "POST", headers: { Authorization: auth }, body: fd });
    if (!up.ok) { const d = await up.json().catch(() => ({})); setError(d.error ?? "Ошибка загрузки"); setUploading(false); return; }
    const { url } = await up.json();
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: activeConv.id, image_url: url }),
    });
    if (res.ok) {
      const msg: Message = await res.json();
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, { ...msg, sender: { username: null, avatar_url: null } }]);
    }
    setUploading(false);
  }

  async function deleteConversation(id: string) {
    setDeletingConv(id);
    const auth = await authH();
    if (!auth) { setDeletingConv(null); return; }
    await fetch(`/api/chat/conversations/${id}`, { method: "DELETE", headers: { Authorization: auth } });
    setConversations(prev => prev.filter(c => c.id !== id));
    onConvDeleted?.(id);
    setDeletingConv(null);
  }

  async function deleteMessage(msgId: string) {
    setMenuMsgId(null);
    const auth = await authH();
    if (!auth) return;
    await fetch(`/api/chat/messages/${msgId}`, { method: "DELETE", headers: { Authorization: auth } });
    setMessages(prev => prev.filter(m => m.id !== msgId));
  }

  async function saveEdit(msgId: string) {
    if (!editInput.trim()) return;
    const auth = await authH();
    if (!auth) return;
    const res = await fetch(`/api/chat/messages/${msgId}`, {
      method: "PATCH",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ content: editInput.trim() }),
    });
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editInput.trim() } : m));
    }
    setEditingMsgId(null);
    setEditInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={() => { setMenuMsgId(null); onClose(); }}
      />

      <div
        className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 flex flex-col overflow-hidden"
        style={{
          width: "100%", maxWidth: 700,
          height: "90svh", maxHeight: 680,
          background: "#08070a",
          border: "1px solid rgba(212,175,55,0.18)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        }}
        onClick={() => setMenuMsgId(null)}
      >
        <style>{`@media(min-width:640px){.chat-modal-box{border-radius:20px!important}}`}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
          <div className="flex items-center gap-3">
            {view === "thread" && (
              <button onClick={() => { setView("list"); setActiveConv(null); setMessages([]); setMenuMsgId(null); setEditingMsgId(null); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: GOLD_DIM }}>
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
            )}
            {view === "thread" && activeConv ? (
              <div className="flex items-center gap-2.5">
                <Avatar user={activeConv.other_user} size={30} />
                <div className="flex items-center gap-1">
                  <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                    {activeConv.other_user.username ?? "Пользователь"}
                  </span>
                  {activeConv.other_user.verified && <VerifiedBadge />}
                </div>
              </div>
            ) : (
              <span className="text-[13px] font-bold tracking-widest uppercase" style={{ color: GOLD }}>
                Сообщения
              </span>
            )}
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Conversation list */}
          {view === "list" && (
            <div className="flex flex-col flex-1 min-h-0">
              {listLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: GOLD_DIM }} />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(255,255,255,0.1)" }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.25)" }}>Нет диалогов</p>
                  <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.15)" }}>
                    Найди пользователя и нажми «Написать»
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {conversations.map(c => (
                    <div key={c.id} className="group flex items-center"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <button
                        onClick={async () => { setActiveConv(c); setView("thread"); await loadMessages(c.id); }}
                        className="flex-1 flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
                      >
                        <Avatar user={c.other_user} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                              {c.other_user.username ?? "Пользователь"}
                            </span>
                            {c.other_user.verified && <VerifiedBadge />}
                          </div>
                          {c.latest_message && (
                            <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                              {c.latest_message.image_url && !c.latest_message.content ? "📷 Фото" : c.latest_message.content ?? ""}
                            </p>
                          )}
                        </div>
                        {c.latest_message && (
                          <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                            {fmtTime(c.latest_message.created_at)}
                          </span>
                        )}
                      </button>
                      {/* Delete conv button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                        disabled={deletingConv === c.id}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center mr-1 hover:bg-red-500/10 disabled:opacity-30 rounded-lg"
                        style={{ color: "rgba(239,68,68,0.6)" }}
                        title="Удалить диалог"
                      >
                        {deletingConv === c.id ? (
                          <div className="w-3 h-3 rounded-full border border-transparent animate-spin" style={{ borderTopColor: "rgba(239,68,68,0.6)" }} />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Thread */}
          {view === "thread" && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
                {msgLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: GOLD_DIM }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>Начните общение</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id === myId;
                    const isEditing = editingMsgId === msg.id;
                    const menuOpen = menuMsgId === msg.id;
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        {!isMe && activeConv && <Avatar user={activeConv.other_user} size={28} />}
                        <div className={`max-w-[72%] flex flex-col ${isMe ? "items-end" : "items-start"} relative`}>
                          {isEditing ? (
                            <div className="flex items-center gap-2 rounded-2xl px-3 py-2"
                              style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", minWidth: 180 }}>
                              <input
                                ref={editInputRef}
                                value={editInput}
                                onChange={e => setEditInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") { e.preventDefault(); saveEdit(msg.id); }
                                  if (e.key === "Escape") { setEditingMsgId(null); setEditInput(""); }
                                }}
                                className="flex-1 bg-transparent text-[13px] outline-none text-white/90 min-w-0"
                              />
                              <button onClick={() => saveEdit(msg.id)} className="flex-shrink-0 hover:opacity-70" style={{ color: GOLD }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </button>
                              <button onClick={() => { setEditingMsgId(null); setEditInput(""); }} className="flex-shrink-0 hover:opacity-70" style={{ color: "rgba(255,255,255,0.3)" }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            </div>
                          ) : msg.image_url ? (
                            <button onClick={() => setImgPreview(msg.image_url!)} className="rounded-xl overflow-hidden hover:opacity-90 transition-opacity">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={msg.image_url} alt="фото" className="max-w-[220px] max-h-[220px] object-cover rounded-xl" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isMe) return;
                                setMenuMsgId(menuOpen ? null : msg.id);
                              }}
                              className="px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed text-left"
                              style={isMe ? {
                                background: menuOpen ? "rgba(212,175,55,0.18)" : "rgba(212,175,55,0.12)",
                                border: "1px solid rgba(212,175,55,0.25)",
                                color: "rgba(255,255,255,0.9)",
                                borderBottomRightRadius: 4,
                                cursor: "pointer",
                              } : {
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.09)",
                                color: "rgba(255,255,255,0.82)",
                                borderBottomLeftRadius: 4,
                                cursor: "default",
                              }}
                            >
                              {msg.content}
                            </button>
                          )}

                          {/* Контекстное меню своего сообщения */}
                          {isMe && menuOpen && !isEditing && (
                            <div
                              className="absolute bottom-full mb-1 right-0 rounded-xl overflow-hidden z-10 flex flex-col"
                              style={{ background: "#0f0d10", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)", minWidth: 130 }}
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                onClick={() => { setEditingMsgId(msg.id); setEditInput(msg.content ?? ""); setMenuMsgId(null); }}
                                className="flex items-center gap-2.5 px-4 py-3 text-[12px] hover:bg-white/[0.04] transition-colors text-left"
                                style={{ color: "rgba(255,255,255,0.7)" }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                Редактировать
                              </button>
                              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="flex items-center gap-2.5 px-4 py-3 text-[12px] hover:bg-red-500/[0.06] transition-colors text-left"
                                style={{ color: "rgba(239,68,68,0.75)" }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                                Удалить
                              </button>
                            </div>
                          )}

                          <span className="text-[10px] mt-1 px-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                            {fmtTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {error && (
                <div className="px-4 pb-1 text-[11px]" style={{ color: "rgba(239,68,68,0.8)" }}>{error}</div>
              )}

              <div className="px-3 pb-3 pt-2 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.15)" }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70 disabled:opacity-40"
                    style={{ background: "rgba(212,175,55,0.08)", color: GOLD_DIM }}
                  >
                    {uploading ? (
                      <div className="w-3.5 h-3.5 rounded-full border border-transparent animate-spin" style={{ borderTopColor: GOLD_DIM }} />
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    )}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) sendImage(f); e.target.value = ""; }} />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Сообщение..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    className="flex-1 bg-transparent text-[13px] outline-none placeholder-white/20 text-white/85"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30"
                    style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}
                  >
                    {sending ? (
                      <div className="w-3.5 h-3.5 rounded-full border border-transparent animate-spin" style={{ borderTopColor: GOLD }} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {imgPreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }}
          onClick={() => setImgPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgPreview} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          <button
            onClick={() => setImgPreview(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >✕</button>
        </div>
      )}
    </>
  );
}
