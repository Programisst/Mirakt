import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function fetchOgImage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Mirakt/1.0)" },
      signal: AbortSignal.timeout(4000),
    });
    const html = await res.text();
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    const src = m?.[1]?.trim() ?? "";
    if (src && src.startsWith("http") && !src.includes("placeholder") && !src.endsWith(".svg")) return src;
    return "";
  } catch {
    return "";
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();

  // Get up to 8 articles without image that have original_url
  const { data: articles } = await db
    .from("articles")
    .select("id, original_url")
    .is("image_url", null)
    .not("original_url", "is", null)
    .limit(8);

  if (!articles || articles.length === 0) {
    return NextResponse.json({ updated: 0, message: "No articles without images" });
  }

  // Fetch OG images in parallel (max 8 concurrent)
  const results = await Promise.allSettled(
    articles.map(async (a: { id: string; original_url: string }) => {
      const img = await fetchOgImage(a.original_url);
      if (img) {
        await db.from("articles").update({ image_url: img }).eq("id", a.id);
        return { id: a.id, img };
      }
      return null;
    })
  );

  const updated = results.filter(
    (r) => r.status === "fulfilled" && r.value !== null
  ).length;

  const remaining = (await db
    .from("articles")
    .select("id", { count: "exact", head: true })
    .is("image_url", null)).count ?? 0;

  return NextResponse.json({ updated, total: articles.length, remaining });
}
