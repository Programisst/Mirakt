import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";
import { uniqueSlug } from "@/lib/slugify";

// Run the pipeline synchronously inside the full Hobby-tier window (60s).
export const maxDuration = 60;

// ── Supabase admin (bypasses RLS for inserts) ─────────────────────────────────
function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── RSS feeds ─────────────────────────────────────────────────────────────────
// The feed tag is only a HINT for balancing how many candidates we take per topic.
// The REAL category of each saved article is decided by the AI per story (callGroq),
// so a misfiled RSS item still lands in the correct tab.
// Only top sources that reliably embed editorial photos in their RSS (media:content / media:thumbnail).
// Two sources per category gives enough daily volume while keeping image hit-rate near 100%.
const FEEDS: { url: string; category: string }[] = [
  // World — RIA + Lenta both include media:content/thumbnail
  { url: "https://ria.ru/export/rss2/world/index.xml",         category: "world" },
  { url: "https://lenta.ru/rss/news/world",                    category: "world" },
  // Russia — RIA society + Lenta russia
  { url: "https://ria.ru/export/rss2/society/index.xml",       category: "russia" },
  { url: "https://lenta.ru/rss/news/russia",                   category: "russia" },
  // Politics — RIA politics + TASS
  { url: "https://ria.ru/export/rss2/politics/index.xml",      category: "politics" },
  { url: "https://tass.ru/rss/v2.xml",                         category: "politics" },
  // Economy — RIA economy + Lenta economics
  { url: "https://ria.ru/export/rss2/economy/index.xml",       category: "economy" },
  { url: "https://lenta.ru/rss/news/economics",                category: "economy" },
  // Science — N+1 + Lenta science (both reliably have images)
  { url: "https://nplus1.ru/rss",                              category: "science" },
  { url: "https://lenta.ru/rss/news/science",                  category: "science" },
  // Crimea — RIA Crimea (has images) + regional backup
  { url: "https://crimea.ria.ru/export/rss2/index.xml",        category: "crimea" },
  { url: "https://crimea-news.com/rss.xml",                    category: "crimea" },
];

// ── Candidate article ─────────────────────────────────────────────────────────
interface Candidate {
  title: string;
  description: string;
  fullContent: string;
  link: string;
  thumbnail: string;
  pubDate: string;
  category: string;
}

// ── RSS parser ────────────────────────────────────────────────────────────────
type MediaNode =
  | { $?: { url?: string } }
  | Array<{ $?: { url?: string } }>
  | undefined;

const rssParser = new Parser<Record<string, unknown>, {
  "media:content"?: MediaNode;
  "media:thumbnail"?: MediaNode;
  "content:encoded"?: string;
  enclosure?: { url?: string };
}>({
  customFields: {
    item: [
      ["media:content",   "media:content"],
      ["media:thumbnail", "media:thumbnail"],
      ["content:encoded", "content:encoded"],
    ],
  },
  timeout: 15_000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; Mirakt/1.0)" },
});

function extractImage(item: Parameters<typeof rssParser.parseURL>[0] extends never ? never : Awaited<ReturnType<typeof rssParser.parseURL>>["items"][0]): string {
  const mc = item["media:content"] as MediaNode;
  if (Array.isArray(mc) && mc[0]?.$?.url) return mc[0].$!.url!;
  if (!Array.isArray(mc) && mc?.$?.url)   return mc.$!.url!;
  const mt = item["media:thumbnail"] as MediaNode;
  if (Array.isArray(mt) && mt[0]?.$?.url) return mt[0].$!.url!;
  if (!Array.isArray(mt) && mt?.$?.url)   return mt.$!.url!;
  if (item.enclosure?.url)                return item.enclosure.url;
  const ce = item["content:encoded"] as string | undefined;
  if (ce) {
    const m = ce.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m?.[1]) return m[1];
  }
  return "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
}

async function fetchFeed(url: string, category: string): Promise<Candidate[]> {
  try {
    const feed = await rssParser.parseURL(url);
    return (feed.items ?? []).slice(0, 20).map((item) => {
      const ce = item["content:encoded"] as string | undefined;
      const rawFull = ce ? stripHtml(ce) : "";
      const snippet = (item.contentSnippet || item.summary || item.content || "").slice(0, 400);
      return {
        title:       item.title?.trim() ?? "",
        description: snippet,
        fullContent: rawFull.slice(0, 2000),
        link:        item.link ?? "",
        thumbnail:   extractImage(item as Parameters<typeof extractImage>[0]),
        pubDate:     item.pubDate ?? item.isoDate ?? new Date().toISOString(),
        category,
      };
    }).filter((c) => c.title && c.link);
  } catch {
    return [];
  }
}

const CAT_NAMES: Record<string, string> = {
  main: "главные новости России",
  world: "мировые новости",
  russia: "новости России",
  economy: "экономика и финансы",
  politics: "политика",
  science: "наука и технологии",
  crimea: "новости Крыма",
};

// ── Groq rewrite ──────────────────────────────────────────────────────────────
interface Rewritten {
  skip: boolean;
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;   // chosen by the AI from the 6 real sections
}

const VALID_CATS = ["world", "russia", "crimea", "economy", "science", "politics"];

async function callGroq(candidate: Candidate, apiKey?: string): Promise<Rewritten> {
  const key = apiKey ?? process.env.GROQ_API_KEY;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model:       "llama-3.1-8b-instant",
      temperature: 0.6,
      max_tokens:  1400,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Ты редактор новостного портала Mirakt.

Правила:
- Только русский язык
- Новый привлекательный заголовок (не копируй оригинал)
- excerpt: 2-3 предложения, краткое описание
- content: 350-500 слов, абзацы разделены \\n\\n, деловой стиль
- НЕ упоминай источник (РИА, ТАСС, Лента, Коммерсант и т.д.)
- category: ОПРЕДЕЛИ раздел по смыслу новости, строго одно из:
  "crimea" — про Крым/Севастополь и крымские города
  "world" — про другие страны, международные отношения (США, Украина, Турция, Китай, ЕС...)
  "russia" — события внутри России (регионы, происшествия, общество)
  "economy" — экономика, финансы, бизнес, рубль, нефть, газ, рынки
  "science" — наука, технологии, космос, медицина, здоровье, природа
  "politics" — политика, власть, законы, выборы, армия, дипломатия РФ
- Пропусти ТОЛЬКО если: секс, наркотики, ЛГБТ+, экстремизм, терроризм, дискредитация армии РФ, жестокое насилие

Верни СТРОГО валидный JSON, обязательно закрой все кавычки и скобки:
{"skip":true} — если пропустить
{"skip":false,"title":"...","excerpt":"...","content":"...","category":"..."}`,
        },
        {
          role: "user",
          content: `Заголовок: ${candidate.title}\n\nОписание: ${candidate.description}${candidate.fullContent ? `\n\nПолный текст: ${candidate.fullContent}` : ""}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? '{"skip":true}';
  return JSON.parse(text) as Rewritten;
}

// Retry once on JSON parse errors. Rate limit = skip, don't touch the chat key.
async function rewrite(candidate: Candidate): Promise<Rewritten> {
  try {
    return await callGroq(candidate);
  } catch (first) {
    const msg = String(first);
    if (msg.includes("Rate limit") || msg.includes("429")) {
      throw first;
    }
    await new Promise((r) => setTimeout(r, 800));
    return await callGroq(candidate);
  }
}

// ── Image sourcing ────────────────────────────────────────────────────────────
// Scrape real editorial photo from the original article page.
// Tries: og:image → twitter:image → first large <img> in the page body.
async function fetchPageImage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(7000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Mirakt/1.0; +https://mirakt.ru)" },
    });
    if (!res.ok) return "";
    const html = await res.text();

    // og:image (both attribute orderings)
    const ogA = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const ogB = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const og = ogA?.[1] ?? ogB?.[1] ?? "";
    if (og.startsWith("http")) return og;

    // twitter:image / twitter:image:src
    const twA = html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i);
    const twB = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i);
    const tw = twA?.[1] ?? twB?.[1] ?? "";
    if (tw.startsWith("http")) return tw;

    // First <img src> in article body that looks like a real photo (>200px implied by URL heuristics)
    const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
    for (const m of imgs) {
      const src = m[1];
      if (!src.startsWith("http")) continue;
      // Skip tiny icons, buttons, logos (common URL patterns)
      if (/icon|logo|avatar|button|sprite|pixel|1x1|blank|spacer/i.test(src)) continue;
      return src;
    }

    return "";
  } catch {
    return "";
  }
}

// Pick the best available real image for an article.
// 1) RSS thumbnail  — editorial photo embedded directly in the feed
// 2) Page scrape    — og:image → twitter:image → first article img
// If nothing found, returns "" — the card shows a clean category placeholder.
async function pickImage(candidate: Candidate, avoid: Set<string>): Promise<string> {
  if (candidate.thumbnail && candidate.thumbnail.startsWith("http") && !avoid.has(candidate.thumbnail)) {
    avoid.add(candidate.thumbnail);
    return candidate.thumbnail;
  }

  if (candidate.link) {
    const img = await fetchPageImage(candidate.link);
    if (img && !avoid.has(img)) {
      avoid.add(img);
      return img;
    }
  }

  return "";
}

interface PipelineResult {
  candidates: number;
  unique: number;
  existing_in_db: number;
  new_ones: number;
  to_process: number;
  saved: number;
  errors: string[];
}

const CRIMEA_RE = /крым|севастопол|симферопол|керч|ялт|евпатор|феодос|джанкой|алушт|бахчисара/i;

async function runPipeline(): Promise<PipelineResult> {
  const db = adminDb();
  const errors: string[] = [];

  const feedResults = await Promise.allSettled(
    FEEDS.map((f) => fetchFeed(f.url, f.category))
  );
  const candidates: Candidate[] = feedResults
    .filter((r): r is PromiseFulfilledResult<Candidate[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .filter((c) => c.title.length > 10 && c.description.length > 30);

  // Drop boring / low-value filler so only genuinely interesting news gets through.
  const BORING_RE = /гороскоп|знак[аи]? зодиак|астролог|нумеролог|погода на|прогноз погод|курс валют на|курсы валют|именинник|какой сегодня праздник|что приготовить|рецепт|кроссворд|анекдот|гадани|таро|сонник|лунн[ыеа] календар|во сколько|когда отдыхаем|выходные дни/i;
  const filtered = candidates.filter((c) => !BORING_RE.test(`${c.title} ${c.description}`));

  // "Hotness": if several feeds report the same story, it's a top story. Count how
  // many candidates share a normalized title key, then rank by that coverage.
  const titleKey = (t: string) =>
    t.toLowerCase().replace(/[^a-zа-яё0-9 ]/gi, " ").split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
  const coverage = new Map<string, number>();
  for (const c of filtered) {
    const tk = titleKey(c.title);
    coverage.set(tk, (coverage.get(tk) ?? 0) + 1);
  }

  // Dedup by link AND by normalized title key so the same event isn't saved twice.
  const seenLink = new Set<string>();
  const seenTitle = new Set<string>();
  const unique = filtered.filter((c) => {
    const tk = titleKey(c.title);
    if (seenLink.has(c.link) || seenTitle.has(tk)) return false;
    seenLink.add(c.link);
    seenTitle.add(tk);
    return true;
  });

  // Score = coverage (how many agencies cover it) + freshness bonus (last 6h).
  const now = Date.now();
  const score = (c: Candidate) => {
    const cov = coverage.get(titleKey(c.title)) ?? 1;
    const ageH = (now - new Date(c.pubDate).getTime()) / 3_600_000;
    const freshBonus = ageH < 6 ? 2 : ageH < 24 ? 1 : 0;
    return cov * 3 + freshBonus;
  };

  const links = unique.map((c) => c.link);
  const { data: existing } = await db
    .from("articles")
    .select("original_url")
    .in("original_url", links.slice(0, 500));

  const existingSet = new Set((existing ?? []).map((r: { original_url: string }) => r.original_url));
  const newOnes = unique.filter((c) => !existingSet.has(c.link));

  // Strict round-robin: 1 from each category per pass, max 2 passes.
  // Order = most content-hungry tabs first so they fill fastest.
  const feedTopics = ["world", "russia", "politics", "science", "economy", "crimea"];
  const perCat: Record<string, Candidate[]> = {};
  for (const cat of feedTopics) {
    perCat[cat] = newOnes
      .filter((c) => c.category === cat)
      .sort((a, b) => score(b) - score(a));
  }
  // Build queue: pass 1 → 1 from each (6 items), pass 2 → 1 more from each.
  // We process up to 12 candidates but stop saving once SAVE_TARGET reached,
  // so no single category dominates even when others have no new articles.
  const SAVE_TARGET = 6;
  const queue: Candidate[] = [];
  for (let i = 0; i < 2; i++) {
    for (const cat of feedTopics) {
      if (perCat[cat][i]) queue.push(perCat[cat][i]);
    }
  }
  const toProcess = queue.slice(0, 12);

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.from("articles").delete().lt("published_at", cutoff);

  // Collect images already in the DB so we never reuse the same stock photo.
  const { data: imgRows } = await db.from("articles").select("image_url").limit(1000);
  const usedImages = new Set<string>(
    (imgRows ?? []).map((r: { image_url: string | null }) => r.image_url ?? "").filter(Boolean)
  );

  const startTime = Date.now();
  let saved = 0;
  for (const candidate of toProcess) {
    if (saved >= SAVE_TARGET) break;
    if (Date.now() - startTime > 50_000) {
      errors.push(`TIME_BUDGET: stopped, ${saved} saved`);
      break;
    }
    try {
      const result = await rewrite(candidate);
      if (result.skip) {
        errors.push(`SKIP [${candidate.category}]: ${candidate.title.slice(0, 50)}`);
        continue;
      }
      if (!result.title || !result.content) {
        errors.push(`NO_CONTENT [${candidate.category}]`);
        continue;
      }

      const finalImage = await pickImage(candidate, usedImages);
      if (!finalImage) {
        errors.push(`NO_IMAGE [${candidate.category}]: ${candidate.title.slice(0, 50)}`);
        continue;
      }

      const text = `${candidate.title} ${candidate.description}`;
      let category = candidate.category;
      if (category === "crimea" && !CRIMEA_RE.test(text)) {
        category = VALID_CATS.includes(result.category ?? "") ? result.category! : "russia";
      }
      if (CRIMEA_RE.test(text)) category = "crimea";

      const slug = uniqueSlug(result.title);
      const { error } = await db.from("articles").insert({
        slug,
        title:        result.title,
        excerpt:      result.excerpt ?? result.content.slice(0, 200),
        content:      result.content,
        image_url:    finalImage,
        category,
        published_at: candidate.pubDate,
        original_url: candidate.link,
      });
      if (error) {
        errors.push(`DB_ERR [${candidate.category}]: ${error.message}`);
      } else {
        saved++;
      }
    } catch (e) {
      errors.push(`ERR [${candidate.category}]: ${String(e).slice(0, 100)}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  // All-time published counter (survives the 7-day cleanup of the articles table).
  if (saved > 0) {
    try {
      const { data: row } = await db.from("stats").select("value").eq("key", "total_published").maybeSingle();
      const current = (row?.value as number) ?? 0;
      await db.from("stats").upsert({ key: "total_published", value: current + saved });
    } catch { /* stats table optional — never block the pipeline */ }
  }

  return {
    candidates: candidates.length,
    unique: unique.length,
    existing_in_db: existingSet.size,
    new_ones: newOnes.length,
    to_process: toProcess.length,
    saved,
    errors,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runPipeline();
  return NextResponse.json({ ok: true, ...result });
}

// GET runs the same pipeline so it can be triggered/inspected from a browser.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runPipeline();
  return NextResponse.json({ ok: true, ...result });
}
