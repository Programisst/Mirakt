"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsItem as SupabaseNews } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { NewsCard } from "@/components/NewsCard";
import { Preloader } from "@/components/Preloader";
import { CATEGORIES, type CategoryId } from "@/constants/categories";
import { isCleanNewsText } from "@/lib/content-filter";
import { isValidNewsImage } from "@/lib/thumbnail";
import { GOLD, LOGO_SRC } from "@/constants/site";
import type { AuthUser, CurrencyRates, MirakcArticle, NewsItem } from "@/types/news";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/lib/locale-context";

const PAGE_SIZE       = 10;
const CACHE_TTL_MS    = 3 * 60 * 1000;
const AUTO_REFRESH_MS = 5 * 60 * 1000;

const categoryCache = new Map<string, { items: NewsItem[]; ts: number }>();

// ─────────────────────────────── Feeds ───────────────────────────────────────
/** Сначала только стабильные ленты; опциональные — ниже, чтобы не бить Netlify пачкой запросов. */
const FEEDS: Record<CategoryId, string[]> = {
  main:     [
    "https://lenta.ru/rss/news",
    "https://ria.ru/export/rss2/index.xml",
    "https://www.kommersant.ru/rss/news.xml",
  ],
  world:    [
    "https://lenta.ru/rss/news/world",
    "https://www.interfax.ru/rss",
    "https://ria.ru/export/rss2/index.xml",
    "https://tass.ru/rss/v2.xml?section=world",
  ],
  russia:   [
    "https://lenta.ru/rss/news/russia",
    "https://www.interfax.ru/rss",
    "https://ria.ru/export/rss2/index.xml",
    "https://tass.ru/rss/v2.xml?section=russia",
  ],
  crimea:   [
    "https://crimea.ria.ru/export/rss2/index.xml",
    "https://crimea-news.com/rss.xml",
    "https://lenta.ru/rss/news/russia",
    "https://ria.ru/export/rss2/index.xml",
    "https://lenta.ru/rss/news",
    "https://www.interfax.ru/rss",
  ],
  economy:  [
    "https://www.vedomosti.ru/rss/rubric/economics",
    "https://www.interfax.ru/rss",
    "https://lenta.ru/rss/news",
    "https://tass.ru/rss/v2.xml?section=economy",
  ],
  science:  [
    "https://lenta.ru/rss/news/science",
    "https://nplus1.ru/rss",
    "https://naked-science.ru/feed/gn",
    "https://www.vedomosti.ru/rss/rubric/technology",
    "https://lenta.ru/rss/news",
    "https://www.interfax.ru/rss",
    "https://www.kommersant.ru/rss/science.xml",
  ],
  politics: [
    "https://www.vedomosti.ru/rss/rubric/politics",
    "https://lenta.ru/rss/news/russia",
    "https://lenta.ru/rss/news",
    "https://www.interfax.ru/rss",
    "https://ria.ru/export/rss2/index.xml",
  ],
};

/** Догружаем по одному, если после основных лент мало материалов. */
const FEEDS_OPTIONAL: Partial<Record<CategoryId, string[]>> = {
  main: [
    "https://www.interfax.ru/rss",
    "https://tass.ru/rss/v2.xml",
  ],
  politics: [
    "https://tass.ru/rss/v2.xml?section=politics",
  ],
};

const GENERAL_FEEDS = [
  "https://lenta.ru/rss/news",
  "https://ria.ru/export/rss2/index.xml",
];

const EMERGENCY_FEED = "https://lenta.ru/rss/news";

/** null = «главная»: без ключевых слов, только общие ленты. Иначе статья попадает в категорию только при совпадении с темой. */
const CATEGORY_KEYWORDS: Record<CategoryId, string[] | null> = {
  main: null,
  world: [
    "миров", "международн", "зарубеж", "иностранн", "глобальн",
    "оон", "нато", "ес ", "ес,", "евросоюз", "европ", "ази", "африк", "америк",
    "сша", "украин", "киев", "китай", "пекин", "япон", "герман", "франц", "британ",
    "ирак", "иран", "израил", "палестин", "сирия", "афган", "коре", "индия",
    "латинск", "ближневосточн", "африканск",
    "дипломат", "посол", "переговор", "саммит", "g7", "g20",
    "мид ", "мид,", "генассамбле", "совбез",
  ],
  russia: [
    "россия", "россии", "россий", "российск", "рф ", "рф,", "рф.", "москв", "петербург", "спб",
    "кремль", "госдум", "совфед", "федерац", "президент росси", "путин",
    "област", "край ", "республик", "губернатор", "мэр ",
    "урал", "сибир", "дальневосточн", "поволж", "кавказ", "ростов", "казань",
    "минобороны", "минздрав", "правительств росси", "фсб ", "сво ", "донбасс",
  ],
  crimea: [
    "крым",
    // Города Крыма — стемы без мягкого знака ь чтобы захватить все падежи
    // (Севастополе, Севастополя, Симферополе, Симферополя и т.д.)
    "симферопол", "севастопол", "ялт", "керч", "евпатор", "феодоси",
    "байдарск", "алушт", "крымск", "черноморск", "крымскотатар", "бахчисара", "армянск",
    "джанкой", "белогорск",
    // Черное море — важная крымская тема
    "черном мор", "черного мор", "черное мор", "черноморск флот",
    // Крымский мост
    "крымск мост", "керченск мост",
  ],
  economy: [
    "экономик", "финанс", "банк", "банковск", "рубл", "доллар", "евро", "валют",
    "инфляц", "цб ", "цб,", "центробанк", "ключев", "ставка", "стагфляц", "рецесс",
    "бирж", "акци", "облигац", "инвест", "капитал", "прибыл", "убытк",
    "нефт", "газ", "экспорт", "импорт", "санкци", "таможн", "налог", "бюджет",
    "ввп", "валов", "компани", "рынок", "мосбирж", "ртс", "втб", "сбер",
    "торговл", "контракт", "закупк", "логистик", "ipo",
  ],
  science: [
    "наук", "учен", "исследован", "открыти", "технолог", "изобретен",
    "космос", "роскосмос", "спутник", "мкс", "nasa",
    "космодром", "ракетостро", "телескоп", "астроном", "марс", "лун",
    "робот", "ии ", "ии,", "искусственн интеллект", "нейросет",
    "квант", "физик", "хими", "биолог", "ген ", "днк ",
    "медицин", "здоров", "вакцин", "лечен", "врач", "клиник", "больниц",
    "университет", "институт", "лабор", "эксперимент",
    "климат", "эколог", "энергетик", "атомн", "ядерн", "космическ",
    // Здоровье и медицина — статьи о болезнях, питании, иммунитете
    "болезн", "диет", "питан", "иммун", "онкол", "вирус", "инфекц",
    "гормон", "нейрон", "психол", "стресс", "пандем", "ковид",
    "мозг", "сердц", "давлен", "витамин", "микроб", "бактер",
  ],
  politics: [
    "политик", "госдум", "совфед", "депутат", "парламент", "партия",
    "выбор", "кампани", "голосован", "оппозиц", "правительств", "министр",
    "президент", "закон ", "законопроект", "указ ", "реформ",
    "кремль", "администрац президента", "силовик",
    "геополит", "дипломат", "мид ",
    "беспилотник", "пво ", "пво,", "военн", "арми", "оборон", "нато ", "нато,",
    // Ключевые политические фигуры — без них статьи "Путин поручил / встретился" не попадают в категорию
    "путин", "мишустин", "медведев", "лавров", "патрушев", "набиуллин",
    "федеральн", "спикер", "сенатор", "фракц",
  ],
};

/** Военные темы не попадают в «Науку» и «Экономику», даже при случайном совпадении слова. */
const CATEGORY_EXCLUDE: Partial<Record<CategoryId, string[]>> = {
  science: [
    "беспилотник", "бпла", "дрон", "дронов",
    "артиллер", "миномет", "рсзо", "фронт", "наступлен", "контрнаступ",
    "всу ", "всу,", "сво ", "сво,", "сво.",
    "специальн военн", "военн операц", "военнослужащ",
    "украинск арм", "российск войск", "оккупацион",
    "ракетн удар", "ракетн обстрел", "ракетами по", "крылатых ракет",
    "херсон", "запорож", "донецк", "луганск", "одесс", "николаев",
    "мобилизован", "частичн мобилизац",
  ],
  economy: [
    "беспилотник", "бпла", "дрон", "артиллер", "всу ", "специальн военн",
    "наступлен", "фронт", "ракетн удар", "ракетн обстрел",
  ],
};

// ─────────────────────────────── Utilities ────────────────────────────────────
function matchesAny(item: NewsItem, kws: string[]): boolean {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return kws.some((k) => text.includes(k));
}

function categoryAcceptsItem(item: NewsItem, cat: CategoryId): boolean {
  const kws = CATEGORY_KEYWORDS[cat];
  if (kws === null) return true;
  if (!matchesAny(item, kws)) return false;
  const ex = CATEGORY_EXCLUDE[cat];
  if (ex && matchesAny(item, ex)) return false;
  return true;
}
function isCleanItem(item: Pick<NewsItem, "title" | "description">): boolean {
  return isCleanNewsText(item.title, item.description);
}

/** Возвращает картинку из item — API уже проверил через isValidNewsImage,
 *  двойная фильтрация здесь только отбрасывала валидные URL. */
function getImage(item: NewsItem): string {
  return item.thumbnail ?? "";
}

/** Иммутабельный дедуп по нормализованному заголовку. Новый массив, без мутаций. */
function removeDuplicates(items: readonly NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items) {
    const key = normalizeTitle(it.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...it, thumbnail: getImage(it) });
  }
  return out;
}

/** Устаревшее имя — тот же иммутабельный дедуп, оставлено для обратной совместимости. */
function dedupe(items: readonly NewsItem[]): NewsItem[] {
  return removeDuplicates(items);
}

function hostOf(it: NewsItem): string {
  try {
    return new URL(it.link).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

/** Чередование доменов, чтобы не доминировала одна лента. */
function diversifyByDomain(items: NewsItem[]): NewsItem[] {
  if (items.length < 4) return items;
  const sorted = [...items].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  const buckets = new Map<string, NewsItem[]>();
  for (const it of sorted) {
    const h = hostOf(it);
    if (!buckets.has(h)) buckets.set(h, []);
    buckets.get(h)!.push(it);
  }
  const hosts = [...buckets.keys()].sort(
    (a, b) => buckets.get(b)!.length - buckets.get(a)!.length
  );
  const out: NewsItem[] = [];
  const pos = new Map<string, number>(hosts.map((h) => [h, 0]));
  let added = true;
  while (added) {
    added = false;
    for (const h of hosts) {
      const b = buckets.get(h)!;
      const i = pos.get(h)!;
      if (i < b.length) {
        out.push(b[i]);
        pos.set(h, i + 1);
        added = true;
      }
    }
  }
  return out;
}

// ─────────────────────────────── Fetch layer ─────────────────────────────────
async function fetchFeed(url: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`/api/feed?url=${encodeURIComponent(url)}`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json.items)) return [];
    return (json.items as NewsItem[]).filter((it) => isCleanItem(it));
  } catch {
    return [];
  }
}

/**
 * Чистая функция: принимает сырые элементы RSS и категорию,
 * возвращает НОВЫЙ массив элементов, прошедших фильтр чистоты и
 * ключевых слов категории. Исходные данные не мутируются.
 */
function filterItemsForCategory(
  items: readonly NewsItem[],
  cat: CategoryId
): NewsItem[] {
  const kws = CATEGORY_KEYWORDS[cat];
  const out: NewsItem[] = [];
  for (const item of items) {
    if (!isCleanItem(item)) continue;
    if (kws !== null && !categoryAcceptsItem(item, cat)) continue;
    // Копия с нормализованной картинкой — логотипы и мусор отсекаются здесь же.
    out.push({ ...item, thumbnail: getImage(item) });
  }
  return out;
}

/**
 * Загружает и обрабатывает одну категорию ПОЛНОСТЬЮ независимо.
 * Никаких общих массивов, никаких мутаций входных данных.
 * Возвращает свежий массив новостей конкретно для этой категории.
 */
async function fetchNewsByCategory(cat: CategoryId): Promise<NewsItem[]> {
  const kws = CATEGORY_KEYWORDS[cat];
  let pool: NewsItem[] = [];

  for (const u of FEEDS[cat]) {
    const raw = await fetchFeed(u);
    pool = removeDuplicates([...pool, ...filterItemsForCategory(raw, cat)]);
    if (kws === null && pool.length >= 28) break;
    if (kws && pool.length >= 100) break;
  }

  const optional = FEEDS_OPTIONAL[cat];
  if (optional && pool.length < 14) {
    for (const u of optional) {
      const raw = await fetchFeed(u);
      pool = removeDuplicates([...pool, ...filterItemsForCategory(raw, cat)]);
      if (pool.length >= 18) break;
    }
  }

  if (pool.length < 12 && kws) {
    for (const u of GENERAL_FEEDS) {
      const raw = await fetchFeed(u);
      pool = removeDuplicates([...pool, ...filterItemsForCategory(raw, cat)]);
      if (pool.length >= 12) break;
    }
  }

  if (pool.length === 0) {
    for (const u of FEEDS[cat]) {
      const raw = await fetchFeed(u);
      pool = removeDuplicates([...pool, ...filterItemsForCategory(raw, cat)]);
      if (pool.length > 0) break;
    }
  }
  if (pool.length === 0 && cat === "main") {
    const raw = await fetchFeed(EMERGENCY_FEED);
    pool = removeDuplicates([...pool, ...filterItemsForCategory(raw, cat)]);
  }

  return diversifyByDomain(pool);
}

/** Convert a Mirakt DB article to the NewsItem shape used by NewsCard. */
function mirakcToNewsItem(a: MirakcArticle): NewsItem {
  return {
    id:          a.id,
    title:       a.title,
    description: a.excerpt,
    link:        `/novosti/${a.slug}`,
    pubDate:     a.published_at,
    thumbnail:   a.image_url ?? "",
    source:      "Mirakt",
    mirakt_slug: a.slug,
  };
}

/** Try to load Mirakt articles from DB first; fall back to RSS if DB is empty. */
async function fetchCategory(cat: CategoryId): Promise<NewsItem[]> {
  try {
    const res = await fetch(`/api/articles?category=${cat}&page=0`, { cache: "no-store" });
    if (res.ok) {
      const articles = await res.json() as MirakcArticle[];
      if (Array.isArray(articles) && articles.length >= 1) {
        return articles.map(mirakcToNewsItem);
      }
    }
  } catch { /* fall through to RSS */ }
  return fetchNewsByCategory(cat);
}

// ─────────────────────────────── News pipeline ───────────────────────────────

/** Normalize a title for fuzzy dedup: lowercase, strip punctuation, collapse spaces. */
function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[«»"""'`’‚„]/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Shingle a normalized title into 2-word tokens for Jaccard similarity. */
function titleShingles(norm: string): Set<string> {
  const words = norm.split(" ").filter((w) => w.length >= 3);
  if (words.length <= 1) return new Set(words);
  const out = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) out.add(words[i] + " " + words[i + 1]);
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Quality score: prefer items with real image, longer description, real source. */
function qualityScore(item: NewsItem): number {
  let score = 0;
  if (isValidNewsImage(item.thumbnail)) score += 50;
  const descLen = item.description?.trim().length ?? 0;
  if (descLen >= 80) score += 25;
  else if (descLen >= 40) score += 12;
  const titleLen = item.title?.trim().length ?? 0;
  if (titleLen >= 30 && titleLen <= 140) score += 10;
  if (item.source && item.source.trim()) score += 5;
  return score;
}

/** Minimum viability — must have a non-empty title. Everything else is optional. */
function isViable(item: NewsItem): boolean {
  return !!item.title && item.title.trim().length > 0;
}

function processNews(items: NewsItem[]): {
  mainNews: NewsItem | null;
  sideNews: NewsItem[];
  otherNews: NewsItem[];
} {
  // 0. Отбрасываем только полностью пустые записи (без заголовка).
  const viable = items.filter(isViable);
  if (viable.length === 0) {
    return { mainNews: null, sideNews: [], otherNews: [] };
  }

  // 1. Сортируем от свежих к старым.
  const sorted = [...viable].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  // 2. Дедуп только по почти одинаковым заголовкам:
  //    - совпадение нормализованного заголовка, или
  //    - Jaccard ≥ 0.85 (практически идентичные).
  //    Среди дублей оставляем более качественный.
  type Enriched = { item: NewsItem; norm: string; shingles: Set<string>; score: number };
  const enriched: Enriched[] = sorted.map((item) => {
    const norm = normalizeTitle(item.title);
    return { item, norm, shingles: titleShingles(norm), score: qualityScore(item) };
  });

  const kept: Enriched[] = [];
  for (const e of enriched) {
    const dupIdx = kept.findIndex(
      (k) =>
        (k.norm && e.norm && k.norm === e.norm) ||
        jaccard(k.shingles, e.shingles) >= 0.85
    );
    if (dupIdx === -1) {
      kept.push(e);
    } else if (e.score > kept[dupIdx].score) {
      kept[dupIdx] = e;
    }
  }

  // 3. Если после дедупа слишком мало — возвращаем отсортированный список
  //    (дедуп мог срезать лишнее на маленьких категориях).
  const pool: NewsItem[] =
    kept.length >= 6 ? kept.map((e) => e.item) : sorted;

  // 4. Выбираем главную: лучший quality score среди 8 свежайших.
  const freshPool = pool.slice(0, Math.min(8, pool.length));
  let bestIdx = 0;
  let bestScore = qualityScore(freshPool[0]);
  for (let i = 1; i < freshPool.length; i++) {
    const s = qualityScore(freshPool[i]);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  const main = pool[bestIdx];

  // 5. Остальное — исходный порядок, без main.
  const rest = pool.filter((_, i) => i !== bestIdx);

  // 6. Гарантия заполнения side/other: если не хватает — добираем из viable,
  //    избегая повторов по ссылке/нормализованному заголовку.
  const usedKeys = new Set<string>();
  const keyOf = (it: NewsItem) => it.link || normalizeTitle(it.title);
  usedKeys.add(keyOf(main));

  const sideNews: NewsItem[] = [];
  for (const it of rest) {
    if (sideNews.length >= 2) break;
    const k = keyOf(it);
    if (usedKeys.has(k)) continue;
    usedKeys.add(k);
    sideNews.push(it);
  }
  if (sideNews.length < 2) {
    for (const it of sorted) {
      if (sideNews.length >= 2) break;
      const k = keyOf(it);
      if (usedKeys.has(k)) continue;
      usedKeys.add(k);
      sideNews.push(it);
    }
  }

  const otherNews: NewsItem[] = [];
  for (const it of rest) {
    const k = keyOf(it);
    if (usedKeys.has(k)) continue;
    usedKeys.add(k);
    otherNews.push(it);
  }
  // Добор otherNews из сырого списка, если осталось мало.
  if (otherNews.length < 6) {
    for (const it of sorted) {
      const k = keyOf(it);
      if (usedKeys.has(k)) continue;
      usedKeys.add(k);
      otherNews.push(it);
      if (otherNews.length >= 10) break;
    }
  }

  return { mainNews: main, sideNews, otherNews };
}

// ─────────────────────────────── UI: Skeleton ────────────────────────────────
function SkeletonCard({ featured }: { featured?: boolean }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden animate-pulse ${featured ? "sm:col-span-2 lg:row-span-2" : ""}`}
      style={{ background: "rgba(24,20,14,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div style={{ height: featured ? "clamp(220px,26vw,340px)" : 168, background: "rgba(255,255,255,0.04)" }} />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-2 w-16 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/8" />
        <div className="h-3 w-4/5 rounded bg-white/6" />
        <div className="h-2 w-20 rounded bg-white/5 mt-1" />
      </div>
    </div>
  );
}

// ─────────────────────────────── UI: LoadMore ────────────────────────────────
function LoadMoreButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  const { t } = useLocale();
  return (
    <div className="flex justify-center mt-12 mb-4">
      <button
        onClick={onClick}
        disabled={busy}
        className="px-12 py-3.5 rounded-full text-[11px] font-black tracking-[0.3em] disabled:cursor-not-allowed"
        style={{
          background: busy ? "rgba(212,175,55,0.12)" : GOLD,
          color:      busy ? GOLD : "#080600",
          border:     `1.5px solid ${GOLD}`,
          transition: "background 250ms, box-shadow 250ms, transform 200ms",
        }}
        onMouseEnter={(e) => {
          if (!busy) {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.boxShadow = "0 0 32px rgba(212,175,55,0.45)";
            el.style.transform = "scale(1.03)";
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.boxShadow = "none";
          el.style.transform = "scale(1)";
        }}
      >
        {busy ? (
          <span className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full border-[1.5px] border-transparent animate-spin" style={{ borderTopColor: GOLD }} />
            {t.loading}
          </span>
        ) : t.load_more}
      </button>
    </div>
  );
}

// ─────────────────────────────── UI: AuthModal ───────────────────────────────
type AuthMode = "login" | "register";

const fieldStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  transition: "border-color 200ms",
};

function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (u: AuthUser) => void }) {
  const { t } = useLocale();
  const [mode, setMode]         = useState<AuthMode>("login");
  const [done, setDone]         = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [agreed, setAgreed]     = useState(false);

  function reset(m: AuthMode) { setMode(m); setError(""); setPassword(""); setConfirm(""); setAgreed(false); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "register") {
      if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
      if (password !== confirm) { setError(t.cab_pw_mismatch); return; }
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw new Error(
          err.message === "Invalid login credentials" ? "Неверный email или пароль" : err.message
        );
      } else {
        const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) throw new Error(
          err.message === "User already registered" ? "Этот email уже зарегистрирован" : err.message
        );
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInErr) throw new Error(signInErr.message);
      }
      onLogin({ email: email.trim() });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(24px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[380px] rounded-2xl p-8"
        style={{ background: "#0a0806", border: "1px solid rgba(212,175,55,0.22)", boxShadow: "0 32px 80px rgba(0,0,0,0.85)" }}
      >
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[13px] transition-colors"
          style={{ color: "rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.04)" }}>
          ✕
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt="Mirakt"
            style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${GOLD}`, objectFit: "cover" }} />
          <span style={{ color: GOLD, fontWeight: 700, fontSize: 15, letterSpacing: "0.12em" }}>Mirakt</span>
        </div>

        {/* ── Done (регистрация: подтверди email) ── */}
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(212,175,55,0.1)", border: `1.5px solid ${GOLD}` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" className="w-7 h-7">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-white text-[18px] font-bold mb-2">{t.auth_check_email}</h2>
            <p className="text-[13px] leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.38)" }}>
              <span style={{ color: GOLD }}>{email}</span>
            </p>
            <button onClick={() => { setDone(false); reset("login"); }}
              className="w-full h-11 rounded-xl text-[11px] font-black tracking-[0.18em]"
              style={{ background: "rgba(212,175,55,0.1)", border: `1px solid ${GOLD}`, color: GOLD }}>
              {t.auth_sign_in.replace(" →", "").toUpperCase()}
            </button>
          </div>
        ) : (
          /* ── Форма ── */
          <form onSubmit={handleSubmit}>
            <h2 className="text-white text-[20px] font-bold mb-2">
              {mode === "login" ? t.auth_login : t.auth_register}
            </h2>
            <p className="text-[13px] mb-6" style={{ color: "rgba(255,255,255,0.38)" }}>
              {mode === "login" ? (
                <>{t.auth_no_account}{" "}
                  <button type="button" onClick={() => reset("register")}
                    className="underline underline-offset-[3px] hover:opacity-80" style={{ color: GOLD, fontWeight: 600 }}>
                    {t.auth_sign_up.replace(" →", "")}
                  </button></>
              ) : (
                <>{t.auth_has_account}{" "}
                  <button type="button" onClick={() => reset("login")}
                    className="underline underline-offset-[3px] hover:opacity-80" style={{ color: GOLD, fontWeight: 600 }}>
                    {t.auth_sign_in.replace(" →", "")}
                  </button></>
              )}
            </p>

            <div className="flex flex-col gap-3 mb-4">
              {/* Email */}
              <div>
                <label className="block text-[10px] tracking-[0.22em] mb-1.5" style={{ color: "rgba(212,175,55,0.55)" }}>{t.auth_email}</label>
                <input type="email" value={email} required autoFocus autoComplete="email"
                  placeholder="name@example.com"
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="w-full h-11 rounded-xl px-4 text-[14px] text-white placeholder-white/20 outline-none"
                  style={fieldStyle}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
              </div>

              {/* Пароль */}
              <div>
                <label className="block text-[10px] tracking-[0.22em] mb-1.5" style={{ color: "rgba(212,175,55,0.55)" }}>{t.auth_password}</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password} required autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder={mode === "register" ? t.cab_min_chars : "••••••••"}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="w-full h-11 rounded-xl px-4 pr-11 text-[14px] text-white placeholder-white/20 outline-none"
                    style={fieldStyle}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-all"
                    style={{ color: showPw ? GOLD : "rgba(255,255,255,0.45)", opacity: password ? 1 : 0, pointerEvents: password ? "auto" : "none" }}>
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Подтверждение (только для регистрации) */}
              {mode === "register" && (
                <div>
                  <label className="block text-[10px] tracking-[0.22em] mb-1.5" style={{ color: "rgba(212,175,55,0.55)" }}>{t.auth_confirm}</label>
                  <div className="relative">
                    <input type={showCf ? "text" : "password"} value={confirm} required autoComplete="new-password"
                      placeholder={t.auth_repeat_password}
                      onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                      className="w-full h-11 rounded-xl px-4 pr-11 text-[14px] text-white placeholder-white/20 outline-none"
                      style={{ ...fieldStyle, borderColor: confirm && confirm !== password ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)" }}
                      onFocus={(e) => (e.target.style.borderColor = confirm !== password ? "rgba(239,68,68,0.4)" : "rgba(212,175,55,0.5)")}
                      onBlur={(e) => (e.target.style.borderColor = confirm && confirm !== password ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)")} />
                    <button type="button" onClick={() => setShowCf(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-all"
                      style={{ color: showCf ? GOLD : "rgba(255,255,255,0.45)", opacity: confirm ? 1 : 0, pointerEvents: confirm ? "auto" : "none" }}>
                      {showCf ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 mb-4 text-[12px]"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {error}
              </div>
            )}

            {mode === "register" && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: 8, background: agreed ? "rgba(212,175,55,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${agreed ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.07)"}`, transition: "all 200ms", marginBottom: 2 }}>
                <div onClick={() => setAgreed(v => !v)} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${agreed ? "rgba(212,175,55,0.8)" : "rgba(255,255,255,0.2)"}`, background: agreed ? "rgba(212,175,55,0.15)" : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 200ms" }}>
                  {agreed && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 4.5L3.5 7L8 2" stroke="rgba(212,175,55,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                  {t.auth_agree}{" "}
                  <a href="/terms" target="_blank" style={{ color: "rgba(212,175,55,0.7)", textDecoration: "underline" }}>{t.auth_terms}</a>
                  {" "}{t.auth_and}{" "}
                  <a href="/konfidencialnost" target="_blank" style={{ color: "rgba(212,175,55,0.7)", textDecoration: "underline" }}>{t.auth_privacy}</a>
                </span>
              </label>
            )}

            <button type="submit" disabled={loading || (mode === "register" && !agreed)}
              className="w-full h-11 rounded-xl text-[11px] font-black tracking-[0.18em] transition-all"
              style={{ background: (mode === "register" && !agreed) ? "rgba(255,255,255,0.04)" : loading ? "rgba(212,175,55,0.12)" : GOLD, color: (mode === "register" && !agreed) ? "rgba(255,255,255,0.2)" : loading ? GOLD : "#080600", border: `1px solid ${(mode === "register" && !agreed) ? "rgba(255,255,255,0.08)" : GOLD}`, cursor: (mode === "register" && !agreed) ? "not-allowed" : "pointer" }}>
              {loading ? "…" : mode === "login" ? t.auth_sign_in.toUpperCase() : t.auth_sign_up.toUpperCase()}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────── Page ────────────────────────────────────────
export function HomeClient() {
  const { locale, t } = useLocale();
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [showAnalyticsLink, setShowAnalyticsLink] = useState(false);
  const [showAdminLink, setShowAdminLink] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("analytics_access") === "true") setShowAnalyticsLink(true);
      if (localStorage.getItem("admin_access") === "true") setShowAdminLink(true);
    }
  }, []);

  const [pinnedNews, setPinnedNews] = useState<SupabaseNews[]>([]);

  const [activeCategory, setActiveCategory] = useState<CategoryId>("main");

  useEffect(() => {
    const key = `cat_${activeCategory}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: `/cat/${activeCategory}`, referrer: "", ua: navigator.userAgent }),
    }).catch(() => {});
  }, [activeCategory]);

  useEffect(() => {
    fetch(`/api/news?category=${activeCategory}`)
      .then((r) => r.json())
      .then((data) => setPinnedNews(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [activeCategory]);

  const [news, setNews]             = useState<NewsItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [busy, setBusy]             = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [poolLen, setPoolLen]           = useState(0);
  const [query, setQuery]           = useState("");
  const [prices, setPrices]         = useState<CurrencyRates | null>(null);
  const [freshCount, setFreshCount] = useState(0);

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [showAuth, setShowAuth]   = useState(false);
  const [showMenu, setShowMenu]   = useState(false);

  const poolRef      = useRef<NewsItem[]>([]);
  const freshRef     = useRef<NewsItem[]>([]);
  const activeCatRef = useRef<CategoryId>("main");
  const fetchBusy    = useRef(false);
  const loadGenRef   = useRef(0);
  const menuRef      = useRef<HTMLDivElement>(null);

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) setUser({ email: data.session.user.email });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user?.email) {
        setUser(null);
      } else {
        setUser(prev => {
          // Тот же пользователь — сохраняем avatar_url/username/verified
          if (prev?.email === session.user.email) return prev;
          // Новый пользователь — сбрасываем
          return { email: session.user.email! };
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load profile data (avatar, username) after login ──────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      try {
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const p = await res.json();
          setUser(u => u ? { ...u, avatar_url: p.avatar_url, username: p.username, verified: p.verified } : null);
        }
      } catch { /* silent */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // ── Presence tracking (online status) ─────────────────────────────────────
  useEffect(() => {
    if (!user?.username) return;
    const channel = supabase.channel("online-users");
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ username: user.username });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [user?.username]);

  // ── Close menu on outside click ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Currency rates (ЦБ РФ) ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/currency");
        if (!res.ok) return;
        const d = await res.json();
        setPrices({ usd: d.usd, eur: d.eur, cny: d.cny, try: d.try, aed: d.aed });
      } catch { /* silent */ }
    };
    load();
    const id = setInterval(load, 3_600_000); // раз в час
    return () => clearInterval(id);
  }, []);

  // ── Load category ──────────────────────────────────────────────────────────
  const loadCat = useCallback(async (cat: CategoryId) => {
    const gen = ++loadGenRef.current;
    fetchBusy.current = true;
    setLoading(true);
    setFetchError(false);

    const cached = categoryCache.get(cat);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      poolRef.current = cached.items;
    } else {
      const items = await fetchCategory(cat);
      if (gen !== loadGenRef.current) {
        fetchBusy.current = false;
        setLoading(false);
        return;
      }
      poolRef.current = items;
      if (items.length > 0) categoryCache.set(cat, { items, ts: Date.now() });
      else setFetchError(true);
    }

    if (gen !== loadGenRef.current) {
      fetchBusy.current = false;
      setLoading(false);
      return;
    }

    const count = Math.min(PAGE_SIZE, poolRef.current.length);
    setNews(poolRef.current.slice(0, count));
    setVisibleCount(count);
    setPoolLen(poolRef.current.length);
    setLoading(false);
    fetchBusy.current = false;
  }, []);

  // ── Category switch ────────────────────────────────────────────────────────
  useEffect(() => {
    activeCatRef.current = activeCategory;
    poolRef.current = [];
    freshRef.current = [];
    setNews([]);
    setPoolLen(0);
    setVisibleCount(PAGE_SIZE);
    setFetchError(false);
    setFreshCount(0);
    setQuery("");
    loadCat(activeCategory);
  }, [activeCategory, loadCat]);

  // ── Background auto-refresh (every 5 min) ─────────────────────────────────
  useEffect(() => {
    const id = setInterval(async () => {
      if (fetchBusy.current) return;
      const cat = activeCatRef.current;
      const freshItems = await fetchCategory(cat);
      const existingIds = new Set(poolRef.current.map((i) => i.id));
      const newOnes = freshItems.filter((i) => !existingIds.has(i.id));
      if (newOnes.length > 0) {
        freshRef.current = newOnes;
        setFreshCount(newOnes.length);
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  // ── Apply fresh articles ───────────────────────────────────────────────────
  const handleApplyFresh = useCallback(() => {
    if (!freshRef.current.length) return;
    const combined = dedupe([...freshRef.current, ...poolRef.current]);
    combined.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    poolRef.current = combined;
    setPoolLen(combined.length);
    categoryCache.set(activeCatRef.current, { items: combined, ts: Date.now() });
    const count = Math.min(PAGE_SIZE, combined.length);
    setNews(combined.slice(0, count));
    setVisibleCount(count);
    freshRef.current = [];
    setFreshCount(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ── Load more ─────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    setBusy(true);
    setTimeout(() => {
      const nextCount = Math.min(visibleCount + PAGE_SIZE, poolRef.current.length);
      setNews(poolRef.current.slice(0, nextCount));
      setVisibleCount(nextCount);
      setBusy(false);
    }, 350);
  }, [visibleCount]);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = useCallback((u: AuthUser) => setUser(u), []);
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowMenu(false);
  }, []);

  const hasMore = visibleCount < poolLen && !query.trim();

  const filtered = query.trim()
    ? news.filter((i) =>
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.description.toLowerCase().includes(query.toLowerCase())
      )
    : news;

  const catLabel = t[`cat_${activeCategory}` as keyof typeof t] as string;

  return (
    <>
      {!preloaderDone && <Preloader onDone={() => setPreloaderDone(true)} />}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />}

      {/* New articles notification */}
      {freshCount > 0 && !loading && (
        <button
          onClick={handleApplyFresh}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold tracking-[0.18em]"
          style={{
            background:    "rgba(12,10,6,0.96)",
            border:        `1px solid ${GOLD}`,
            color:         GOLD,
            backdropFilter:"blur(16px)",
            boxShadow:     "0 4px 24px rgba(212,175,55,0.25)",
          }}
        >
          {t.new_articles(freshCount)}
        </button>
      )}

      {/* Контент под прелоадером: при fade-out за 0.5 с проступает лента (без второго «мигания» opacity) */}
      <div className="min-h-screen">
        <Navbar
          prices={prices}
          query={query}
          onQueryChange={setQuery}
          user={user}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          menuRef={menuRef}
          onOpenAuth={() => setShowAuth(true)}
          onLogout={handleLogout}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          categoryCache={categoryCache}
        />

        {/* ── Main ───────────────────────────────────────────────────────── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fadeIn">
          <div className="mb-7 flex items-center gap-3">
            <span className="w-5 h-px" style={{ background: `rgba(212,175,55,0.6)` }} />
            <h1 className="text-[10px] font-black tracking-[0.35em] text-white/22">{catLabel}</h1>
          </div>

          {/* ── Редакционные новости из Supabase ──────────────────────── */}
          {pinnedNews.length > 0 && (
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-4 h-px" style={{ background: "rgba(212,175,55,0.5)" }} />
                <span className="text-[9px] font-black tracking-[0.35em] text-white/30">{t.from_editors}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {pinnedNews.map((item) => {
                  const catName = t[`cat_${item.category}` as keyof typeof t] as string ?? item.category.toUpperCase();
                  const newsItem: NewsItem = {
                    id: `editorial-${item.id}`,
                    title: item.title,
                    description: item.subtitle ?? "",
                    link: `/news/editorial-${item.id}`,
                    pubDate: item.created_at,
                    thumbnail: item.image_url ?? "",
                    source: `MIRAKT.RU • НОВОСТИ • ${catName.toUpperCase()}`,
                    content: item.content,
                    editorial: true,
                  };
                  return (
                    <NewsCard
                      key={item.id}
                      item={newsItem}
                      category={activeCategory}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {loading && news.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} featured={i === 0} />)}
            </div>
          )}

          {!loading && fetchError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-36 gap-5">
              <span className="text-5xl" style={{ color: "rgba(212,175,55,0.18)" }}>◈</span>
              <p className="text-[10px] tracking-[0.3em] text-white/18">{t.no_data}</p>
              <button
                onClick={() => { categoryCache.delete(activeCategory); loadCat(activeCategory); }}
                className="px-6 py-2 rounded-full text-[10px] tracking-[0.2em] transition-colors"
                style={{ border: `1px solid rgba(212,175,55,0.28)`, color: "rgba(212,175,55,0.55)" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = GOLD)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(212,175,55,0.55)")}
              >
                {t.retry}
              </button>
            </div>
          )}

          {!loading && !fetchError && filtered.length === 0 && news.length > 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-white/15">
              <span className="text-4xl mb-4">◈</span>
              <p className="text-[10px] tracking-[0.3em]">{t.not_found}</p>
            </div>
          )}

          {filtered.length > 0 && (() => {
            const { mainNews, sideNews, otherNews } = query.trim()
              ? { mainNews: null, sideNews: [], otherNews: filtered }
              : processNews(filtered);

            return (
              <>
                {/* ── Hero row: main (416px) + 2 side cards (200px each, 16px gap = 416px) ── */}
                {mainNews && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-5 items-start">
                    <div className="lg:col-span-2" style={{ height: 416 }}>
                      <NewsCard
                        key={`${activeCategory}:main:0:${mainNews.id}:${mainNews.thumbnail}`}
                        item={mainNews}
                        featured
                        fill
                        eager
                        category={activeCategory}
                      />
                    </div>
                    {sideNews.length === 2 && (
                      <div className="flex flex-col gap-4" style={{ height: 416 }}>
                        {sideNews.map((item, i) => (
                          <div key={`${activeCategory}:side:${i}:${item.id}`} style={{ height: 200 }}>
                            <NewsCard
                              key={`${activeCategory}:side:card:${i}:${item.id}:${item.thumbnail}`}
                              item={item}
                              fill
                              eager
                              category={activeCategory}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Rest of the feed ── */}
                {otherNews.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {otherNews.map((item, i) => (
                      <NewsCard
                        key={`${activeCategory}:other:${i}:${item.id}:${item.thumbnail}`}
                        item={item}
                        eager={i < 7}
                        category={activeCategory}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          {!loading && !fetchError && hasMore && (
            <LoadMoreButton onClick={handleLoadMore} busy={busy} />
          )}

          {!loading && !hasMore && news.length > 0 && !query.trim() && (
            <p className="text-center py-10 text-[9px] tracking-[0.38em] text-white/10">
              ◆ {t.end_of_feed} ◆
            </p>
          )}
        </main>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="mt-8 py-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
            <a href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_SRC} alt="Mirakt" style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${GOLD}`, objectFit: "cover" }} />
              <span className="text-[11px] tracking-[0.18em]" style={{ color: GOLD, fontWeight: 700 }}>Mirakt</span>
            </a>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] tracking-widest text-white/18">
              <Link href="/o-nas"            className="hover:text-white/50 transition-colors">{t.about}</Link>
              <Link href="/kontakty"         className="hover:text-white/50 transition-colors">{t.contacts}</Link>
              <Link href="/konfidencialnost" className="hover:text-white/50 transition-colors">{t.privacy}</Link>
              <Link href="/terms"            className="hover:text-white/50 transition-colors">{t.terms}</Link>
{showAdminLink && (
                <Link href="/admin" className="hover:text-white/50 transition-colors">АДМИНКА</Link>
              )}
            </div>
            <span className="text-[9px] tracking-widest text-white/10">© 2026 MIRAKT</span>
          </div>
        </footer>
      </div>
    </>
  );
}
