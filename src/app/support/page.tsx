"use client";

import { useState } from "react";
import Link from "next/link";

const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

const inputCls = "w-full rounded-xl px-4 text-white text-sm placeholder-white/20 outline-none";
const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  transition: "border-color 200ms",
};
const focusBorder  = "rgba(212,175,55,0.4)";
const defaultBorder = "rgba(255,255,255,0.08)";

const SUBJECTS = [
  "Технический вопрос",
  "Проблема с аккаунтом",
  "Сотрудничество",
  "Жалоба",
  "Другое",
];

export default function SupportPage() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { setError("Напишите сообщение"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message }),
    });
    const d = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(d.error ?? "Ошибка. Попробуйте позже."); return; }
    setDone(true);
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "#08070a" }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-white font-bold text-2xl mb-3">Заявка отправлена</h2>
          <p className="text-[13px] mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
            Мы получили ваше обращение и ответим в течение 24 часов.
          </p>
          <p className="text-[12px] mb-8" style={{ color: "rgba(255,255,255,0.2)" }}>
            Ответ придёт на <span style={{ color: GOLD_DIM }}>{email}</span>
          </p>
          <Link href="/"
            className="inline-flex items-center gap-2 h-11 px-8 rounded-xl text-[11px] font-black tracking-[0.2em] uppercase hover:opacity-80 transition-opacity"
            style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: GOLD }}>
            На главную
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "#08070a" }}>
      {/* Шапка */}
      <div className="px-6 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(212,175,55,0.07)" }}>
        <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image.png" alt="Mirakt"
            style={{ width: 32, height: 32, objectFit: "cover", objectPosition: "center 20%", borderRadius: "50%", mixBlendMode: "screen" }} />
          <span className="font-black tracking-[0.2em] uppercase text-sm" style={{ color: GOLD }}>Mirakt</span>
        </Link>
        <Link href="/" className="text-[11px] tracking-widest uppercase hover:opacity-60 transition-opacity"
          style={{ color: "rgba(255,255,255,0.2)" }}>
          ← Назад
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.18)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD_DIM} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: GOLD_DIM }}>
              Служба поддержки
            </span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight mb-2">Как мы можем помочь?</h1>
          <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Опишите вашу проблему или вопрос — мы ответим в течение 24 часов
          </p>
        </div>

        {/* Карточки-подсказки */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: "🔐", title: "Аккаунт", desc: "Вход, пароль, профиль" },
            { icon: "⚡", title: "Ошибки", desc: "Баги и технические сбои" },
            { icon: "🤝", title: "Другое", desc: "Сотрудничество, вопросы" },
          ].map((c) => (
            <div key={c.title}
              className="rounded-xl p-4 text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xl mb-1.5">{c.icon}</div>
              <div className="text-[11px] font-bold tracking-wide mb-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{c.title}</div>
              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit}
          className="rounded-2xl p-7 space-y-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Имя *</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                placeholder="Ваше имя"
                className={`h-11 ${inputCls}`} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = focusBorder)}
                onBlur={e => (e.target.style.borderColor = defaultBorder)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className={`h-11 ${inputCls}`} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = focusBorder)}
                onBlur={e => (e.target.style.borderColor = defaultBorder)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Тема обращения</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className={`h-11 ${inputCls} cursor-pointer`}
              style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none" }}>
              {SUBJECTS.map(s => <option key={s} value={s} style={{ background: "#0a0806" }}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Сообщение *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required
              rows={5} placeholder="Опишите вашу проблему или вопрос как можно подробнее..."
              className="w-full rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none resize-none"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = focusBorder)}
              onBlur={e => (e.target.style.borderColor = defaultBorder)} />
            <div className="text-right text-[10px]" style={{ color: message.length > 400 ? GOLD_DIM : "rgba(255,255,255,0.15)" }}>
              {message.length} / 500
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 text-[12px]"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.85)" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || message.length > 500}
            className="w-full h-12 rounded-xl text-[11px] font-black tracking-[0.22em] uppercase hover:opacity-80 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.35)", color: GOLD }}>
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: GOLD }} />
                Отправляем...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Отправить заявку
              </>
            )}
          </button>

          <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>
            Обращение поступит на mirakt.news@mail.ru
          </p>
        </form>
      </div>
    </main>
  );
}
