"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ChatModal } from "@/components/ChatModal";

const GOLD      = "rgba(212,175,55,0.85)";
const GOLD_DIM  = "rgba(212,175,55,0.4)";
const CARD      = { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" };
const CARD_GOLD = { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,175,55,0.12)" };

type Profile = {
  id: string;
  email: string;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
  verified: boolean;
  email_verified: boolean;
};

function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block flex-shrink-0"
      aria-label="Подтверждён">
      <path
        fill="#1d9bf0"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
      />
      <path fill="#fff" d="M16.9 9.3 10.9 15.3l-3.8-3.8 1.4-1.4 2.4 2.4 4.6-4.6z" />
    </svg>
  );
}

async function authHeaders(): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

export default function CabinetPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // редактирование ника
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState("");
  const [savingName, setSavingName]   = useState(false);
  const [nameError, setNameError]     = useState("");

  // аватар
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError]         = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // подтверждение email
  const [verifySending, setVerifySending]     = useState(false);
  const [verifySent, setVerifySent]           = useState(false);

  // пароль
  const [pwOpen, setPwOpen]           = useState(false);
  const [pw, setPw]                   = useState("");
  const [pwConfirm, setPwConfirm]     = useState("");
  const [pwError, setPwError]         = useState("");
  const [pwSuccess, setPwSuccess]     = useState(false);
  const [pwSaving, setPwSaving]       = useState(false);

  // вкладки
  const [activeTab, setActiveTab]     = useState<"profile" | "friends" | "messages">("profile");

  // чат
  const [chatOpen, setChatOpen]           = useState(false);
  const [chatInitUser, setChatInitUser]   = useState<string | undefined>(undefined);
  const [canMessage, setCanMessage]       = useState<"all" | "friends">("all");
  const [savingChatPrv, setSavingChatPrv] = useState(false);

  type ConvEntry = {
    id: string;
    other_user: { id: string; username: string | null; avatar_url: string | null; verified: boolean };
    latest_message?: { content: string | null; image_url: string | null; created_at: string; sender_id: string } | null;
  };
  const [conversations, setConversations] = useState<ConvEntry[]>([]);
  const [convsLoading, setConvsLoading]   = useState(false);

  async function loadConversations() {
    setConvsLoading(true);
    const h = await authHeaders();
    if (!h) { setConvsLoading(false); return; }
    const res = await fetch("/api/chat/conversations", { headers: h, cache: "no-store" });
    if (res.ok) setConversations(await res.json());
    setConvsLoading(false);
  }

  async function loadChatSettings() {
    const h = await authHeaders();
    if (!h) return;
    const res = await fetch("/api/chat/settings", { headers: h, cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setCanMessage(d.can_message ?? "all");
    }
  }

  async function saveChatPrivacy(val: "all" | "friends") {
    setSavingChatPrv(true);
    const h = await authHeaders();
    if (!h) { setSavingChatPrv(false); return; }
    await fetch("/api/chat/settings", {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ can_message: val }),
    });
    setCanMessage(val);
    setSavingChatPrv(false);
  }

  function openChatWith(username: string) {
    setChatInitUser(username);
    setChatOpen(true);
  }

  // друзья
  type FriendEntry = { id: string; profile: { username: string; avatar_url: string | null; verified: boolean } };
  const [friends, setFriends]         = useState<FriendEntry[]>([]);
  const [incoming, setIncoming]       = useState<FriendEntry[]>([]);
  const [outgoing, setOutgoing]       = useState<FriendEntry[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsBusy, setFriendsBusy] = useState<string | null>(null);

  async function loadFriends() {
    setFriendsLoading(true);
    const h = await authHeaders();
    if (!h) { setFriendsLoading(false); return; }
    const res = await fetch("/api/friends", { headers: h, cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setFriends(d.friends ?? []);
      setIncoming(d.incoming ?? []);
      setOutgoing(d.outgoing ?? []);
    }
    setFriendsLoading(false);
  }

  async function respondFriend(id: string, action: "accept" | "reject") {
    setFriendsBusy(id);
    const h = await authHeaders();
    if (!h) { setFriendsBusy(null); return; }
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadFriends();
    setFriendsBusy(null);
  }

  async function removeFriend(id: string) {
    setFriendsBusy(id);
    const h = await authHeaders();
    if (!h) { setFriendsBusy(null); return; }
    await fetch(`/api/friends/${id}`, { method: "DELETE", headers: h });
    await loadFriends();
    setFriendsBusy(null);
  }

  async function loadProfile() {
    const h = await authHeaders();
    if (!h) { router.replace("/auth/login"); return; }
    const res = await fetch("/api/profile", { headers: h, cache: "no-store" });
    if (!res.ok) { router.replace("/auth/login"); return; }
    const p: Profile = await res.json();
    setProfile(p);
    setNameInput(p.username ?? "");
    setLoading(false);
  }

  useEffect(() => { loadProfile(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => {
    if (activeTab === "friends") loadFriends();
    if (activeTab === "messages") loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => { loadChatSettings(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // presence tracking
  useEffect(() => {
    if (!profile?.username) return;
    const channel = supabase.channel("online-users");
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ username: profile.username });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [profile?.username]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function saveName() {
    if (!profile) return;
    setSavingName(true); setNameError("");
    const h = await authHeaders();
    if (!h) { router.replace("/auth/login"); return; }
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ username: nameInput }),
    });
    const d = await res.json().catch(() => ({}));
    setSavingName(false);
    if (!res.ok) { setNameError(d.error || "Ошибка"); return; }
    setEditingName(false);
    await loadProfile();
  }

  async function onPickAvatar(f: File) {
    setAvatarError("");
    if (!f.type.startsWith("image/")) { setAvatarError("Только изображения"); return; }
    if (f.size > 5 * 1024 * 1024)     { setAvatarError("Максимум 5 МБ"); return; }
    setUploadingAvatar(true);
    const h = await authHeaders();
    if (!h) { router.replace("/auth/login"); return; }
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/profile/avatar", { method: "POST", headers: h, body: fd });
    const d = await res.json().catch(() => ({}));
    setUploadingAvatar(false);
    if (!res.ok) { setAvatarError(d.error || "Ошибка загрузки"); return; }
    await loadProfile();
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(""); setPwSuccess(false);
    if (pw.length < 6)         { setPwError("Минимум 6 символов"); return; }
    if (pw !== pwConfirm)      { setPwError("Пароли не совпадают"); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwSaving(false);
    if (error) { setPwError(error.message); return; }
    setPwSuccess(true);
    setPw(""); setPwConfirm("");
    setTimeout(() => { setPwOpen(false); setPwSuccess(false); }, 1500);
  }

  if (loading || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#08070a" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: GOLD_DIM }} />
          <span className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Загрузка...</span>
        </div>
      </main>
    );
  }

  const displayName = profile.username || profile.email.split("@")[0];
  const initial     = (profile.username?.[0] || profile.email[0] || "?").toUpperCase();
  const createdAt   = new Date(profile.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <main className="min-h-screen" style={{ background: "#08070a" }}>
      {/* Навбар */}
      <nav className="px-4 md:px-8 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: GOLD_DIM }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image.png" alt="Mirakt"
            style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", objectPosition: "center 20%", mixBlendMode: "screen" }} />
          <span className="text-[11px] tracking-[0.18em] uppercase font-bold hidden sm:block"
            style={{ color: "rgba(255,255,255,0.3)" }}>Mirakt</span>
        </Link>

        <button onClick={handleLogout}
          className="flex items-center gap-2 text-[11px] tracking-widest uppercase px-4 py-2 rounded-full hover:opacity-70 transition-opacity"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Выйти
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">

        {/* Герой-карточка */}
        <div className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(212,175,55,0.15)" }}>
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)" }} />

          <div className="flex items-center gap-5 relative">
            {/* Аватар + загрузка */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center overflow-hidden text-3xl md:text-4xl font-black transition-all hover:opacity-85 group"
                style={{ background: "rgba(212,175,55,0.1)", border: "1.5px solid rgba(212,175,55,0.25)", color: GOLD }}
                aria-label="Сменить аватар">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : initial}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.55)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickAvatar(f); e.target.value = ""; }} />
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.55)" }}>
                  <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin"
                    style={{ borderTopColor: GOLD }} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: GOLD_DIM }}>Личный кабинет</div>
              {!editingName ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-white font-bold text-lg md:text-xl leading-tight truncate">{displayName}</div>
                  {profile.verified && <VerifiedBadge size={18} />}
                  <button onClick={() => { setEditingName(true); setNameInput(profile.username ?? ""); }}
                    className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full hover:opacity-70"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>
                    {profile.username ? "Изменить" : "Задать ник"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                      maxLength={24} autoFocus placeholder="Ник"
                      className="h-8 rounded-lg px-3 text-white text-[13px] outline-none flex-1 min-w-0"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,175,55,0.35)" }} />
                    <button onClick={saveName} disabled={savingName}
                      className="text-[10px] tracking-widest uppercase px-2.5 py-1.5 rounded-lg hover:opacity-80 disabled:opacity-40"
                      style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: GOLD }}>
                      {savingName ? "..." : "OK"}
                    </button>
                    <button onClick={() => { setEditingName(false); setNameError(""); }}
                      className="text-[10px] tracking-widest uppercase px-2.5 py-1.5 rounded-lg hover:opacity-70"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>
                      ✕
                    </button>
                  </div>
                  {nameError && <span className="text-[11px]" style={{ color: "rgba(239,68,68,0.85)" }}>{nameError}</span>}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "rgba(74,222,128,0.8)" }}>
                  ● Активен
                </span>
                {profile.verified && (
                  <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(29,155,240,0.1)", border: "1px solid rgba(29,155,240,0.3)", color: "rgba(29,155,240,0.9)" }}>
                    ✓ Верифицирован
                  </span>
                )}
              </div>
            </div>
          </div>

          {avatarError && (
            <div className="mt-3 text-[11px]" style={{ color: "rgba(239,68,68,0.85)" }}>{avatarError}</div>
          )}
        </div>

        {/* Вкладки */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          {(["profile", "friends", "messages"] as const).map((tab) => {
            const active = activeTab === tab;
            const label = tab === "profile" ? "Профиль"
              : tab === "friends" ? `Друзья${incoming.length > 0 ? ` (${incoming.length})` : ""}`
              : "Сообщения";
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-all"
                style={{
                  background: active ? "rgba(212,175,55,0.1)" : "transparent",
                  color: active ? GOLD : "rgba(255,255,255,0.3)",
                  borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
                }}>
                {label}
              </button>
            );
          })}
        </div>

        {activeTab === "profile" && <>

        {/* Плашка: подтвердите почту */}
        {!profile.email_verified && (
          <div className="rounded-2xl px-5 py-3 flex items-center justify-between gap-3"
            style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)" }}>
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              ✉ Почта не подтверждена
            </span>
            <button
              disabled={verifySending || verifySent}
              onClick={async () => {
                setVerifySending(true);
                const h = await authHeaders();
                if (h) {
                  const res = await fetch("/api/verify-email/send", { method: "POST", headers: h });
                  if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    console.error("verify email error:", d);
                  }
                }
                setVerifySending(false);
                setVerifySent(true);
              }}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide hover:opacity-80 disabled:opacity-50 transition-all"
              style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: GOLD }}>
              {verifySent ? "✓ Письмо отправлено" : verifySending ? "..." : "Подтвердить"}
            </button>
          </div>
        )}

        {/* Аккаунт */}
        <div className="rounded-2xl p-6" style={CARD_GOLD}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD_DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-[11px] tracking-widest uppercase font-bold" style={{ color: GOLD_DIM }}>Аккаунт</span>
          </div>
          <div>
            <div className="flex items-center justify-between py-3.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>Email</span>
              <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{profile.email}</span>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>Дата регистрации</span>
              <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{createdAt}</span>
            </div>
          </div>
        </div>

        {/* Настройки */}
        <div className="rounded-2xl overflow-hidden" style={CARD}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <span className="text-[11px] tracking-widest uppercase font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>Настройки</span>
            </div>
          </div>

          <button onClick={() => setPwOpen(true)}
            className="w-full px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors text-left"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-3">
              <span className="text-base">🔑</span>
              <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>Сменить пароль</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(255,255,255,0.2)" }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Кто может писать */}
          <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-base">💬</span>
              <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>Кто может писать мне</span>
            </div>
            <div className="flex gap-2">
              {(["all", "friends"] as const).map((val) => {
                const active = canMessage === val;
                const label = val === "all" ? "Все" : "Только друзья";
                return (
                  <button
                    key={val}
                    onClick={() => !savingChatPrv && saveChatPrivacy(val)}
                    disabled={savingChatPrv}
                    className="flex-1 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all disabled:opacity-50"
                    style={{
                      background: active ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                      border: active ? "1px solid rgba(212,175,55,0.35)" : "1px solid rgba(255,255,255,0.07)",
                      color: active ? GOLD : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Выйти */}
        <button onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl text-[12px] tracking-widest uppercase font-bold hover:opacity-70 transition-opacity flex items-center justify-center gap-2"
          style={{ border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.6)", background: "rgba(239,68,68,0.04)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Выйти из аккаунта
        </button>

        <p className="text-center text-[10px] pb-6" style={{ color: "rgba(255,255,255,0.1)" }}>
          © {new Date().getFullYear()} Mirakt.ru
        </p>
        </>}

        {activeTab === "messages" && (
          <div className="pb-6">
            <div className="rounded-2xl overflow-hidden" style={CARD}>
              <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-[10px] tracking-widest uppercase font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Сообщения
                </span>
              </div>

              {convsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: GOLD_DIM }} />
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.15)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD_DIM} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Нет сообщений</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.12)" }}>Найди пользователя и напиши первым</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {conversations.map((c) => {
                    const u = c.other_user;
                    const ini = (u.username?.[0] ?? "?").toUpperCase();
                    const lastText = c.latest_message?.image_url && !c.latest_message?.content
                      ? "📷 Фото"
                      : c.latest_message?.content ?? "";
                    const lastTime = c.latest_message?.created_at
                      ? (() => {
                          const d = new Date(c.latest_message!.created_at);
                          const now = new Date();
                          if (d.toDateString() === now.toDateString())
                            return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
                          return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
                        })()
                      : "";
                    return (
                      <div key={c.id} className="group relative flex items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <button
                          onClick={() => openChatWith(u.username ?? "")}
                          className="flex-1 flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.025] transition-colors text-left"
                        >
                          <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-base font-bold overflow-hidden"
                            style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: GOLD }}>
                            {u.avatar_url
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                              : ini}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.88)" }}>
                                {u.username ?? "—"}
                              </span>
                              {u.verified && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                                  <path fill="#1d9bf0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"/>
                                  <path fill="#fff" d="M16.9 9.3 10.9 15.3l-3.8-3.8 1.4-1.4 2.4 2.4 4.6-4.6z"/>
                                </svg>
                              )}
                            </div>
                            {lastText && (
                              <p className="text-[12px] truncate pr-8" style={{ color: "rgba(255,255,255,0.3)" }}>{lastText}</p>
                            )}
                          </div>
                          {lastTime && (
                            <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>{lastTime}</span>
                          )}
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const auth = await authHeaders();
                            if (!auth) return;
                            await fetch(`/api/chat/conversations/${c.id}`, { method: "DELETE", headers: auth });
                            setConversations(prev => prev.filter(x => x.id !== c.id));
                          }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center mr-2"
                          style={{ color: "rgba(239,68,68,0.55)" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "friends" && (
          <div className="space-y-4 pb-6">
            {friendsLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: GOLD_DIM }} />
              </div>
            ) : (
              <>
                {/* Входящие заявки */}
                {incoming.length > 0 && (
                  <div className="rounded-2xl overflow-hidden" style={CARD_GOLD}>
                    <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
                      <span className="text-[10px] tracking-widest uppercase font-bold" style={{ color: GOLD_DIM }}>
                        Входящие заявки · {incoming.length}
                      </span>
                    </div>
                    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      {incoming.map((r) => {
                        const ini = r.profile.username[0].toUpperCase();
                        return (
                          <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                            <a href={`/profile/${r.profile.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-70 transition-opacity">
                              <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-[13px] font-bold overflow-hidden"
                                style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: GOLD }}>
                                {r.profile.avatar_url
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                  : ini}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{r.profile.username}</span>
                                  {r.profile.verified && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path fill="#1d9bf0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"/><path fill="#fff" d="M16.9 9.3 10.9 15.3l-3.8-3.8 1.4-1.4 2.4 2.4 4.6-4.6z"/></svg>}
                                </div>
                              </div>
                            </a>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button onClick={() => respondFriend(r.id, "accept")} disabled={friendsBusy === r.id}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-80 disabled:opacity-40 transition-all"
                                style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", color: GOLD }}>
                                {friendsBusy === r.id ? "..." : "Принять"}
                              </button>
                              <button onClick={() => respondFriend(r.id, "reject")} disabled={friendsBusy === r.id}
                                className="px-3 py-1.5 rounded-lg text-[11px] hover:opacity-70 disabled:opacity-40 transition-all"
                                style={{ border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.55)" }}>
                                {friendsBusy === r.id ? "..." : "✕"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Список друзей */}
                <div className="rounded-2xl overflow-hidden" style={CARD}>
                  <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-[10px] tracking-widest uppercase font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Друзья · {friends.length}
                    </span>
                  </div>
                  {friends.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>Пока нет друзей</p>
                      <a href="/search" className="inline-block mt-2 text-[11px] hover:opacity-70 transition-opacity" style={{ color: GOLD_DIM }}>Найти пользователей →</a>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      {friends.map((f) => {
                        const ini = f.profile.username[0].toUpperCase();
                        return (
                          <div key={f.id} className="flex items-center gap-3 px-5 py-3.5">
                            <a href={`/profile/${f.profile.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-70 transition-opacity">
                              <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-[13px] font-bold overflow-hidden"
                                style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: GOLD }}>
                                {f.profile.avatar_url
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={f.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                  : ini}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{f.profile.username}</span>
                                  {f.profile.verified && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path fill="#1d9bf0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"/><path fill="#fff" d="M16.9 9.3 10.9 15.3l-3.8-3.8 1.4-1.4 2.4 2.4 4.6-4.6z"/></svg>}
                                </div>
                              </div>
                            </a>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button onClick={() => openChatWith(f.profile.username)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-80 transition-all"
                                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: GOLD }}>
                                Написать
                              </button>
                              <button onClick={() => removeFriend(f.id)} disabled={friendsBusy === f.id}
                                className="px-3 py-1.5 rounded-lg text-[11px] hover:opacity-70 disabled:opacity-40 transition-all"
                                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }}>
                                {friendsBusy === f.id ? "..." : "Удалить"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Исходящие заявки */}
                {outgoing.length > 0 && (
                  <div className="rounded-2xl overflow-hidden" style={CARD}>
                    <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span className="text-[10px] tracking-widest uppercase font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Исходящие заявки · {outgoing.length}
                      </span>
                    </div>
                    <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      {outgoing.map((r) => {
                        const ini = r.profile.username[0].toUpperCase();
                        return (
                          <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                            <a href={`/profile/${r.profile.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-70 transition-opacity">
                              <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-[13px] font-bold overflow-hidden"
                                style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: GOLD }}>
                                {r.profile.avatar_url
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                  : ini}
                              </div>
                              <span className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{r.profile.username}</span>
                            </a>
                            <span className="text-[11px] mr-2" style={{ color: "rgba(255,255,255,0.25)" }}>Ожидает</span>
                            <button onClick={() => removeFriend(r.id)} disabled={friendsBusy === r.id}
                              className="px-3 py-1.5 rounded-lg text-[11px] hover:opacity-70 disabled:opacity-40 transition-all flex-shrink-0"
                              style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }}>
                              {friendsBusy === r.id ? "..." : "Отменить"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Чат */}
      {chatOpen && (
        <ChatModal
          onClose={() => { setChatOpen(false); setChatInitUser(undefined); }}
          initialUsername={chatInitUser}
        />
      )}

      {/* Модалка смены пароля */}
      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => !pwSaving && setPwOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#0a0806", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Сменить пароль</h3>
              <button onClick={() => setPwOpen(false)} disabled={pwSaving}
                className="w-7 h-7 rounded-full hover:opacity-70 disabled:opacity-40 flex items-center justify-center"
                style={{ color: "rgba(255,255,255,0.4)" }}>✕</button>
            </div>
            <form onSubmit={submitPassword} className="flex flex-col gap-3">
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus
                placeholder="Новый пароль" autoComplete="new-password" minLength={6}
                className="h-10 rounded-xl px-4 text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)}
                placeholder="Подтвердите пароль" autoComplete="new-password"
                className="h-10 rounded-xl px-4 text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              {pwError && <span className="text-[12px]" style={{ color: "rgba(239,68,68,0.85)" }}>{pwError}</span>}
              {pwSuccess && <span className="text-[12px]" style={{ color: "rgba(74,222,128,0.85)" }}>✓ Пароль обновлён</span>}
              <button type="submit" disabled={pwSaving}
                className="h-10 rounded-xl text-[11px] font-black tracking-[0.2em] uppercase hover:opacity-80 disabled:opacity-40 mt-1"
                style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: GOLD }}>
                {pwSaving ? "..." : "Сохранить"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
