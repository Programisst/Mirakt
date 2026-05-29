"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/lib/locale-context";

const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

type Profile = {
  id: string; email: string; created_at: string;
  username: string | null; avatar_url: string | null; verified: boolean;
};

async function authHeaders(): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
}

function VerifiedBadge() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path fill="#1d9bf0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"/>
      <path fill="#fff" d="M16.9 9.3 10.9 15.3l-3.8-3.8 1.4-1.4 2.4 2.4 4.6-4.6z"/>
    </svg>
  );
}

export default function CabinetPage() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState("");
  const [savingName, setSavingName]   = useState(false);
  const [nameError, setNameError]     = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError]         = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pwOpen, setPwOpen]       = useState(false);
  const [pw, setPw]               = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError]     = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving]   = useState(false);

  async function loadProfile() {
    const h = await authHeaders();
    if (!h) { router.replace("/auth/login"); return; }
    const res = await fetch("/api/profile", { headers: h, cache: "no-store" });
    if (!res.ok) { router.replace("/auth/login"); return; }
    const p: Profile = await res.json();
    setProfile(p); setNameInput(p.username ?? ""); setLoading(false);
  }

  useEffect(() => { loadProfile(); /* eslint-disable-next-line */ }, []);

  async function saveName() {
    setSavingName(true); setNameError("");
    const h = await authHeaders(); if (!h) return;
    const res = await fetch("/api/profile", { method: "PATCH", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ username: nameInput }) });
    const d = await res.json().catch(() => ({}));
    setSavingName(false);
    if (!res.ok) { setNameError(d.error || "Ошибка"); return; }
    setEditingName(false); await loadProfile();
  }

  async function onPickAvatar(f: File) {
    setAvatarError("");
    if (!f.type.startsWith("image/")) { setAvatarError(t.cab_images_only); return; }
    if (f.size > 5 * 1024 * 1024) { setAvatarError(t.cab_max_size); return; }
    setUploadingAvatar(true);
    const h = await authHeaders(); if (!h) return;
    const fd = new FormData(); fd.append("file", f);
    const res = await fetch("/api/profile/avatar", { method: "POST", headers: h, body: fd });
    const d = await res.json().catch(() => ({}));
    setUploadingAvatar(false);
    if (!res.ok) { setAvatarError(d.error || "Ошибка"); return; }
    await loadProfile();
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault(); setPwError(""); setPwSuccess(false);
    if (pw.length < 6) { setPwError(t.cab_min_chars); return; }
    if (pw !== pwConfirm) { setPwError(t.cab_pw_mismatch); return; }
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwSaving(false);
    if (error) { setPwError(error.message); return; }
    setPwSuccess(true); setPw(""); setPwConfirm("");
    setTimeout(() => { setPwOpen(false); setPwSuccess(false); }, 1500);
  }

  if (loading || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#08070a" }}>
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: GOLD_DIM }} />
      </main>
    );
  }

  const displayName = profile.username || profile.email.split("@")[0];
  const initial = (profile.username?.[0] || profile.email[0] || "?").toUpperCase();
  const createdAt = new Date(profile.created_at).toLocaleDateString(
    locale === "ru" ? "ru-RU" : "en-GB",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  return (
    <main className="min-h-screen" style={{ background: "#08070a" }}>
      <nav className="px-4 md:px-8 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: GOLD_DIM }}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image.png" alt="Mirakt" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", objectPosition: "center 20%", mixBlendMode: "screen" }} />
          <span className="text-[11px] tracking-[0.18em] uppercase font-bold hidden sm:block" style={{ color: "rgba(255,255,255,0.3)" }}>Mirakt</span>
        </Link>
        <button onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
          className="text-[11px] tracking-widest uppercase px-4 py-2 rounded-full hover:opacity-70 transition-opacity"
          style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" }}>
          {t.logout}
        </button>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-10 space-y-5">

        {/* Герой */}
        <div className="rounded-2xl p-6 md:p-8" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(212,175,55,0.15)" }}>
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden text-3xl font-black hover:opacity-85 group relative"
                style={{ background: "rgba(212,175,55,0.1)", border: "1.5px solid rgba(212,175,55,0.25)", color: GOLD }}>
                {profile.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : initial}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </button>
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
                  <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: GOLD }} />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickAvatar(f); e.target.value = ""; }} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: GOLD_DIM }}>{t.cab_title}</div>
              {!editingName ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold text-lg truncate">{displayName}</span>
                  {profile.verified && <VerifiedBadge />}
                  <button onClick={() => { setEditingName(true); setNameInput(profile.username ?? ""); }}
                    className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full hover:opacity-70"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>
                    {profile.username ? t.cab_change : t.cab_set_nick}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} maxLength={24} autoFocus placeholder={t.cab_username_hint}
                      className="h-8 rounded-lg px-3 text-white text-[13px] outline-none flex-1 min-w-0"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,175,55,0.35)" }} />
                    <button onClick={saveName} disabled={savingName}
                      className="text-[10px] tracking-widest uppercase px-2.5 py-1.5 rounded-lg hover:opacity-80 disabled:opacity-40"
                      style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: GOLD }}>
                      {savingName ? "..." : "OK"}
                    </button>
                    <button onClick={() => { setEditingName(false); setNameError(""); }}
                      className="px-2.5 py-1.5 rounded-lg hover:opacity-70"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>✕</button>
                  </div>
                  {nameError && <span className="text-[11px]" style={{ color: "rgba(239,68,68,0.85)" }}>{nameError}</span>}
                </div>
              )}
              {avatarError && <div className="mt-1 text-[11px]" style={{ color: "rgba(239,68,68,0.85)" }}>{avatarError}</div>}
            </div>
          </div>
        </div>

        {/* Аккаунт */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,175,55,0.12)" }}>
          <div className="text-[10px] tracking-widest uppercase mb-4 font-bold" style={{ color: GOLD_DIM }}>{t.cab_account}</div>
          <div className="flex flex-col" style={{ gap: 0 }}>
            {[
              { label: t.cab_email, value: profile.email },
              { label: t.cab_joined, value: createdAt },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
                <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{value}</span>
              </div>
            ))}
            {profile.verified && (
              <div className="flex items-center justify-between py-3">
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>{t.cab_status}</span>
                <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "rgba(29,155,240,0.9)" }}>
                  <VerifiedBadge /> {t.cab_verified_label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Настройки */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-[10px] tracking-widest uppercase font-bold px-6 py-4" style={{ color: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{t.cab_settings}</div>
          <button onClick={() => setPwOpen(true)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left">
            <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>🔑 {t.cab_change_pw}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(255,255,255,0.2)" }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* Выйти */}
        <button onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
          className="w-full py-3.5 rounded-2xl text-[12px] tracking-widest uppercase font-bold hover:opacity-70 transition-opacity"
          style={{ border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.6)", background: "rgba(239,68,68,0.04)" }}>
          {t.cab_logout}
        </button>

        <p className="text-center text-[10px] pb-6" style={{ color: "rgba(255,255,255,0.1)" }}>© {new Date().getFullYear()} Mirakt.ru</p>
      </div>

      {pwOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => !pwSaving && setPwOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6" onClick={(e) => e.stopPropagation()} style={{ background: "#0a0806", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">{t.cab_change_pw}</h3>
              <button onClick={() => setPwOpen(false)} style={{ color: "rgba(255,255,255,0.4)" }}>✕</button>
            </div>
            <form onSubmit={submitPassword} className="flex flex-col gap-3">
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus placeholder={t.cab_new_password} autoComplete="new-password"
                className="h-10 rounded-xl px-4 text-white text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              <input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder={t.cab_confirm_password} autoComplete="new-password"
                className="h-10 rounded-xl px-4 text-white text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              {pwError && <span className="text-[12px]" style={{ color: "rgba(239,68,68,0.85)" }}>{pwError}</span>}
              {pwSuccess && <span className="text-[12px]" style={{ color: "rgba(74,222,128,0.85)" }}>{t.cab_password_updated}</span>}
              <button type="submit" disabled={pwSaving} className="h-10 rounded-xl text-[11px] font-black tracking-[0.2em] uppercase hover:opacity-80 disabled:opacity-40 mt-1"
                style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: GOLD }}>
                {pwSaving ? "..." : t.cab_save}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
