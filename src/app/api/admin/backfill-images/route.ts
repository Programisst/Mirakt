import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Turn a Russian news title into 4-6 English keywords for Pexels search.
async function keywordsFromTitle(title: string): Promise<string> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        max_tokens: 30,
        messages: [
          {
            role: "user",
            content: `Дай 4-6 английских ключевых слов для поиска фотостока по этой новости. Только слова через пробел, без кавычек и пояснений.\nНовость: ${title}`,
          },
        ],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return (data.choices?.[0]?.message?.content ?? "").trim().replace(/["']/g, "");
  } catch {
    return "";
  }
}

async function pexelsImage(query: string): Promise<string> {
  const key = process.env.PEXELS_API_KEY;
  if (!key || !query) return "";
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

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();
  const { data: articles } = await db
    .from("articles")
    .select("id, title, image_url")
    .or("image_url.is.null,image_url.eq.")
    .limit(15);

  if (!articles || articles.length === 0) {
    return NextResponse.json({ message: "No articles need images", updated: 0 });
  }

  let updated = 0;
  const errors: string[] = [];
  for (const article of articles) {
    const keywords = (await keywordsFromTitle(article.title)) || article.title;
    const img = await pexelsImage(keywords);
    if (img) {
      await db.from("articles").update({ image_url: img }).eq("id", article.id);
      updated++;
    } else {
      errors.push(article.title.slice(0, 40));
    }
    await new Promise((r) => setTimeout(r, 2500));
  }

  return NextResponse.json({ updated, remaining_failed: errors, ok: true });
}
