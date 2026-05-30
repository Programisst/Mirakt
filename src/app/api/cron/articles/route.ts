import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";
import { uniqueSlug } from "@/lib/slugify";

// ── Supabase admin (bypasses RLS for inserts) ─────────────────────────────────
function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── RSS feeds per category ────────────────────────────────────────────────────
const FEEDS: { url: string; category: string }[] = [
  { url: "https://lenta.ru/rss/news",                              category: "main" },
  { url: "https://ria.ru/export/rss2/index.xml",                   category: "main" },
  { url: "https://tass.ru/rss/v2.xml",                             category: "main" },
  { url: "https://lenta.ru/rss/news/world",                        category: "world" },
  { url: "https://tass.ru/rss/v2.xml?section=world",               category: "world" },
  { url: "https://lenta.ru/rss/news/russia",                       category: "russia" },
  { url: "https://tass.ru/rss/v2.xml?section=russia",              category: "russia" },
  { url: "https://www.vedomosti.ru/rss/rubric/economics",          category: "economy" },
  { url: "https://tass.ru/rss/v2.xml?section=economy",             category: "economy" },
  { url: "https://www.vedomosti.ru/rss/rubric/politics",           category: "politics" },
  { url: "https://lenta.ru/rss/news/russia",                       category: "politics" },
  { url: "https://lenta.ru/rss/news/science",                      category: "science" },
  { url: "https://nplus1.ru/rss",                                  category: "science" },
  { url: "https://crimea.ria.ru/export/rss2/index.xml",            category: "crimea" },
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

// ── Groq rewrite ──────────────────────────────────────────────────────────────
interface Rewritten {
  skip: boolean;
  title?: string;
  excerpt?: string;
  content?: string;
}

async function rewrite(candidate: Candidate): Promise<Rewritten> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens:  1800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Ты редактор новостного портала Mirakt. Перепиши новость как оригинальную статью.

Правила:
- Только русский язык
- Новый привлекательный заголовок (не копируй оригинал)
- excerpt: 2-3 предложения, краткое описание
- content: 650-900 слов, абзацы разделены \\n\\n, деловой стиль
- НЕ упоминай источник (РИА, ТАСС, Лента, Коммерсант и т.д.)
- Пропусти если: секс, наркотики, ЛГБТ+, экстремизм, терроризм, дискредитация армии РФ, жестокое насилие

Ответ ТОЛЬКО в JSON:
{"skip":true} — если пропустить
{"skip":false,"title":"...","excerpt":"...","content":"..."}`,
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Fetch OG image from article page if RSS didn't provide one
async function fetchOgImage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9",
      },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
      html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i) ??
      html.match(/<img[^>]+class=["'][^"']*(?:article|main|hero|lead|photo)[^"']*["'][^>]+src=["']([^"']+)["']/i);
    const src = m?.[1]?.trim() ?? "";
    if (src && src.startsWith("http") && !src.includes("placeholder") && !src.endsWith(".svg")) return src;
    return "";
  } catch {
    return "";
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Auth check — optional if env var not available in Netlify runtime
  const secret = req.nextUrl.searchParams.get("secret") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();

  // Fetch all RSS feeds in parallel
  const feedResults = await Promise.allSettled(
    FEEDS.map((f) => fetchFeed(f.url, f.category))
  );
  const candidates: Candidate[] = feedResults
    .filter((r): r is PromiseFulfilledResult<Candidate[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .filter((c) => c.title.length > 10 && c.description.length > 30);

  // Deduplicate candidates by link
  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    if (seen.has(c.link)) return false;
    seen.add(c.link);
    return true;
  });

  // Find which original_urls are already in DB
  const links = unique.map((c) => c.link);
  const { data: existing } = await db
    .from("articles")
    .select("original_url")
    .in("original_url", links.slice(0, 500));

  const existingSet = new Set((existing ?? []).map((r: { original_url: string }) => r.original_url));
  const newOnes = unique.filter((c) => !existingSet.has(c.link));

  // Sort newest first, cap at 60 per run
  const toProcess = newOnes
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 4);

  let saved = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const candidate of toProcess) {
    try {
      // Run Groq rewrite and OG image fetch in parallel
      const [result, ogImage] = await Promise.all([
        rewrite(candidate),
        candidate.thumbnail ? Promise.resolve(candidate.thumbnail) : fetchOgImage(candidate.link),
      ]);

      const finalImage = candidate.thumbnail || ogImage || null;

      if (result.skip || !result.title || !result.content) {
        skipped++;
      } else {
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
        if (error) errors.push(error.message);
        else saved++;
      }
    } catch (e) {
      errors.push(String(e));
    }

    // Groq free tier: 30 RPM → wait 1.5s between requests
    await sleep(1500);
  }

  return NextResponse.json({
    processed: toProcess.length,
    saved,
    skipped,
    errors: errors.slice(0, 5),
  });
}

// Allow GET for quick health check
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
