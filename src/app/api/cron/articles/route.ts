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

// ── RSS feeds per category ────────────────────────────────────────────────────
const FEEDS: { url: string; category: string }[] = [
  { url: "https://lenta.ru/rss/news",                          category: "main" },
  { url: "https://ria.ru/export/rss2/index.xml",               category: "main" },
  { url: "https://lenta.ru/rss/news/world",                    category: "world" },
  { url: "https://tass.ru/rss/v2.xml",                         category: "world" },
  { url: "https://lenta.ru/rss/news/russia",                   category: "russia" },
  { url: "https://ria.ru/export/rss2/index.xml",               category: "russia" },
  { url: "https://www.vedomosti.ru/rss/rubric/economics",      category: "economy" },
  { url: "https://lenta.ru/rss/news/economics",                category: "economy" },
  { url: "https://www.vedomosti.ru/rss/rubric/politics",       category: "politics" },
  { url: "https://lenta.ru/rss/news/politics",                 category: "politics" },
  { url: "https://lenta.ru/rss/news/science",                  category: "science" },
  { url: "https://nplus1.ru/rss",                              category: "science" },
  { url: "https://crimea.ria.ru/export/rss2/index.xml",        category: "crimea" },
  { url: "https://lenta.ru/rss/news/ucraina",                  category: "crimea" },
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
}

async function rewrite(candidate: Candidate): Promise<Rewritten> {
  const catName = CAT_NAMES[candidate.category] ?? candidate.category;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens:  1000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Ты редактор новостного портала Mirakt. Раздел: «${catName}».

Правила:
- Только русский язык
- Новый привлекательный заголовок (не копируй оригинал)
- excerpt: 2-3 предложения, краткое описание
- content: 450-600 слов, абзацы разделены \\n\\n, деловой стиль
- НЕ упоминай источник (РИА, ТАСС, Лента, Коммерсант и т.д.)
- image_prompt: 6-10 слов на английском для AI генерации фото, по теме статьи
- Пропусти ТОЛЬКО если: секс, наркотики, ЛГБТ+, экстремизм, терроризм, дискредитация армии РФ, жестокое насилие

Ответ ТОЛЬКО в JSON:
{"skip":true} — если пропустить
{"skip":false,"title":"...","excerpt":"...","content":"...","image_prompt":"..."}`,
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
  try {
    return JSON.parse(text) as Rewritten;
  } catch {
    return { skip: true };
  }
}

// ── Image sourcing ────────────────────────────────────────────────────────────
// Reliable professional photo from Pexels by topic keywords (free CDN, no hotlink block)
async function pexelsImage(query: string): Promise<string> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return "";
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&size=medium`,
      { headers: { Authorization: key }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return "";
    const data = await res.json();
    const photo = data.photos?.[0];
    return photo?.src?.large ?? photo?.src?.landscape ?? photo?.src?.medium ?? "";
  } catch {
    return "";
  }
}

// AI fallback if Pexels returns nothing
function aiImage(prompt: string): string {
  const seed = Math.floor(Math.random() * 999999);
  const encoded = encodeURIComponent(
    `${prompt}, photorealistic, high quality news photo, no text`
  );
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=500&seed=${seed}&nologo=true`;
}

// Pick the best available image for an article.
// 1) Pexels by English keywords (reliable, professional, never blocked)
// 2) RSS thumbnail (the real event photo, if present)
// 3) AI generation (last resort so a card is never empty)
async function pickImage(candidate: Candidate, keywords: string): Promise<string> {
  const pexels = await pexelsImage(keywords);
  if (pexels) return pexels;
  if (candidate.thumbnail && candidate.thumbnail.startsWith("http")) return candidate.thumbnail;
  return aiImage(keywords);
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

  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seen.has(c.link)) return false;
    seen.add(c.link);
    return true;
  });

  const links = unique.map((c) => c.link);
  const { data: existing } = await db
    .from("articles")
    .select("original_url")
    .in("original_url", links.slice(0, 500));

  const existingSet = new Set((existing ?? []).map((r: { original_url: string }) => r.original_url));
  const newOnes = unique.filter((c) => !existingSet.has(c.link));

  const categories = ["main", "world", "russia", "economy", "politics", "science", "crimea"];
  const MAX_PER_CAT = 2;
  const perCat: Record<string, Candidate[]> = {};
  for (const cat of categories) {
    perCat[cat] = newOnes
      .filter((c) => c.category === cat)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  }
  // Rotate which category leads each run (changes every 5 min) so that over a
  // few runs every tab gets filled even though only ~5 articles fit per run.
  const offset = Math.floor(Date.now() / (5 * 60 * 1000)) % categories.length;
  const rotated = [...categories.slice(offset), ...categories.slice(0, offset)];

  const queue: Candidate[] = [];
  for (let i = 0; i < MAX_PER_CAT; i++) {
    for (const cat of rotated) {
      if (perCat[cat][i]) queue.push(perCat[cat][i]);
    }
  }
  // Cap at 4 so we stay inside both the 30s timeout and the 8b TPM (6000/min).
  const toProcess = queue.slice(0, 4);

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.from("articles").delete().lt("published_at", cutoff);

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
        const finalImage = await pickImage(candidate, result.image_prompt || result.title);
        const slug = uniqueSlug(result.title);
        const { error } = await db.from("articles").insert({
          slug,
          title:        result.title,
          excerpt:      result.excerpt ?? result.content.slice(0, 200),
          content:      result.content,
          image_url:    finalImage,
          category:     candidate.category,
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
