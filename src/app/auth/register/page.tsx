"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  transition: "border-color 200ms",
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [agreed, setAgreed]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Пароли не совпадают"); return; }
    if (password.length < 6)  { setError("Пароль минимум 6 символов"); return; }
    setLoading(true);
    setError("");
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message === "User already registered"
        ? "Этот email уже зарегистрирован"
        : signUpError.message);
      setLoading(false);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.replace("/cabinet");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "#08070a" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10 justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image.png" alt="Mirakt"
            style={{ width: 40, height: 40, objectFit: "cover", objectPosition: "center 20%", borderRadius: "50%", mixBlendMode: "screen" }} />
          <span className="font-black tracking-[0.2em] uppercase text-sm" style={{ color: GOLD }}>Mirakt</span>
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
          <h1 className="text-white font-bold text-xl mb-1 tracking-tight">Регистрация</h1>
          <p className="text-[13px] mb-7" style={{ color: "rgba(255,255,255,0.3)" }}>Создайте аккаунт Mirakt</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Email</label>
              <input type="email" value={email} required autoComplete="email"
                placeholder="you@example.com"
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="h-11 rounded-xl px-4 text-white text-sm placeholder-white/15 outline-none"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Пароль</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password} required autoComplete="new-password"
                  placeholder="Минимум 6 символов"
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="h-11 w-full rounded-xl px-4 pr-11 text-white text-sm placeholder-white/15 outline-none"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: showPw ? GOLD : "rgba(255,255,255,0.45)", opacity: password ? 1 : 0, pointerEvents: password ? "auto" : "none" }}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Подтверждение пароля</label>
              <div className="relative">
                <input
                  type={showCf ? "text" : "password"} value={confirm} required autoComplete="new-password"
                  placeholder="Повторите пароль"
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  className="h-11 w-full rounded-xl px-4 pr-11 text-white text-sm placeholder-white/15 outline-none"
                  style={{ ...inputStyle, borderColor: confirm && confirm !== password ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)" }}
                  onFocus={(e) => (e.target.style.borderColor = confirm !== password ? "rgba(239,68,68,0.4)" : "rgba(212,175,55,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = confirm && confirm !== password ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)")}
                />
                <button type="button" onClick={() => setShowCf(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: showCf ? GOLD : "rgba(255,255,255,0.45)", opacity: confirm ? 1 : 0, pointerEvents: confirm ? "auto" : "none" }}>
                  <EyeIcon open={showCf} />
                </button>
              </div>
            </div>

            {/* Согласие с условиями */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
                padding: "12px 14px",
                borderRadius: 10,
                background: agreed ? "rgba(212,175,55,0.05)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${agreed ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.07)"}`,
                transition: "all 200ms",
              }}
            >
              {/* Кастомный чекбокс */}
              <div
                onClick={() => setAgreed(v => !v)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  border: `1.5px solid ${agreed ? "rgba(212,175,55,0.8)" : "rgba(255,255,255,0.2)"}`,
                  background: agreed ? "rgba(212,175,55,0.15)" : "transparent",
                  flexShrink: 0,
                  marginTop: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 200ms",
                }}
              >
                {agreed && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="rgba(212,175,55,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.6 }}>
                Я ознакомился и соглашаюсь с{" "}
                <Link href="/terms" target="_blank" style={{ color: GOLD_DIM, textDecoration: "underline", textUnderlineOffset: 3 }}>
                  условиями использования
                </Link>{" "}
                и{" "}
                <Link href="/konfidencialnost" target="_blank" style={{ color: GOLD_DIM, textDecoration: "underline", textUnderlineOffset: 3 }}>
                  политикой конфиденциальности
                </Link>{" "}
                Mirakt
              </span>
            </label>

            {error && (
              <div className="rounded-xl px-4 py-3 text-[12px]"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.85)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !agreed}
              className="h-11 rounded-xl text-[11px] font-black tracking-[0.2em] uppercase transition-all"
              style={{
                background: agreed ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${agreed ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.08)"}`,
                color: agreed ? GOLD : "rgba(255,255,255,0.2)",
                cursor: agreed && !loading ? "pointer" : "not-allowed",
              }}>
              {loading ? "Регистрируем..." : "Зарегистрироваться"}
            </button>
          </form>

          <p className="mt-6 text-center text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Уже есть аккаунт?{" "}
            <Link href="/auth/login" className="hover:opacity-70 transition-opacity" style={{ color: GOLD_DIM }}>
              Войти
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-[11px] tracking-widest uppercase hover:opacity-60 transition-opacity"
            style={{ color: "rgba(255,255,255,0.2)" }}>
            ← На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
