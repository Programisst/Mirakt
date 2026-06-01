"use client";

import { useEffect, useRef, useState } from "react";

const GOLD = "#D4AF37";
const LOGO = "/image.png";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Что происходит в Крыму?",
  "Главные новости России",
  "Что нового в экономике?",
  "Расскажи про мировые события",
];

/** Simple markdown-like renderer: bold, bullet lists, line breaks */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Bullet list item
    if (/^[-*•]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[-*•]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={i} style={{ margin: "6px 0", paddingLeft: 16, listStyle: "none" }}>
          {listItems.map((item, j) => (
            <li key={j} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ color: GOLD, opacity: 0.7, flexShrink: 0, marginTop: 2 }}>◆</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      const listItems: { num: string; text: string }[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\d+)\.\s+(.*)/);
        if (m) listItems.push({ num: m[1], text: m[2] });
        i++;
      }
      elements.push(
        <ol key={i} style={{ margin: "6px 0", paddingLeft: 0, listStyle: "none" }}>
          {listItems.map((item, j) => (
            <li key={j} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ color: GOLD, opacity: 0.7, flexShrink: 0, fontWeight: 600, fontSize: 11 }}>{item.num}.</span>
              <span>{renderInline(item.text)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line = spacing
    if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 6 }} />);
      i++;
      continue;
    }

    // Normal paragraph line
    elements.push(
      <p key={i} style={{ margin: 0, lineHeight: 1.65 }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

type Props = {
  user: { email: string } | null;
  onOpenAuth: () => void;
};

export function MiraiChat({ user, onOpenAuth }: Props) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Msg = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      let reply: string;
      if (res.status === 429 || data.error === "rate_limit") {
        reply = "Слишком много запросов — подожди пару секунд и спроси снова.";
      } else {
        reply = data.reply ?? "Что-то пошло не так. Попробуй ещё раз.";
      }
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Нет соединения. Попробуй позже." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = messages.length === 0;

  if (!mounted) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Mirakt AI"
        style={{
          position: "fixed",
          bottom: "72px",
          right: "20px",
          width: "46px",
          height: "46px",
          borderRadius: "50%",
          background: open ? "rgba(212,175,55,0.95)" : "rgba(10,8,6,0.95)",
          border: `1.5px solid ${GOLD}`,
          boxShadow: open
            ? `0 0 32px rgba(212,175,55,0.45)`
            : `0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.15)`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          transition: "all 0.25s ease",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#080600" strokeWidth="2.2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={LOGO} alt="Mirakt AI" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: "50%" }} />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="mirai-window" style={{
          background: "rgba(8,7,10,0.97)",
          border: `1px solid rgba(212,175,55,0.2)`,
          boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          display: "flex",
          flexDirection: "column",
          zIndex: 999,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Mirakt" style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: `1px solid rgba(212,175,55,0.4)`,
              objectFit: "cover",
              flexShrink: 0,
            }} />
            <div>
              <div style={{ color: GOLD, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em" }}>
                Mirakt AI
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.08em", marginTop: 1 }}>
                Спрашивай про новости и не только
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade80",
              }} />
            </div>
          </div>

          {/* Auth gate */}
          {!user && (
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px 24px",
              gap: 20,
              textAlign: "center",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="" style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid rgba(212,175,55,0.4)`, objectFit: "cover", opacity: 0.85 }} />
              <div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                  Mirakt AI доступен только участникам
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, lineHeight: 1.65 }}>
                  Зарегистрируйся бесплатно — это займёт меньше минуты
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                <button
                  onClick={() => { setOpen(false); onOpenAuth(); }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 12,
                    background: GOLD,
                    border: "none",
                    color: "#080600",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                >
                  ЗАРЕГИСТРИРОВАТЬСЯ
                </button>
                <button
                  onClick={() => { setOpen(false); onOpenAuth(); }}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: 12,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.35)"; (e.currentTarget as HTMLElement).style.color = GOLD; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
                >
                  Уже есть аккаунт? Войти
                </button>
              </div>
              <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, letterSpacing: "0.1em" }}>
                ◆ БЕСПЛАТНО ◆ БЕЗ РЕКЛАМЫ ◆
              </div>
            </div>
          )}

          {/* Messages */}
          {user && <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 16px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            scrollbarWidth: "none",
          }}>
            {isEmpty && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.65, textAlign: "center" }}>
                  Привет! Задай любой вопрос — про новости на сайте или что угодно ещё.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        background: "rgba(212,175,55,0.06)",
                        border: "1px solid rgba(212,175,55,0.15)",
                        borderRadius: 10,
                        padding: "10px 14px",
                        color: "rgba(212,175,55,0.8)",
                        fontSize: 12,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        letterSpacing: "0.02em",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.12)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.35)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.06)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.15)";
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}>
                {m.role === "assistant" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={LOGO} alt="" style={{
                    width: 24, height: 24, borderRadius: "50%",
                    border: "1px solid rgba(212,175,55,0.3)",
                    objectFit: "cover",
                    flexShrink: 0,
                    marginRight: 8,
                    alignSelf: "flex-end",
                    marginBottom: 2,
                  }} />
                )}
                <div style={{
                  maxWidth: "78%",
                  padding: "10px 14px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user"
                    ? `linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.1))`
                    : "rgba(255,255,255,0.05)",
                  border: m.role === "user"
                    ? "1px solid rgba(212,175,55,0.28)"
                    : "1px solid rgba(255,255,255,0.07)",
                  color: m.role === "user" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.75)",
                  fontSize: 13,
                  lineHeight: 1.65,
                  letterSpacing: "0.01em",
                }}>
                  {m.role === "assistant" ? renderMarkdown(m.content) : m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-end", gap: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO} alt="" style={{
                  width: 24, height: 24, borderRadius: "50%",
                  border: "1px solid rgba(212,175,55,0.3)",
                  objectFit: "cover", flexShrink: 0,
                }} />
                <div style={{
                  padding: "12px 16px",
                  borderRadius: "16px 16px 16px 4px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: GOLD, opacity: 0.6,
                      animation: `miraiPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>}

          {/* Input — only for logged in users */}
          {user && <div style={{
            padding: "12px 14px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Задай вопрос..."
                disabled={loading}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 13,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                style={{
                  width: 38, height: 38,
                  borderRadius: 10,
                  background: input.trim() && !loading ? `rgba(212,175,55,0.9)` : "rgba(255,255,255,0.04)",
                  border: "none",
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: input.trim() && !loading ? "#080600" : "rgba(255,255,255,0.2)",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>}
        </div>
      )}

      <style>{`
        @keyframes miraiPulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .mirai-window {
          position: fixed;
          bottom: 128px;
          right: 20px;
          width: 370px;
          height: 520px;
          max-height: calc(100vh - 140px);
          border-radius: 20px;
        }
        @media (max-width: 480px) {
          .mirai-window {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 85dvh !important;
            max-height: 85dvh !important;
            border-radius: 20px 20px 0 0 !important;
          }
        }
      `}</style>
    </>
  );
}
