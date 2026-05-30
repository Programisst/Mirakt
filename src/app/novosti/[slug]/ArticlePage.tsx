"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GOLD, LOGO_SRC } from "@/constants/site";
import { timeAgo } from "@/lib/time-ago";

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  category: string;
  published_at: string;
}

const CAT_LABEL: Record<string, string> = {
  main:     "Главное",
  world:    "Мир",
  russia:   "Россия",
  crimea:   "Крым",
  economy:  "Экономика",
  science:  "Наука",
  politics: "Политика",
};

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
      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD}, #f0d060)`, transition: "width 60ms linear" }} />
    </div>
  );
}

export function ArticlePage({ article }: { article: Article }) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const hasImage = !!article.image_url && !imgError;

  const paragraphs = article.content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: "#030303", color: "#fafafa", fontFamily: "Inter, ui-sans-serif, sans-serif" }}>
      <ReadingProgress />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        height: 54, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        background: "rgba(3,3,3,0.92)",
        borderBottom: "1px solid rgba(212,175,55,0.07)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
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

      {/* Article content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px clamp(20px, 5vw, 48px) 100px" }}>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, padding: "3px 8px", border: `1px solid rgba(212,175,55,0.3)`, borderRadius: 4 }}>
            {CAT_LABEL[article.category] ?? article.category}
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {timeAgo(article.published_at)}
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            · Редакция Mirakt
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: SERIF, fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, lineHeight: 1.25, color: "#fff", letterSpacing: "-0.01em", margin: "0 0 24px 0" }}>
          {article.title}
        </h1>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg, rgba(212,175,55,0.35), transparent)", marginBottom: 28 }} />

        {/* Image — compact, below title */}
        {hasImage && (
          <div style={{ marginBottom: 28, display: "flex", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.image_url!}
              alt={article.title}
              onError={() => setImgError(true)}
              style={{ maxWidth: "100%", maxHeight: 260, width: "auto", borderRadius: 10, objectFit: "contain", display: "block" }}
            />
          </div>
        )}

        {/* Excerpt */}
        <p style={{ fontFamily: SERIF, fontSize: 18, lineHeight: 1.75, color: "rgba(255,255,255,0.7)", marginBottom: 28, fontStyle: "italic" }}>
          {article.excerpt}
        </p>

        {/* Content */}
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.88, color: "rgba(255,255,255,0.72)", marginBottom: 22, letterSpacing: "0.012em" }}>
            {para}
          </p>
        ))}

        {/* Footer */}
        <div style={{ marginTop: 56, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.2)", overflow: "hidden", flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_SRC} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Редакция Mirakt</span>
          </div>
          <button
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)", padding: 0, transition: "color 180ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(212,175,55,0.4)"; }}
          >
            ← Все новости
          </button>
        </div>
      </div>
    </div>
  );
}
