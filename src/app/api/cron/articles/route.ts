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
const FEEDS: { url: string; category: string }[] = [
  // Crimea — multiple live regional sources so the AI has plenty to read
  { url: "https://crimea.ria.ru/export/rss2/index.xml",        category: "crimea" },
  { url: "https://crimea-news.com/rss.xml",                    category: "crimea" },
  { url: "https://kafanews.com/rss",                           category: "crimea" },
  // World
  { url: "https://lenta.ru/rss/news/world",                    category: "world" },
  // Russia
  { url: "https://lenta.ru/rss/news/russia",                   category: "russia" },
  // Economy — more sources so the tab fills like the others
  { url: "https://www.vedomosti.ru/rss/rubric/economics",      category: "economy" },
  { url: "https://lenta.ru/rss/news/economics",                category: "economy" },
  { url: "https://www.gazeta.ru/export/rss/business.xml",      category: "economy" },
  // Politics — more sources so the tab stays full
  { url: "https://www.vedomosti.ru/rss/rubric/politics",       category: "politics" },
  { url: "https://www.gazeta.ru/export/rss/politics.xml",      category: "politics" },
  { url: "https://tass.ru/rss/v2.xml",                         category: "politics" },
  // Science
  { url: "https://lenta.ru/rss/news/science",                  category: "science" },
  { url: "https://nplus1.ru/rss",                              category: "science" },
];

// ── Candidate article ─────────────────────────────────────────────────────────
interface Candidate {
  title: string;
  description: string;
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

async function fetchFeed(url: string, category: string): Promise<Candidate[]> {
  try {
    const feed = await rssParser.parseURL(url);
    return (feed.items ?? []).slice(0, 20).map((item) => ({
      title:       item.title?.trim() ?? "",
      description: (item.contentSnippet || item.summary || item.content || "").slice(0, 600),
      link:        item.link ?? "",
      thumbnail:   extractImage(item as Parameters<typeof extractImage>[0]),
      pubDate:     item.pubDate ?? item.isoDate ?? new Date().toISOString(),
      category,
    })).filter((c) => c.title && c.link);
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
  image_prompt?: string;
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
- image_prompt: 3-6 английских слов — КОНКРЕТНЫЙ видимый объект/сцена по теме (например "oil refinery pipeline", "russian parliament building", "wheat harvest field"), НЕ абстракции типа "economy"
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
{"skip":false,"title":"...","excerpt":"...","content":"...","image_prompt":"...","category":"..."}`,
        },
        {
          role: "user",
          content: `Заголовок: ${candidate.title}\n\nОписание: ${candidate.description}`,
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

// Retry logic: on JSON errors retry same key; on rate limit try the fallback key.
async function rewrite(candidate: Candidate): Promise<Rewritten> {
  try {
    return await callGroq(candidate);
  } catch (first) {
    const msg = String(first);
    if (msg.includes("Rate limit") || msg.includes("429")) {
      // Primary key exhausted — try the chat account key as fallback
      const fallbackKey = process.env.GROQ_CHAT_API_KEY;
      if (fallbackKey) {
        await new Promise((r) => setTimeout(r, 500));
        return await callGroq(candidate, fallbackKey);
      }
      throw first;
    }
    await new Promise((r) => setTimeout(r, 800));
    return await callGroq(candidate);
  }
}

// ── Image sourcing ────────────────────────────────────────────────────────────
// Scrape og:image from the original article page — used when the RSS feed
// didn't include a thumbnail directly.
async function fetchOgImage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Mirakt/1.0)" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    // og:image can appear in two attribute orderings
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const found = m?.[1] ?? "";
    return found.startsWith("http") ? found : "";
  } catch {
    return "";
  }
}

// AI image as the absolute last resort (no text artifacts at pollinations.ai
// because we avoid prompts that would cause signs/license plates).
function aiImage(prompt: string): string {
  const seed = Math.floor(Math.random() * 999999);
  const encoded = encodeURIComponent(
    `${prompt}, photorealistic news photo, no text, no signs, no logos`
  );
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=500&seed=${seed}&nologo=true`;
}

// Pick the best available image for an article.
// 1) RSS thumbnail  — real editorial photo embedded in the feed
// 2) og:image       — scraped from the source article page
// 3) AI generation  — last resort so a card is never image-less
async function pickImage(candidate: Candidate, imagePrompt: string, avoid: Set<string>): Promise<string> {
  // Real photo directly from the RSS item
  if (candidate.thumbnail && candidate.thumbnail.startsWith("http") && !avoid.has(candidate.thumbnail)) {
    avoid.add(candidate.thumbnail);
    return candidate.thumbnail;
  }

  // Scrape og:image from the original article — catches feeds that don't embed media tags
  if (candidate.link) {
    const og = await fetchOgImage(candidate.link);
    if (og && !avoid.has(og)) {
      avoid.add(og);
      return og;
    }
  }

  // AI generation — only if both RSS and og:image failed
  return aiImage(imagePrompt || candidate.title);
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

  // Balance candidates across feed topics so every tab fills evenly. Within each
  // topic, pick the HOTTEST stories first (covered by many agencies + freshest),
  // not just newest — that's what makes the feed feel top-tier. The AI assigns the
  // final tab per story; this only keeps Groq from getting 7 economy items at once.
  const feedTopics = ["crimea", "world", "russia", "economy", "politics", "science"];
  const perCat: Record<string, Candidate[]> = {};
  for (const cat of feedTopics) {
    perCat[cat] = newOnes
      .filter((c) => c.category === cat)
      .sort((a, b) => score(b) - score(a));
  }
  const queue: Candidate[] = [];
  for (let i = 0; i < 2; i++) {
    for (const cat of feedTopics) {
      if (perCat[cat][i]) queue.push(perCat[cat][i]);
    }
  }
  // 7 per run fits inside 8b-instant's per-minute token limit and the 30s timeout.
  const toProcess = queue.slice(0, 7);

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
    // Stop early so we return within the 30s cron-job.org timeout.
    if (Date.now() - startTime > 26_000) {
      errors.push(`TIME_BUDGET: stopped, ${saved} saved`);
      break;
    }
    try {
      const result = await rewrite(candidate);
      if (result.skip) {
        errors.push(`SKIP [${candidate.category}]: ${candidate.title.slice(0, 50)}`);
      } else if (!result.title || !result.content) {
        errors.push(`NO_CONTENT [${candidate.category}]`);
      } else {
        // Trust the curated section feed for the tab — each feed is topic-accurate
        // (vedomosti/politics = политика, lenta/world = мир, etc.), so every tab
        // fills reliably from its own feed. The AI category is only a fallback.
        // Crimea override: anything clearly mentioning Crimea goes to Crimea; and
        // crimea-feed fluff that ISN'T about Crimea (Sochi, Turkey) falls back to AI.
        const text = `${candidate.title} ${candidate.description}`;
        let category = candidate.category;
        if (category === "crimea" && !CRIMEA_RE.test(text)) {
          category = VALID_CATS.includes(result.category ?? "") ? result.category! : "russia";
        }
        if (CRIMEA_RE.test(text)) category = "crimea";

        const finalImage = await pickImage(candidate, result.image_prompt || result.title, usedImages);
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
      }
    } catch (e) {
      errors.push(`ERR [${candidate.category}]: ${String(e).slice(0, 100)}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
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
