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
  // Economy
  { url: "https://www.vedomosti.ru/rss/rubric/economics",      category: "economy" },
  { url: "https://lenta.ru/rss/news/economics",                category: "economy" },
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

async function callGroq(candidate: Candidate): Promise<Rewritten> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
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

// Retry once — 8b-instant occasionally returns malformed/truncated JSON (Groq 400).
async function rewrite(candidate: Candidate): Promise<Rewritten> {
  try {
    return await callGroq(candidate);
  } catch (first) {
    if (String(first).includes("Rate limit")) throw first;
    await new Promise((r) => setTimeout(r, 800));
    return await callGroq(candidate);
  }
}

// ── Image sourcing ────────────────────────────────────────────────────────────
// Reliable professional photo from Pexels by topic keywords (free CDN, no hotlink
// block). Fetches several results and returns the first NOT already used this run
// (and not in DB), so two articles never get the same stock photo.
async function pexelsImage(query: string, avoid: Set<string>): Promise<string> {
  const key = process.env.PEXELS_API_KEY;
  if (!key || !query) return "";
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape&size=medium`,
      { headers: { Authorization: key }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return "";
    const data = await res.json();
    const photos: Array<{ src?: Record<string, string> }> = data.photos ?? [];
    let firstAvailable = "";
    for (const p of photos) {
      const url = p.src?.large ?? p.src?.landscape ?? p.src?.medium ?? "";
      if (!url) continue;
      if (!firstAvailable) firstAvailable = url;
      if (!avoid.has(url)) return url;
    }
    return firstAvailable; // all 15 already used — reuse the top one rather than nothing
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
// 1) Pexels by English keywords (reliable, professional, de-duplicated)
// 2) RSS thumbnail (the real event photo, if present)
// 3) AI generation (last resort so a card is never empty)
async function pickImage(candidate: Candidate, keywords: string, avoid: Set<string>): Promise<string> {
  // For Russia-centric tabs, bias stock search toward Russian imagery so a story
  // about Russia doesn't get e.g. an Ethiopian church or a random cow.
  const ruBias = ["russia", "russian", "moscow"];
  const kw = keywords.toLowerCase();
  const needsBias = ["russia", "crimea", "politics", "economy"].includes(candidate.category)
    && !ruBias.some((w) => kw.includes(w));
  const query = needsBias ? `${keywords} russia` : keywords;

  const pexels = await pexelsImage(query, avoid);
  if (pexels) { avoid.add(pexels); return pexels; }
  // RSS thumbnail only if it's the real article photo (skip if it was a dupe)
  if (candidate.thumbnail && candidate.thumbnail.startsWith("http") && !avoid.has(candidate.thumbnail)) {
    avoid.add(candidate.thumbnail);
    return candidate.thumbnail;
  }
  return aiImage(query);
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

  // We only use the feed tag to balance how many we pick per feed; the REAL
  // category for each saved article is decided by the AI (see callGroq) per story.
  // Dedup by link AND by a normalized title key (first 6 significant words) so the
  // same event reported by two agencies doesn't show up twice across tabs.
  const titleKey = (t: string) =>
    t.toLowerCase().replace(/[^a-zа-яё0-9 ]/gi, " ").split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
  const seenLink = new Set<string>();
  const seenTitle = new Set<string>();
  const unique = candidates.filter((c) => {
    const tk = titleKey(c.title);
    if (seenLink.has(c.link) || seenTitle.has(tk)) return false;
    seenLink.add(c.link);
    seenTitle.add(tk);
    return true;
  });

  const links = unique.map((c) => c.link);
  const { data: existing } = await db
    .from("articles")
    .select("original_url")
    .in("original_url", links.slice(0, 500));

  const existingSet = new Set((existing ?? []).map((r: { original_url: string }) => r.original_url));
  const newOnes = unique.filter((c) => !existingSet.has(c.link));

  // Crimea leads (user's priority tab); main holds general top-news that didn't
  // fit any specific section. Every article is in exactly one tab — no overlap.
  // Balance candidates across feed topics (crimea leads). The AI assigns the final
  // tab per story, so this only ensures we don't feed Groq 7 economy items at once.
  const feedTopics = ["crimea", "world", "russia", "economy", "politics", "science"];
  const perCat: Record<string, Candidate[]> = {};
  for (const cat of feedTopics) {
    perCat[cat] = newOnes
      .filter((c) => c.category === cat)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
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
