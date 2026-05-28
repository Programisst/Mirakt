"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GOLD, LOGO_SRC } from "@/constants/site";
import { timeAgo } from "@/lib/time-ago";
import type { NewsItem } from "@/types/news";
import { supabase } from "@/lib/supabase";

async function trackRead() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  fetch("/api/profile/read", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    keepalive: true,
  }).catch(() => {});
}

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";

/* ── Прогресс-бар прокрутки ── */
function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? Math.min(100, (el.scrollTop / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 200, background: "rgba(212,175,55,0.08)" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD}, #f0d060)`, transition: "width 60ms linear", boxShadow: "0 0 10px rgba(212,175,55,0.5)" }} />
    </div>
  );
}

/* ── Основной контент ── */
function ArticleContent({ initialItem }: { initialItem?: NewsItem | null }) {
  const params = useSearchParams();
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const raw = params.get("d");
  let item: NewsItem | null = initialItem ?? null;
  if (!item) {
    try {
      if (raw) item = JSON.parse(decodeURIComponent(raw)) as NewsItem;
    } catch { item = null; }
  }

  if (!item) {
    return (
      <div style={{ minHeight: "100vh", background: "#030303", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif" }}>
        <span style={{ fontSize: 13 }}>Новость не найдена</span>
        <button onClick={() => router.push("/")} style={{ fontSize: 10, letterSpacing: "0.22em", color: GOLD, background: "none", border: "none", cursor: "pointer", textTransform: "uppercase" }}>← На главную</button>
      </div>
    );
  }

  const hostname = (() => {
    try { return new URL(item.link).hostname.replace(/^www\./, ""); }
    catch { return item.source || ""; }
  })();

  const showHeroImage = !!item.thumbnail && !imgError;


  return (
    <div style={{ minHeight: "100vh", background: "#030303", color: "#fafafa", fontFamily: "Inter, ui-sans-serif, sans-serif" }}>
      <ReadingProgress />

      {/* ── Шапка ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        height: 54, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        background: "rgba(3,3,3,0.9)",
        borderBottom: "1px solid rgba(212,175,55,0.07)",
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.6)",
      }}>
        <button
          onClick={() => router.back()}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", padding: 0, transition: "color 180ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.38)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4.5 7L9 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Назад
        </button>

        <a href="/" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.4)", overflow: "hidden", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt="Mirakt" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.36em", color: GOLD, textTransform: "uppercase" }}>MIRAKT</span>
        </a>

        <div style={{ width: 56 }} />
      </header>

      {/* ── Герой: фото максимально чистое ── */}
      {showHeroImage && (
        <div style={{ position: "relative", width: "100%", height: "clamp(340px, 65vw, 700px)", overflow: "hidden", background: "#050404" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnail}
            alt={item.title}
            onError={() => setImgError(true)}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              objectPosition: "center 25%",
              filter: "contrast(1.14) saturate(1.22) brightness(1.0)",
            }}
          />
          {/* Градиент только снизу */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "58%", background: "linear-gradient(to top, rgba(3,3,3,1) 0%, rgba(3,3,3,0.8) 26%, rgba(3,3,3,0.28) 58%, transparent 100%)" }} />

          {/* Только время и заголовок, без источника */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 clamp(20px, 6vw, 96px) 44px" }}>
            <div style={{ maxWidth: 820, margin: "0 auto" }}>
              {item.pubDate && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {timeAgo(item.pubDate)}
                  </span>
                </div>
              )}
              <h1 style={{ fontFamily: SERIF, fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, lineHeight: 1.22, color: "#ffffff", letterSpacing: "-0.01em", textShadow: "0 2px 24px rgba(0,0,0,0.7)", margin: 0 }}>
                {item.title}
              </h1>
            </div>
          </div>
        </div>
      )}

      {/* ── Контентная колонка ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: `${showHeroImage ? "44px" : "0"} clamp(20px, 5vw, 48px) 100px` }}>

        {/* Заголовок если нет фото */}
        {!showHeroImage && (
          <div style={{ paddingTop: 52, marginBottom: 36 }}>
            {item.pubDate && (
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 16, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {timeAgo(item.pubDate)}
              </span>
            )}
            <h1 style={{ fontFamily: SERIF, fontSize: "clamp(24px, 4.5vw, 40px)", fontWeight: 700, lineHeight: 1.24, color: "#fff", letterSpacing: "-0.01em", margin: 0 }}>
              {item.title}
            </h1>
          </div>
        )}

        {/* Разделитель */}
        <div style={{ height: 1, background: "linear-gradient(90deg, rgba(212,175,55,0.3), transparent)", marginBottom: 32 }} />

        {/* ── Текст — один абзац, сериф ── */}
        {item.description && (
          <p style={{
            fontFamily: SERIF,
            fontSize: 12,
            lineHeight: 1.95,
            color: "rgba(255,255,255,0.68)",
            marginBottom: 36,
            letterSpacing: "0.016em",
          }}>
            {item.description}
          </p>
        )}


        {/* ── Редакционная статья: полный текст ── */}
        {item.editorial && item.content ? (
          <div>
            {item.content.split("\n").filter(Boolean).map((para, i) => (
              <p key={i} style={{
                fontFamily: SERIF,
                fontSize: 17,
                lineHeight: 1.85,
                color: "rgba(255,255,255,0.78)",
                marginBottom: 22,
                letterSpacing: "0.012em",
              }}>
                {para}
              </p>
            ))}
          </div>
        ) : (
          /* ── Кнопка — единственное место с источником ── */
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackRead()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "17px 22px",
              background: "linear-gradient(135deg, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0.04) 100%)",
              border: "1px solid rgba(212,175,55,0.26)",
              borderRadius: 10,
              textDecoration: "none",
              transition: "transform 160ms, box-shadow 200ms, border-color 200ms, background 200ms",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.transform = "translateY(-2px)";
              el.style.boxShadow = "0 8px 32px rgba(212,175,55,0.10)";
              el.style.borderColor = "rgba(212,175,55,0.48)";
              el.style.background = "linear-gradient(135deg, rgba(212,175,55,0.17) 0%, rgba(212,175,55,0.08) 100%)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.transform = "";
              el.style.boxShadow = "";
              el.style.borderColor = "rgba(212,175,55,0.26)";
              el.style.background = "linear-gradient(135deg, rgba(212,175,55,0.10) 0%, rgba(212,175,55,0.04) 100%)";
            }}
          >
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 5 }}>
                Читать полностью
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: GOLD, letterSpacing: "0.02em" }}>
                {hostname}
              </div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5h9M7.5 3L11 6.5 7.5 10" stroke={GOLD} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </a>
        )}

        {/* Нижняя строка */}
        <div style={{ marginTop: 52, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.2)", overflow: "hidden", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_SRC} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Mirakt — агрегатор новостей</span>
          </div>
          <button
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(212,175,55,0.34)", padding: 0, transition: "color 180ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(212,175,55,0.34)"; }}
          >
            ← Все новости
          </button>
        </div>
      </div>
    </div>
  );
}

export function ArticleClient({ initialItem }: { initialItem?: NewsItem | null }) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#030303", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, color: "rgba(255,255,255,0.25)", fontFamily: "Inter, sans-serif", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid rgba(212,175,55,0.25)", borderTopColor: "rgba(212,175,55,0.7)", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Загрузка
        </div>
      }
    >
      <ArticleContent initialItem={initialItem} />
    </Suspense>
  );
}
