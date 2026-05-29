"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";

const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

const inputCls   = "w-full rounded-xl px-4 text-white text-sm placeholder-white/20 outline-none";
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", transition: "border-color 200ms" };
const focusBorder   = "rgba(212,175,55,0.4)";
const defaultBorder = "rgba(255,255,255,0.08)";

const CONTENT = {
  ru: {
    back:        "← Назад",
    label:       "СЛУЖБА ПОДДЕРЖКИ",
    title:       "Как мы можем помочь?",
    subtitle:    "Опишите вашу проблему или вопрос — мы ответим в течение 24 часов",
    cards: [
      { icon: "🔐", title: "Аккаунт",  desc: "Вход, пароль, профиль" },
      { icon: "⚡", title: "Ошибки",   desc: "Баги и технические сбои" },
      { icon: "🤝", title: "Другое",   desc: "Сотрудничество, вопросы" },
    ],
    subjects: ["Технический вопрос", "Проблема с аккаунтом", "Сотрудничество", "Жалоба", "Другое"],
    name:        "Имя *",
    namePh:      "Ваше имя",
    emailLabel:  "Email *",
    subject:     "Тема обращения",
    message:     "Сообщение *",
    messagePh:   "Опишите вашу проблему или вопрос как можно подробнее...",
    send:        "Отправить заявку",
    sending:     "Отправляем...",
    footer:      "Обращение поступит на mirakt.news@mail.ru",
    errEmpty:    "Напишите сообщение",
    errFail:     "Ошибка. Попробуйте позже.",
    doneTitle:   "Заявка отправлена",
    doneText:    "Мы получили ваше обращение и ответим в течение 24 часов.",
    doneEmail:   "Ответ придёт на",
    doneBtn:     "На главную",
  },
  en: {
    back:        "← Back",
    label:       "SUPPORT",
    title:       "How can we help?",
    subtitle:    "Describe your issue or question — we'll reply within 24 hours",
    cards: [
      { icon: "🔐", title: "Account",  desc: "Login, password, profile" },
      { icon: "⚡", title: "Bugs",     desc: "Technical issues & errors" },
      { icon: "🤝", title: "Other",    desc: "Partnership, questions" },
    ],
    subjects: ["Technical question", "Account issue", "Partnership", "Complaint", "Other"],
    name:        "Name *",
    namePh:      "Your name",
    emailLabel:  "Email *",
    subject:     "Subject",
    message:     "Message *",
    messagePh:   "Please describe your issue or question in detail...",
    send:        "Submit request",
    sending:     "Sending...",
    footer:      "Your message will be sent to mirakt.news@mail.ru",
    errEmpty:    "Please write a message",
    errFail:     "Error. Please try again later.",
    doneTitle:   "Request sent",
    doneText:    "We received your message and will reply within 24 hours.",
    doneEmail:   "Reply will be sent to",
    doneBtn:     "Back to home",
  },
};

export default function SupportPage() {
  const { locale } = useLocale();
  const c = CONTENT[locale];

  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [subject, setSubject] = useState(c.subjects[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { setError(c.errEmpty); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message }),
    });
    const d = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(d.error ?? c.errFail); return; }
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
          <h2 className="text-white font-bold text-2xl mb-3">{c.doneTitle}</h2>
          <p className="text-[13px] mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>{c.doneText}</p>
          <p className="text-[12px] mb-8" style={{ color: "rgba(255,255,255,0.2)" }}>
            {c.doneEmail} <span style={{ color: GOLD_DIM }}>{email}</span>
          </p>
          <Link href="/"
            className="inline-flex items-center gap-2 h-11 px-8 rounded-xl text-[11px] font-black tracking-[0.2em] uppercase hover:opacity-80 transition-opacity"
            style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: GOLD }}>
            {c.doneBtn}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "#08070a" }}>
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
          {c.back}
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.18)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD_DIM} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span className="text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: GOLD_DIM }}>
              {c.label}
            </span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight mb-2">{c.title}</h1>
          <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.35)" }}>{c.subtitle}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {c.cards.map((card) => (
            <div key={card.title} className="rounded-xl p-4 text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xl mb-1.5">{card.icon}</div>
              <div className="text-[11px] font-bold tracking-wide mb-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{card.title}</div>
              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{card.desc}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-7 space-y-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>{c.name}</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder={c.namePh}
                className={`h-11 ${inputCls}`} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = focusBorder)}
                onBlur={e => (e.target.style.borderColor = defaultBorder)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>{c.emailLabel}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                className={`h-11 ${inputCls}`} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = focusBorder)}
                onBlur={e => (e.target.style.borderColor = defaultBorder)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>{c.subject}</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className={`h-11 ${inputCls} cursor-pointer`}
              style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none" }}>
              {c.subjects.map(s => <option key={s} value={s} style={{ background: "#0a0806" }}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>{c.message}</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5} placeholder={c.messagePh}
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
                {c.sending}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                {c.send}
              </>
            )}
          </button>

          <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>{c.footer}</p>
        </form>
      </div>
    </main>
  );
}
