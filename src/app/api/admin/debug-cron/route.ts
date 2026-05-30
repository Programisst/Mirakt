import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const FEEDS = [
  { url: "https://lenta.ru/rss/news",                      category: "main" },
  { url: "https://ria.ru/export/rss2/index.xml",           category: "main" },
  { url: "https://lenta.ru/rss/news/world",                category: "world" },
  { url: "https://ria.ru/export/rss2/world.xml",           category: "world" },
  { url: "https://lenta.ru/rss/news/russia",               category: "russia" },
  { url: "https://ria.ru/export/rss2/politics.xml",        category: "russia" },
  { url: "https://www.vedomosti.ru/rss/rubric/economics",  category: "economy" },
  { url: "https://lenta.ru/rss/news/economics",            category: "economy" },
  { url: "https://www.vedomosti.ru/rss/rubric/politics",   category: "politics" },
  { url: "https://lenta.ru/rss/news/politics",             category: "politics" },
  { url: "https://lenta.ru/rss/news/science",              category: "science" },
  { url: "https://nplus1.ru/rss",                          category: "science" },
  { url: "https://crimea.ria.ru/export/rss2/index.xml",   category: "crimea" },
  { url: "https://lenta.ru/rss/news/ucraina",              category: "crimea" },
];

const rssParser = new Parser({ timeout: 10_000, headers: { "User-Agent": "Mozilla/5.0" } });

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? "";
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: Record<string, unknown> = {};

  // Step 1: fetch feeds
  const feedResults = await Promise.allSettled(
    FEEDS.map(async (f) => {
      try {
        const feed = await rssParser.parseURL(f.url);
        return { url: f.url, category: f.category, count: feed.items.length, ok: true };
      } catch (e) {
        return { url: f.url, category: f.category, count: 0, ok: false, error: String(e) };
      }
    })
  );
  log.feeds = feedResults.map((r) => r.status === "fulfilled" ? r.value : { error: "rejected" });

  // Step 2: count articles in DB
  const db = adminDb();
  const { count } = await db.from("articles").select("id", { count: "exact", head: true });
  log.db_count = count;

  // Step 3: test Groq
  const groqTest = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
  });
  log.groq_ok = groqTest.ok;
  log.groq_status = groqTest.status;

  // Step 4: env check
  log.env = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    groq_key: !!process.env.GROQ_API_KEY,
    cron_secret: !!process.env.CRON_SECRET,
  };

  return NextResponse.json(log, { headers: { "Cache-Control": "no-store" } });
}
