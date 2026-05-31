"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

const LS_KEY = "admin_token";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem(LS_KEY) ?? "" : ""; }
const GOLD     = "rgba(212,175,55,0.85)";
const GOLD_DIM = "rgba(212,175,55,0.4)";

// ─── Категории ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "main",     label: "Главное"         },
  { value: "world",    label: "Мир"             },
  { value: "russia",   label: "Россия"          },
  { value: "crimea",   label: "Крым"            },
  { value: "economy",  label: "Экономика"       },
  { value: "science",  label: "Наука и техника" },
  { value: "politics", label: "Политика"        },
];

function catLabel(cat: string) {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

// ─── Типы ─────────────────────────────────────────────────────────────────────
type NewsItem = {
  id: string; title: string; subtitle: string; category: string;
  content: string; image_url: string; created_at: string; hidden: boolean;
};

type Visit = {
  ip: string; page: string; referrer: string;
  country: string; city: string; ua: string; timestamp: number; source?: string;
};

type AuthUserRecord = {
  id: string; email: string; created_at: string;
  confirmed: boolean; last_sign_in: string | null; banned: boolean;
  username: string | null; avatar_url: string | null; verified: boolean;
};

// ─── Утилиты ──────────────────────────────────────────────────────────────────
function timeStr(ts: string) {
  return new Date(ts).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(ts: number) {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return `${d}с`;
  if (d < 3600) return `${Math.floor(d / 60)}м`;
  if (d < 86400) return `${Math.floor(d / 3600)}ч`;
  return `${Math.floor(d / 86400)}д`;
}

function getBrowser(ua: string) {
  if (!ua) return "—";
  if (/YaBrowser/i.test(ua)) return "Яндекс";
  if (/Edg\//i.test(ua))     return "Edge";
  if (/OPR|Opera/i.test(ua)) return "Opera";
  if (/Chrome/i.test(ua))    return "Chrome";
  if (/Firefox/i.test(ua))   return "Firefox";
  if (/Safari/i.test(ua))    return "Safari";
  return "—";
}

const PAGE_LABELS: Record<string, string> = {
  "/":              "Главная",
  "/cat/main":      "Главная",
  "/cat/world":     "Мир",
  "/cat/russia":    "Россия",
  "/cat/crimea":    "Крым",
  "/cat/economy":   "Экономика",
  "/cat/science":   "Наука и техника",
  "/cat/politics":  "Политика",
  "/search":        "Поиск",
  "/support":       "Поддержка",
  "/o-nas":         "О нас",
  "/kontakty":      "Контакты",
  "/terms":         "Условия",
  "/konfidencialnost": "Конфиденциальность",
};

function pageLabel(p: string) {
  if (!p || p.startsWith("/api") || p.startsWith("/auth") || p.startsWith("/_next")) return null;
  if (PAGE_LABELS[p]) return PAGE_LABELS[p];
  if (p.startsWith("/news/")) return "Статья";
  if (p.startsWith("/profile/")) return "Профиль";
  // Неизвестный или технический путь — не показываем
  return null;
}

const COUNTRY: Record<string, string> = {
  RU:"Россия",       UA:"Украина",        US:"США",            DE:"Германия",
  GB:"Великобритания", FR:"Франция",      KZ:"Казахстан",      BY:"Беларусь",
  PL:"Польша",       TR:"Турция",         NL:"Нидерланды",     CN:"Китай",
  IT:"Италия",       ES:"Испания",        AT:"Австрия",        CY:"Кипр",
  LT:"Литва",        LV:"Латвия",         EE:"Эстония",        FI:"Финляндия",
  SE:"Швеция",       NO:"Норвегия",       DK:"Дания",          CH:"Швейцария",
  CZ:"Чехия",        SK:"Словакия",       HU:"Венгрия",        RO:"Румыния",
  BG:"Болгария",     RS:"Сербия",         HR:"Хорватия",       GR:"Греция",
  PT:"Португалия",   BE:"Бельгия",        IE:"Ирландия",       IL:"Израиль",
  AE:"ОАЭ",         SA:"Саудовская Аравия", IN:"Индия",        JP:"Япония",
  KR:"Корея",        AU:"Австралия",      CA:"Канада",         BR:"Бразилия",
  MX:"Мексика",      AR:"Аргентина",      SG:"Сингапур",       TH:"Таиланд",
  ID:"Индонезия",    PH:"Филиппины",      VN:"Вьетнам",        MD:"Молдова",
  AM:"Армения",      GE:"Грузия",         AZ:"Азербайджан",    UZ:"Узбекистан",
  TM:"Туркменистан", TJ:"Таджикистан",    KG:"Кыргызстан",
};
const cName = (c: string) => COUNTRY[c] || c || "—";

const SOURCE_LABELS: Record<string, string> = {
  "direct":        "Прямой заход",
  "yandex":        "Яндекс",
  "google":        "Google",
  "telegram":      "Telegram",
  "vkontakte":     "ВКонтакте",
  "odnoklassniki": "Одноклассники",
};
function srcLabel(s: string): string {
  return SOURCE_LABELS[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Прямой заход");
}


const PERIODS = [
  { label: "1ч",  ms: 3_600_000 },
  { label: "24ч", ms: 86_400_000 },
  { label: "7д",  ms: 604_800_000 },
  { label: "30д", ms: 2_592_000_000 },
  { label: "Всё", ms: Infinity },
];

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  transition: "border-color 200ms",
};

// ─── Аналитика: мелкие компоненты ─────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-1"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}>
      <span className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>{label}</span>
      <span className="text-3xl font-black" style={{ color: GOLD }}>{value}</span>
      {sub && <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>{sub}</span>}
    </div>
  );
}

function BarList({ items, max }: { items: [string, number][]; max: number }) {
  if (!items.length) return <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>Нет данных</div>;
  return (
    <div className="space-y-2">
      {items.map(([label, count]) => (
        <div key={label}>
          <div className="flex justify-between text-[12px] mb-1">
            <span style={{ color: "rgba(255,255,255,0.75)" }}>{label}</span>
            <span style={{ color: GOLD_DIM }}>{count}</span>
          </div>
          <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-1 rounded-full"
              style={{ width: `${Math.round((count / max) * 100)}%`, background: "rgba(212,175,55,0.4)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Вкладка: Аналитика ───────────────────────────────────────────────────────
function AnalyticsTab() {
  const [raw, setRaw]           = useState<{ onlineNow: number; visits: Visit[] } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState(1);
  const [showAll, setShowAll]   = useState(false);
  const [clearing, setClearing] = useState(false);
  const [users, setUsers]         = useState<AuthUserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [banningId, setBanningId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [aStats, setAStats] = useState<{ total_published: number; live_total: number; per_category: Record<string, number> } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics", { headers: { "x-admin-auth": getToken() } });
      if (res.ok) setRaw(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, [load]);

  useEffect(() => {
    fetch("/api/admin/stats", { headers: { "x-admin-auth": getToken() } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAStats(d))
      .catch(() => {});
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users", { headers: { "x-admin-auth": getToken() } });
    const d = await res.json();
    if (Array.isArray(d)) setUsers(d);
    setUsersLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function toggleBan(u: AuthUserRecord) {
    setBanningId(u.id);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-auth": getToken() },
      body: JSON.stringify({ id: u.id, ban: !u.banned }),
    });
    await loadUsers();
    setBanningId(null);
  }

  async function toggleVerify(u: AuthUserRecord) {
    setVerifyingId(u.id);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-auth": getToken() },
      body: JSON.stringify({ id: u.id, verify: !u.verified }),
    });
    await loadUsers();
    setVerifyingId(null);
  }

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.email.toLowerCase().includes(q) ||
      (u.username ?? "").toLowerCase().includes(q),
    );
  }, [users, userQuery]);

  async function handleClear() {
    if (!confirm("Удалить все данные аналитики?")) return;
    if (!confirm("Вы уверены? Это действие нельзя отменить!")) return;
    setClearing(true);
    await fetch("/api/analytics", { method: "DELETE", headers: { "x-admin-auth": getToken() } });
    await load();
    setClearing(false);
  }

  const filtered = useMemo(() => {
    if (!raw?.visits) return [];
    const { ms } = PERIODS[period];
    if (ms === Infinity) return raw.visits;
    const cut = Date.now() - ms;
    return raw.visits.filter(v => v?.timestamp >= cut);
  }, [raw, period]);

  const stats = useMemo(() => {
    const botUA = /bot|crawler|spider|vercel|aws|googlebot|bingbot|yandex|baidu|slurp|python|curl|wget|headless|prerender|lighthouse|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|applebot|seznambot|duckduck|sogou|exabot|archive\.org|scanner|scrapy|requests\/|go-http|okhttp|java\/|ruby\//i;
    const human = filtered.filter(v => v.ua && !botUA.test(v.ua) && getBrowser(v.ua) !== "—");
    const byIP = new Map<string, Visit>();
    for (const v of human) {
      const ex = byIP.get(v.ip);
      if (!ex || v.timestamp > ex.timestamp) byIP.set(v.ip, v);
    }
    const unique = [...byIP.values()].sort((a, b) => b.timestamp - a.timestamp);
    const pageIPs: Record<string, Set<string>> = {};
    const countryCount: Record<string, number> = {};
    const sourceCount: Record<string, number> = {};
    filtered.forEach(v => {
      const label = pageLabel(v.page);
      if (!label) return;
      if (!pageIPs[label]) pageIPs[label] = new Set();
      pageIPs[label].add(v.ip);
    });
    const pageCount: Record<string, number> = {};
    for (const [label, ips] of Object.entries(pageIPs)) pageCount[label] = ips.size;
    unique.forEach(v => {
      if (v.country) countryCount[v.country] = (countryCount[v.country] || 0) + 1;
      const src = (v as Visit & { source?: string }).source || "direct";
      sourceCount[src] = (sourceCount[src] || 0) + 1;
    });
    const durations = unique.map(v => (v as Visit & { duration?: number }).duration).filter((d): d is number => !!d && d > 0);
    const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    function fmtDuration(s: number) {
      if (s < 60) return `${s}с`;
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return sec > 0 ? `${m}м ${sec}с` : `${m}м`;
    }
    return {
      uniqueIPs: unique.length,
      topPages: Object.entries(pageCount).sort((a, b) => b[1] - a[1]).slice(0, 7),
      topCountries: Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 8),
      topSources: Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s, n]) => [srcLabel(s), n] as [string, number]),
      avgDuration,
      fmtDuration,
      recent: unique,
    };
  }, [filtered]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <span className="text-sm tracking-widest uppercase" style={{ color: GOLD_DIM }}>Загрузка...</span>
    </div>
  );

  const shown = showAll ? stats.recent : stats.recent.slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Период */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] tracking-widest uppercase mr-1" style={{ color: "rgba(255,255,255,0.25)" }}>Период:</span>
        {PERIODS.map((p, i) => (
          <button key={p.label} onClick={() => { setPeriod(i); setShowAll(false); }}
            className="px-3 py-1 rounded-full text-[11px] tracking-widest transition-all"
            style={{
              border: `1px solid ${i === period ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)"}`,
              background: i === period ? "rgba(212,175,55,0.1)" : "transparent",
              color: i === period ? GOLD : "rgba(255,255,255,0.35)",
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Карточки */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Онлайн сейчас" value={raw?.onlineNow ?? 0} sub="за последние 5 мин" />
        <StatCard label="Посетителей" value={stats.uniqueIPs} sub={`за ${PERIODS[period].label}`} />
        <StatCard label="Среднее время" value={stats.avgDuration > 0 ? stats.fmtDuration(stats.avgDuration) : "—"} sub="на сайте" />
      </div>

      {/* Карточки: статьи Mirakt */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Статей опубликовано" value={aStats?.total_published ?? "—"} sub="за всё время" />
        <StatCard label="Статей на сайте" value={aStats?.live_total ?? "—"} sub="сейчас (7 дней)" />
        <StatCard label="Крым" value={aStats?.per_category?.crimea ?? "—"} sub="сейчас" />
        <StatCard label="Политика" value={aStats?.per_category?.politics ?? "—"} sub="сейчас" />
      </div>

      {/* Карточки: источники */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}>
          <div className="text-[11px] tracking-widest uppercase mb-4" style={{ color: GOLD_DIM }}>Топ разделов</div>
          <BarList items={stats.topPages} max={stats.topPages[0]?.[1] || 1} />
        </div>
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}>
          <div className="text-[11px] tracking-widest uppercase mb-4" style={{ color: GOLD_DIM }}>Источники трафика</div>
          <BarList items={stats.topSources} max={stats.topSources[0]?.[1] || 1} />
        </div>
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}>
          <div className="text-[11px] tracking-widest uppercase mb-4" style={{ color: GOLD_DIM }}>Страны</div>
          <BarList items={stats.topCountries.map(([c, n]) => [cName(c), n])} max={stats.topCountries[0]?.[1] || 1} />
        </div>
      </div>

      {/* Визиты */}
      <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Последние визиты</div>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>· обновляется автоматически</span>
          </div>
          <button onClick={handleClear} disabled={clearing}
            className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full hover:opacity-50 disabled:opacity-30"
            style={{ border: "1px solid rgba(239,68,68,0.15)", color: "rgba(239,68,68,0.3)" }}>
            {clearing ? "..." : "Сбросить данные"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ color: "rgba(255,255,255,0.25)" }}>
                <th className="text-left pb-3 font-normal pr-4">IP</th>
                <th className="text-left pb-3 font-normal pr-4">Страна</th>
                <th className="text-left pb-3 font-normal pr-4">Город</th>
                <th className="text-left pb-3 font-normal pr-4">Браузер</th>
                <th className="text-left pb-3 font-normal pr-4">Источник</th>
                <th className="text-right pb-3 font-normal">Время</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((v, i) => (
                <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="py-2 pr-4 font-mono" style={{ color: GOLD }}>{v.ip}</td>
                  <td className="py-2 pr-4" style={{ color: "rgba(255,255,255,0.5)" }}>{cName(v.country)}</td>
                  <td className="py-2 pr-4" style={{ color: "rgba(255,255,255,0.5)" }}>{v.city || "—"}</td>
                  <td className="py-2 pr-4" style={{ color: "rgba(255,255,255,0.4)" }}>{getBrowser(v.ua)}</td>
                  <td className="py-2 pr-4" style={{ color: "rgba(212,175,55,0.55)", fontSize: 11 }}>{srcLabel(v.source || "direct")}</td>
                  <td className="py-2 text-right whitespace-nowrap" style={{ color: "rgba(255,255,255,0.25)" }}>{timeAgo(v.timestamp)} назад</td>
                </tr>
              ))}
              {!stats.recent.length && (
                <tr><td colSpan={5} className="py-8 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>Нет данных</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {stats.recent.length > 10 && (
          <button onClick={() => setShowAll(v => !v)}
            className="mt-4 w-full py-2 rounded-xl text-[11px] tracking-widest uppercase hover:opacity-70"
            style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
            {showAll ? "Скрыть ▲" : `Показать все ${stats.recent.length} ▼`}
          </button>
        )}
      </div>

      {/* Зарегистрированные пользователи */}
      <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Пользователи</div>
            {!usersLoading && (
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)", color: GOLD_DIM }}>
                {userQuery ? `${filteredUsers.length}/${users.length}` : users.length}
              </span>
            )}
          </div>
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <input type="search" value={userQuery} placeholder="Поиск по email или нику…"
              onChange={(e) => { setUserQuery(e.target.value); setShowAllUsers(true); }}
              className="w-full h-8 rounded-full px-4 pl-8 text-[12px] text-white/80 placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.3)" }}>
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {usersLoading ? (
          <div className="py-6 text-center text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>Загрузка...</div>
        ) : users.length === 0 ? (
          <div className="py-6 text-center text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>Нет пользователей</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-6 text-center text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>Ничего не найдено</div>
        ) : (
          <div className="space-y-1">
            {(showAllUsers ? filteredUsers : filteredUsers.slice(0, 1)).map((u) => (
              <div key={u.id} className="flex flex-col md:flex-row md:items-center gap-3 py-3 px-1"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: u.banned ? 0.55 : 1 }}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold overflow-hidden"
                    style={{
                      background: u.banned ? "rgba(239,68,68,0.08)" : "rgba(212,175,55,0.08)",
                      border: `1px solid ${u.banned ? "rgba(239,68,68,0.2)" : "rgba(212,175,55,0.15)"}`,
                      color: u.banned ? "rgba(239,68,68,0.7)" : GOLD,
                    }}>
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (u.username?.[0] || u.email[0] || "?").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[13px] font-medium text-white truncate">
                        {u.username || u.email}
                      </span>
                      {u.verified && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                          <path fill="#1d9bf0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z" />
                          <path fill="#fff" d="M16.9 9.3 10.9 15.3l-3.8-3.8 1.4-1.4 2.4 2.4 4.6-4.6z" />
                        </svg>
                      )}
                    </div>
                    {u.username && (
                      <div className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{u.email}</div>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>
                        {new Date(u.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {u.last_sign_in && (
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>
                          · вход {timeAgo(new Date(u.last_sign_in).getTime())} назад
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap md:flex-nowrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: u.banned ? "rgba(239,68,68,0.08)" : u.confirmed ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${u.banned ? "rgba(239,68,68,0.2)" : u.confirmed ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.08)"}`,
                      color: u.banned ? "rgba(239,68,68,0.8)" : u.confirmed ? "rgba(74,222,128,0.8)" : "rgba(255,255,255,0.25)",
                    }}>
                    {u.banned ? "забанен" : u.confirmed ? "✓ активен" : "не подтв."}
                  </span>
                  <button onClick={() => toggleVerify(u)} disabled={verifyingId === u.id}
                    className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-lg hover:opacity-70 disabled:opacity-30 whitespace-nowrap"
                    style={{
                      border: `1px solid ${u.verified ? "rgba(29,155,240,0.35)" : "rgba(29,155,240,0.2)"}`,
                      background: u.verified ? "rgba(29,155,240,0.1)" : "transparent",
                      color: u.verified ? "rgba(29,155,240,0.9)" : "rgba(29,155,240,0.6)",
                    }}>
                    {verifyingId === u.id ? "..." : u.verified ? "✓ Галочка" : "Выдать ✓"}
                  </button>
                  <button onClick={() => toggleBan(u)} disabled={banningId === u.id}
                    className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-lg hover:opacity-70 disabled:opacity-30 whitespace-nowrap"
                    style={{
                      border: `1px solid ${u.banned ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)"}`,
                      color: u.banned ? "rgba(74,222,128,0.7)" : "rgba(239,68,68,0.6)",
                    }}>
                    {banningId === u.id ? "..." : u.banned ? "Разбанить" : "Забанить"}
                  </button>
                </div>
              </div>
            ))}

            {filteredUsers.length > 1 && (
              <button onClick={() => setShowAllUsers(v => !v)}
                className="w-full py-2.5 mt-1 rounded-xl text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 hover:opacity-70"
                style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>
                {showAllUsers ? "Свернуть ▲" : `Показать ещё ${filteredUsers.length - 1} ▼`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Загрузчик изображений ────────────────────────────────────────────────────
function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) { setError("Только изображения"); return; }
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST", headers: { "x-admin-auth": getToken() }, body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
    } catch (e) { setError(String(e)); }
    finally { setUploading(false); }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Изображение</label>
      {value ? (
        <div className="relative">
          <img src={value} alt="" className="w-full h-40 object-cover rounded-xl" style={{ opacity: 0.9 }} />
          <button type="button" onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-[12px] hover:opacity-80"
            style={{ background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)" }}>
            ✕
          </button>
        </div>
      ) : (
        <div tabIndex={0}
          onPaste={(e) => { const img = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/")); if (img) { const f = img.getAsFile(); if (f) upload(f); } }}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full h-32 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer"
          style={{ border: "2px dashed rgba(212,175,55,0.2)", background: "rgba(255,255,255,0.02)" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.2)")}>
          {uploading
            ? <span className="text-[12px]" style={{ color: GOLD_DIM }}>Загрузка...</span>
            : <>
                <span className="text-2xl" style={{ color: "rgba(212,175,55,0.3)" }}>↑</span>
                <span className="text-[11px] text-center px-4" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Нажмите, перетащите или вставьте (Ctrl+V)
                </span>
              </>}
        </div>
      )}
      {error && <span className="text-[11px]" style={{ color: "rgba(239,68,68,0.8)" }}>{error}</span>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </div>
  );
}

// ─── Вкладка: Новости ─────────────────────────────────────────────────────────
const EMPTY = { title: "", subtitle: "", category: "main", content: "", image_url: "" };

type ArticleStats = {
  total_published: number;
  live_total: number;
  per_category: Record<string, number>;
};

function NewsTab() {
  const [news, setNews]           = useState<NewsItem[]>([]);
  const [form, setForm]           = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showAllNews, setShowAllNews] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg]     = useState("");
  const [aStats, setAStats]         = useState<ArticleStats | null>(null);

  const loadNews = useCallback(async () => {
    const res = await fetch("/api/admin/news", { headers: { "x-admin-auth": getToken() } });
    const data = await res.json();
    if (res.ok) setNews(data);
    else setErrorMsg(`Ошибка загрузки: ${data?.error ?? res.status}`);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { headers: { "x-admin-auth": getToken() } });
      if (res.ok) setAStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadNews(); loadStats(); }, [loadNews, loadStats]);

  function set(key: keyof typeof EMPTY) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  function startEdit(item: NewsItem) {
    setEditingId(item.id);
    setForm({ title: item.title, subtitle: item.subtitle, category: item.category, content: item.content, image_url: item.image_url });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() { setEditingId(null); setForm(EMPTY); setErrorMsg(""); }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setPublishing(true); setErrorMsg("");
    try {
      const isEdit = !!editingId;
      const res = await fetch("/api/admin/news", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "x-admin-auth": getToken() },
        body: JSON.stringify(isEdit ? { id: editingId, ...form } : form),
      });
      const data = await res.json();
      if (res.ok) {
        setForm(EMPTY); setEditingId(null);
        setSuccessMsg(isEdit ? "Сохранено" : "Опубликовано");
        setTimeout(() => setSuccessMsg(""), 3000);
        await loadNews();
      } else { setErrorMsg(`Ошибка: ${data?.error ?? res.status}`); }
    } catch (err) { setErrorMsg(`Ошибка: ${String(err)}`); }
    finally { setPublishing(false); }
  }

  async function toggleHidden(item: NewsItem) {
    setTogglingId(item.id);
    await fetch("/api/admin/news", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-auth": getToken() },
      body: JSON.stringify({ id: item.id, hidden: !item.hidden }),
    });
    await loadNews(); setTogglingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить новость?")) return;
    setDeletingId(id);
    await fetch("/api/admin/news", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-auth": getToken() },
      body: JSON.stringify({ id }),
    });
    await loadNews(); setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Статистика статей */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Всего опубликовано" value={aStats?.total_published ?? "—"} sub="за всё время" />
        <StatCard label="Сейчас на сайте" value={aStats?.live_total ?? "—"} sub="за 7 дней" />
        <StatCard label="Крым" value={aStats?.per_category?.crimea ?? "—"} sub="сейчас" />
        <StatCard label="Политика" value={aStats?.per_category?.politics ?? "—"} sub="сейчас" />
      </div>

      {/* Форма */}
      <div className="rounded-2xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>
            {editingId ? "Редактировать новость" : "Добавить новость"}
          </div>
          {editingId && (
            <button type="button" onClick={cancelEdit}
              className="text-[10px] tracking-widest uppercase px-3 py-1 rounded-full hover:opacity-70"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>
              Отмена
            </button>
          )}
        </div>
        <form onSubmit={handlePublish} className="flex flex-col gap-4">
          {(["title", "subtitle"] as const).map((key) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>
                {key === "title" ? <>Заголовок <span style={{ color: "rgba(239,68,68,0.6)" }}>*</span></> : "Подзаголовок"}
              </label>
              <input type="text" value={form[key]} required={key === "title"}
                placeholder={key === "title" ? "Заголовок новости" : "Краткое описание (необязательно)"}
                onChange={(e) => set(key)(e.target.value)}
                className="h-10 rounded-xl px-4 text-white text-sm placeholder-white/15 outline-none"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.35)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
            </div>
          ))}

          <ImageUploader value={form.image_url} onChange={set("image_url")} />

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>
              Категория <span style={{ color: "rgba(239,68,68,0.6)" }}>*</span>
            </label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="h-10 rounded-xl px-4 text-sm outline-none"
              style={{ ...inputStyle, color: "rgba(255,255,255,0.85)" }}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} style={{ background: "#0f0e12", color: "white" }}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Текст новости</label>
            <textarea value={form.content} rows={6} placeholder="Полный текст..."
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="rounded-xl px-4 py-3 text-white text-sm placeholder-white/15 outline-none resize-y"
              style={{ ...inputStyle, minHeight: 120 }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.35)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={publishing}
              className="h-10 px-6 rounded-xl text-[11px] font-black tracking-[0.2em] uppercase hover:opacity-80 disabled:opacity-40"
              style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: GOLD }}>
              {publishing ? "..." : editingId ? "Сохранить" : "Опубликовать"}
            </button>
            {successMsg && <span className="text-[12px]" style={{ color: "rgba(74,222,128,0.8)" }}>✓ {successMsg}</span>}
            {errorMsg   && <span className="text-[12px]" style={{ color: "rgba(239,68,68,0.85)" }}>✗ {errorMsg}</span>}
          </div>
        </form>
      </div>

      {/* Список */}
      <div className="rounded-2xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.1)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="text-[11px] tracking-widest uppercase" style={{ color: GOLD_DIM }}>Опубликованные новости</div>
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>{news.length} шт.</span>
        </div>
        {news.length === 0 ? (
          <div className="py-8 text-center text-[13px]" style={{ color: "rgba(255,255,255,0.2)" }}>Нет новостей</div>
        ) : (
          <div className="space-y-3">
            {(showAllNews ? news : news.slice(0, 1)).map((item) => (
              <div key={item.id} className="rounded-xl p-4 flex gap-4"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", opacity: item.hidden ? 0.5 : 1 }}>
                {item.image_url && (
                  <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)", color: GOLD_DIM }}>
                          {catLabel(item.category)}
                        </span>
                        {item.hidden && (
                          <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>
                            скрыто
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{timeStr(item.created_at)}</span>
                      </div>
                      <div className="text-[13px] font-medium text-white leading-snug truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[12px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{item.subtitle}</div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 w-full mt-2">
                      <button onClick={() => startEdit(item)}
                        className="text-[10px] tracking-widest uppercase py-1.5 rounded-lg hover:opacity-70 text-center"
                        style={{ border: "1px solid rgba(212,175,55,0.2)", color: GOLD_DIM }}>
                        Изменить
                      </button>
                      <button onClick={() => toggleHidden(item)} disabled={togglingId === item.id}
                        className="text-[10px] tracking-widest uppercase py-1.5 rounded-lg hover:opacity-70 disabled:opacity-30 text-center"
                        style={{ border: `1px solid ${item.hidden ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.12)"}`, color: item.hidden ? "rgba(74,222,128,0.7)" : "rgba(255,255,255,0.35)" }}>
                        {togglingId === item.id ? "..." : item.hidden ? "Показать" : "Скрыть"}
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                        className="text-[10px] tracking-widest uppercase py-1.5 rounded-lg hover:opacity-70 disabled:opacity-30 text-center"
                        style={{ border: "1px solid rgba(239,68,68,0.25)", color: "rgba(239,68,68,0.6)" }}>
                        {deletingId === item.id ? "..." : "Удалить"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {news.length > 1 && (
              <button onClick={() => setShowAllNews(v => !v)}
                className="w-full py-2.5 rounded-xl text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 hover:opacity-70"
                style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>
                {showAllNews ? "Свернуть ▲" : `Показать ещё ${news.length - 1} ▼`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Дашборд (обёртка с вкладками) ───────────────────────────────────────────
type Tab = "news" | "analytics";

function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("news");

  function handleLogout() {
    localStorage.removeItem(LS_KEY);
    router.push("/");
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#08070a" }}>
      {/* Шапка */}
      <div className="px-3 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
        <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
          <button onClick={() => router.push("/")}
            className="flex items-center justify-center hover:opacity-60 transition-opacity flex-shrink-0"
            style={{ color: GOLD_DIM }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <img src="/image.png" alt="Mirakt" className="flex-shrink-0"
            style={{ width: 34, height: 34, objectFit: "cover", objectPosition: "center 20%", borderRadius: "50%", mixBlendMode: "screen" }} />
          <div className="w-px h-4 flex-shrink-0" style={{ background: "rgba(212,175,55,0.25)" }} />
          {([["news", "Новости"], ["analytics", "Аналитика"]] as [Tab, string][]).map(([id, name]) => (
            <button key={id} onClick={() => setTab(id)}
              className="px-2.5 md:px-4 py-1.5 rounded-full text-[10px] md:text-[11px] font-bold tracking-[0.08em] md:tracking-[0.15em] uppercase transition-all whitespace-nowrap"
              style={{
                background: tab === id ? "rgba(212,175,55,0.12)" : "transparent",
                border: `1px solid ${tab === id ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: tab === id ? GOLD : "rgba(255,255,255,0.35)",
              }}>
              {name}
            </button>
          ))}
        </div>
        <button onClick={handleLogout}
          className="text-[9px] md:text-[10px] tracking-widest uppercase px-2.5 md:px-4 py-1.5 rounded-full hover:opacity-70 flex-shrink-0 whitespace-nowrap"
          style={{ border: "1px solid rgba(239,68,68,0.4)", color: "rgba(239,68,68,0.8)", background: "rgba(239,68,68,0.08)" }}>
          Выйти
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5 max-w-3xl w-full mx-auto">
        {tab === "news"      && <NewsTab />}
        {tab === "analytics" && <AnalyticsTab />}
      </div>
    </main>
  );
}

// ─── Страница входа ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [input, setInput]   = useState("");
  const [error, setError]   = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(LS_KEY)) setAuthed(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: input }),
    });
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem(LS_KEY, token);
      setAuthed(true);
    } else {
      setError(true);
      setInput("");
    }
  }

  if (authed) return <AdminDashboard />;

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "#08070a" }}>
      <div className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.12)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-6"
          style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: GOLD }} />
        </div>
        <h1 className="text-white font-bold text-xl mb-1 tracking-tight">Администрирование Mirakt</h1>
        <p className="text-[13px] mb-7" style={{ color: "rgba(255,255,255,0.3)" }}>Введите пароль для доступа</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input type="password" value={input} autoFocus autoComplete="current-password" placeholder="••••••••••"
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              className="w-full h-11 rounded-xl px-4 text-white placeholder-white/15 outline-none text-sm"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, transition: "border-color 200ms" }}
              onFocus={(e) => { if (!error) e.target.style.borderColor = "rgba(212,175,55,0.4)"; }}
              onBlur={(e)  => { if (!error) e.target.style.borderColor = "rgba(255,255,255,0.1)"; }} />
            {error && <p className="mt-2 text-[12px]" style={{ color: "rgba(239,68,68,0.85)" }}>Неверный пароль</p>}
          </div>
          <button type="submit"
            className="w-full h-11 rounded-xl text-[11px] font-black tracking-[0.2em] uppercase hover:opacity-80"
            style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.35)", color: GOLD }}>
            Войти
          </button>
        </form>
      </div>
    </main>
  );
}
