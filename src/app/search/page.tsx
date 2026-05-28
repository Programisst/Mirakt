"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

type UserResult = {
  username: string;
  avatar_url: string | null;
  verified: boolean;
};

function VerifiedBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="Верифицирован">
      <path
        fill="#1d9bf0"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
      />
      <path fill="#fff" d="M16.9 9.3 10.9 15.3l-3.8-3.8 1.4-1.4 2.4 2.4 4.6-4.6z" />
    </svg>
  );
}

type PresenceEntry = { username: string };

export default function SearchPage() {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<UserResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [onlineSet, setOnlineSet] = useState<Set<string>>(new Set());
  const [mounted, setMounted]     = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) setResults(await res.json());
    } catch { /* silent */ }
    setLoading(false);
    setSearched(true);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), 350);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, search]);

  // Subscribe to online presence
  useEffect(() => {
    const channel = supabase.channel("online-users");
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceEntry>();
        const names = new Set(
          Object.values(state).flatMap((s) => s).map((p) => p.username)
        );
        setOnlineSet(names);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "#08070a" }}>
      <div className="max-w-xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 text-[11px] tracking-widest uppercase hover:opacity-70 transition-opacity"
          style={{ color: GOLD_DIM }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          На главную
        </Link>

        <h1
          className="text-2xl font-bold mb-2 tracking-tight"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          Найти пользователей
        </h1>
        <p className="text-[12px] mb-8" style={{ color: "rgba(255,255,255,0.3)" }}>
          Поиск по никнейму
        </p>

        {/* Search input */}
        <div className="relative mb-8">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: GOLD_DIM }}
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Введите никнейм…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full h-11 rounded-xl pl-11 pr-4 text-[14px] text-white/80 placeholder-white/20 outline-none"
            style={{
              background:   "rgba(255,255,255,0.05)",
              border:       `1px solid rgba(212,175,55,0.25)`,
              transition:   "border-color 200ms",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
            onBlur={(e)  => (e.target.style.borderColor = "rgba(212,175,55,0.25)")}
          />
          {loading && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: GOLD_DIM }}
            />
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="flex flex-col gap-2">
            {results.map((u) => {
              const initial = u.username[0].toUpperCase();
              return (
                <Link
                  key={u.username}
                  href={`/profile/${u.username}`}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border:     "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.2)";
                    (e.currentTarget as HTMLElement).style.background  = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.background  = "rgba(255,255,255,0.025)";
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-[15px] font-bold overflow-hidden"
                    style={{ background: "rgba(212,175,55,0.1)", border: "1.5px solid rgba(212,175,55,0.2)", color: GOLD }}
                  >
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : initial}
                  </div>

                  {/* Name + online dot */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-white/85 truncate">
                        {u.username}
                      </span>
                      {u.verified && <VerifiedBadge />}
                    </div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: onlineSet.has(u.username) ? "rgba(74,222,128,0.7)" : "rgba(255,255,255,0.2)" }}
                    >
                      ● {onlineSet.has(u.username) ? "онлайн" : "не в сети"}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="ml-auto flex-shrink-0 opacity-20 group-hover:opacity-50 transition-opacity"
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}

        {mounted && searched && results.length === 0 && !loading && (
          <p className="text-center text-[13px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            Пользователи не найдены
          </p>
        )}

      </div>
    </main>
  );
}
